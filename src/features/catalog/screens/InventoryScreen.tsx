import { colors } from '../../../shared/theme';
import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../../../../shared/contracts';
import { archiveProduct } from '../../../shared/api/products';
import { normalizeRequestError } from '../../../shared/api/errors';
import useProductCatalog from '../hooks/useProductCatalog';
import useBarcodeLookup from '../hooks/useBarcodeLookup';
import useProductForm from '../hooks/useProductForm';
import type { ProductFormMode } from '../utils/productForm';
import InventoryHeader from '../components/InventoryHeader';
import ProductFormModal from '../components/ProductFormModal';
import ProductRow from '../components/ProductRow';
import ProductSearchBar from '../components/ProductSearchBar';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function InventoryScreen() {
  const catalog = useProductCatalog();
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const archiving = useRef(false);
  const editor = useProductForm(catalog.refresh);
  const { saving, form, mode: formMode, error: formError, fieldErrors, visible: modalVisible, update: updateForm, save: saveProduct } = editor;
  const barcodeLookup = useBarcodeLookup();
  const barcodeLookupBusy = barcodeLookup.busy;
  const [scannerVisible, setScannerVisible] = useState(false);
  const [retryBarcode, setRetryBarcode] = useState('');
  useFocusEffect(useCallback(() => () => setScannerVisible(false), []));

  function openForm(product: Product | null = null, mode: ProductFormMode = product ? 'edit' : 'add', barcode = '') {
    setError('');
    editor.open(product, mode, barcode);
  }
  async function resolveBarcode(barcode: string) {
    setScannerVisible(false);
    setRetryBarcode(barcode);
    setError('');
    try {
      const product = await barcodeLookup.lookup(barcode);
      if (!product) return;
      setRetryBarcode('');
      openForm(product, product.active ? 'edit' : 'restore');
    } catch (cause) {
      const requestError = normalizeRequestError(cause);
      if (requestError.status === 404) { setRetryBarcode(''); openForm(null, 'add', barcode); }
      else setError(requestError.message);
    }
  }
  function confirmArchive(product: Product) {
    if (Platform.OS === 'web') {
      if (globalThis.confirm(`Archive ${product.name}? It will no longer appear in active inventory or checkout.`)) {
        removeProduct(product.id);
      }
      return;
    }
    Alert.alert('Archive product?', `${product.name} will no longer appear in the active inventory or checkout.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => removeProduct(product.id) },
    ]);
  }

  async function removeProduct(productId: number) {
    if (archiving.current) return;
    archiving.current = true;
    setDeletingId(productId);
    setError('');
    try {
      await archiveProduct(productId);
      catalog.refresh();
    } catch (cause) {
      const requestError = normalizeRequestError(cause);
      setError(requestError.message);
    } finally {
      archiving.current = false;
      setDeletingId(null);
    }
  }

  return (
    <>
      <FlatList
        style={styles.screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
        data={catalog.loading ? [] : catalog.items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<>
          <InventoryHeader
            onAddProduct={() => openForm()}
            onScanBarcode={() => { setRetryBarcode(''); setScannerVisible(true); }}
            onOpenArchived={() => router.navigate('/archived-products')}
            scanDisabled={barcodeLookupBusy || saving}
          />
          <Text style={styles.sectionTitle}>Products</Text>
          <ProductSearchBar value={catalog.query} onChangeText={catalog.setQuery} />
           <Pressable accessibilityRole="button" onPress={catalog.refresh} style={styles.refreshButton}>
             <Text style={styles.refreshText}>Refresh products</Text>
           </Pressable>
          {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}
          {barcodeLookupBusy ? <ActivityIndicator accessibilityLabel="Checking barcode" /> : null}
          {retryBarcode && !barcodeLookupBusy ? <Pressable accessibilityRole="button" onPress={() => resolveBarcode(retryBarcode)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry barcode lookup</Text>
          </Pressable> : null}
          {catalog.error ? <View style={styles.errorBox}><Text style={styles.error}>{catalog.error}</Text></View> : null}
          {catalog.loading ? <ActivityIndicator accessibilityLabel="Loading inventory" /> : null}
        </>}
        ListEmptyComponent={!catalog.loading && !catalog.error
          ? <View style={styles.emptyBox}><Text style={styles.emptyTitle}>{catalog.query ? 'No matching products' : 'No products yet'}</Text>
            <Text style={styles.emptyText}>{catalog.query ? 'Try another name or barcode.' : 'Add your first product to start tracking stock.'}</Text>
          </View> : null}
        renderItem={({ item }) => <ProductRow
          product={item}
          busy={deletingId === item.id}
          disabled={Boolean(deletingId)}
          onEdit={() => openForm(item)}
          onArchive={() => confirmArchive(item)}
        />}
        onEndReached={catalog.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={<>
          {catalog.loadingMore ? <ActivityIndicator accessibilityLabel="Loading more products" /> : null}
        </>}
      />
      <ProductFormModal
        visible={modalVisible}
        mode={formMode}
        form={form}
        saving={saving}
        error={formError}
        fieldErrors={fieldErrors}
        onChange={updateForm}
        onSave={saveProduct}
        onClose={editor.close}
      />
      {scannerVisible ? <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={resolveBarcode}
      /> : null}
    </>
  );
}

const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background
    },
    container: {
      padding: 16,
      paddingBottom: 36,
      gap: 14
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
      marginTop: 8
    },
    errorBox: {
      backgroundColor: colors.errorBackground,
      borderRadius: 12,
      padding: 14
    },
    error: {
      color: colors.error,
      fontSize: 13
    },
    emptyBox: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 22,
      alignItems: 'center',
      gap: 6
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700'
    },
    emptyText: {
      color: colors.muted,
      fontSize: 13,
      textAlign: 'center'
    },
    retryButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center'
    },
    retryText: {
      color: colors.primary,
      fontWeight: '700'
    },
    refreshButton: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6
    },
    refreshText: {
      color: colors.primary,
      fontWeight: '700'
    },
  }
);
