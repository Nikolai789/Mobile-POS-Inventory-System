import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text } from 'react-native';
import { archiveProduct, createProduct, getProductByBarcode, restoreProduct, updateProduct } from '../api/client';
import useProductCatalog from '../hooks/useProductCatalog';
import InventoryHeader from '../../components/inventory/InventoryHeader';
import ProductFormModal from '../../components/inventory/ProductFormModal';
import ProductRow from '../../components/inventory/ProductRow';
import ProductSearchBar from '../../components/products/ProductSearchBar';
import BarcodeScannerModal from '../../components/products/BarcodeScannerModal';

const emptyForm = { name: '', barcode: '', price: '', stock_quantity: '' };

export default function InventoryScreen() {
  const catalog = useProductCatalog();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [formError, setFormError] = useState('');
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
    setForm(product ? {
      name: product.name,
      barcode: product.barcode,
      price: String(product.price),
      stock_quantity: mode === 'restore' ? '' : String(product.stock_quantity),
    } : { ...emptyForm, barcode });
    setError('');
    setFormError('');
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
  }

  async function saveProduct() {
    const name = form.name.trim();
    const barcode = form.barcode.trim();
    const priceText = form.price.trim();
    const stockText = form.stock_quantity.trim();
    const price = Number(priceText);
    if (!name || !barcode || !priceText || !stockText || !Number.isFinite(price) || price < 0
      || Math.abs(price - Math.round(price * 100) / 100) > 0.00000001
      || !/^\d+$/.test(stockText) || !Number.isSafeInteger(Number(stockText))) {
      setFormError('Enter a name, barcode, PHP price (up to two decimals), and whole-number stock quantity.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { name, barcode, price, stock_quantity: Number(stockText) };
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
        contentContainerStyle={styles.container}
        data={catalog.loading ? [] : catalog.items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<>
          <InventoryHeader
            onAddProduct={() => openForm()}
            onScanBarcode={() => { setRetryBarcode(''); setScannerVisible(true); }}
            scanDisabled={barcodeLookupBusy || saving}
          />
          <ProductSearchBar value={catalog.query} onChangeText={catalog.setQuery} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {barcodeLookupBusy ? <ActivityIndicator accessibilityLabel="Checking barcode" /> : null}
          {retryBarcode && !barcodeLookupBusy ? <Button title="Retry barcode lookup" onPress={() => resolveBarcode(retryBarcode)} /> : null}
          {catalog.error ? <Text style={styles.error}>{catalog.error}</Text> : null}
          {catalog.loading ? <ActivityIndicator accessibilityLabel="Loading inventory" /> : null}
        </>}
        ListEmptyComponent={!catalog.loading && !catalog.error
          ? <Text>{catalog.query ? 'No matching products.' : 'No products have been added yet.'}</Text> : null}
        renderItem={({ item }) => <ProductRow
          product={item}
          deleting={Boolean(deletingId)}
          onEdit={() => openForm(item)}
          onArchive={() => confirmArchive(item)}
        />}
        onEndReached={catalog.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={<>
          {catalog.loadingMore ? <ActivityIndicator accessibilityLabel="Loading more products" /> : null}
          <Button title="Refresh" onPress={catalog.refresh} />
        </>}
      />
      <ProductFormModal
        visible={modalVisible}
        mode={formMode}
        form={form}
        saving={saving}
        error={formError}
        onChange={updateForm}
        onSave={saveProduct}
        onClose={() => { setModalVisible(false); setFormError(''); }}
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
  container: { padding: 20, gap: 14 },
  error: { color: '#b00020' },
});
