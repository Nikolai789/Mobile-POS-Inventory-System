import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { archiveProduct, createProduct, getProductByBarcode, restoreProduct, updateProduct } from '../api/client';
import useProductCatalog from '../hooks/useProductCatalog';
import { emptyProductForm, productFormFromProduct, validateProductForm } from '../utils/productForm';
import InventoryHeader from '../../components/inventory/InventoryHeader';
import ProductFormModal from '../../components/inventory/ProductFormModal';
import ProductRow from '../../components/inventory/ProductRow';
import ProductSearchBar from '../../components/products/ProductSearchBar';
import BarcodeScannerModal from '../../components/products/BarcodeScannerModal';

export default function InventoryScreen() {
  const catalog = useProductCatalog();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [barcodeLookupBusy, setBarcodeLookupBusy] = useState(false);
  const [retryBarcode, setRetryBarcode] = useState('');
  const barcodeLookupSequence = useRef(0);

  useFocusEffect(useCallback(() => {
    catalog.refresh();
    return () => {
      barcodeLookupSequence.current += 1;
      setScannerVisible(false);
      setBarcodeLookupBusy(false);
    };
  }, [catalog.refresh]));

  function openForm(product = null, mode = product ? 'edit' : 'add', barcode = '') {
    setSelectedProduct(product);
    setFormMode(mode);
    setForm(product ? productFormFromProduct(product, mode === 'restore') : { ...emptyProductForm, barcode });
    setError('');
    setFormError('');
    setFieldErrors({});
    setModalVisible(true);
  }

  async function resolveBarcode(barcode) {
    const request = ++barcodeLookupSequence.current;
    setScannerVisible(false);
    setRetryBarcode(barcode);
    setBarcodeLookupBusy(true);
    setError('');
    try {
      const product = await getProductByBarcode(barcode);
      if (request !== barcodeLookupSequence.current) return;
      setRetryBarcode('');
      openForm(product, product.active ? 'edit' : 'restore');
    } catch (requestError) {
      if (request !== barcodeLookupSequence.current) return;
      if (requestError.status === 404) {
        setRetryBarcode('');
        openForm(null, 'add', barcode);
      } else {
        setError(requestError.message);
      }
    } finally {
      if (request === barcodeLookupSequence.current) setBarcodeLookupBusy(false);
    }
  }

  function updateForm(changes) {
    setForm((current) => ({ ...current, ...changes }));
    setFormError('');
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(changes).forEach((key) => { delete next[key]; });
      return next;
    });
  }

  async function saveProduct() {
    const { payload, errors } = validateProductForm(form);
    setFieldErrors(errors);
    if (!payload) {
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (formMode === 'restore') await restoreProduct(selectedProduct.id, payload);
      else if (selectedProduct) await updateProduct(selectedProduct.id, payload);
      else await createProduct(payload);
      catalog.refresh();
      setModalVisible(false);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmArchive(product) {
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

  async function removeProduct(productId) {
    setDeletingId(productId);
    setError('');
    try {
      await archiveProduct(productId);
      catalog.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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
        onClose={() => { setModalVisible(false); setFormError(''); setFieldErrors({}); }}
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
      backgroundColor: '#f5f7f4' 
    },
    container: { 
      padding: 16, 
      paddingBottom: 36, 
      gap: 14 
    },
    sectionTitle: { 
      color: '#18291f', 
      fontSize: 19, 
      fontWeight: '700', 
      marginTop: 8 
    },
    errorBox: { 
      backgroundColor: '#fff1ee', 
      borderRadius: 12, 
      padding: 14 
    },
    error: { 
      color: '#a22d21', 
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
      color: '#18291f', 
      fontSize: 16, 
      fontWeight: '700' 
    },
    emptyText: { 
      color: '#647268', 
      fontSize: 13, 
      textAlign: 'center' 
    },
    retryButton: { 
      alignSelf: 'flex-start', 
      minHeight: 44, 
      justifyContent: 'center' 
    },
    retryText: { 
      color: '#17663c', 
      fontWeight: '700' 
    },
    refreshButton: { 
      minHeight: 44, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginTop: 6 
    },
    refreshText: { 
      color: '#17663c', 
      fontWeight: '700' 
    },
  }
);
