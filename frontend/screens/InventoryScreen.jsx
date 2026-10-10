import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text } from 'react-native';
import { archiveProduct, createProduct, updateProduct } from '../api/client';
import useProductCatalog from '../hooks/useProductCatalog';
import InventoryHeader from '../../components/inventory/InventoryHeader';
import ProductFormModal from '../../components/inventory/ProductFormModal';
import ProductRow from '../../components/inventory/ProductRow';
import ProductSearchBar from '../../components/products/ProductSearchBar';

const emptyForm = { name: '', barcode: '', price: '', stock_quantity: '' };

export default function InventoryScreen() {
  const catalog = useProductCatalog();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { catalog.refresh(); }, [catalog.refresh]));

  function openForm(product = null) {
    setSelectedProduct(product);
    setForm(product ? {
      name: product.name,
      barcode: product.barcode,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
    } : emptyForm);
    setError('');
    setModalVisible(true);
  }

  function updateForm(changes) {
    setForm((current) => ({ ...current, ...changes }));
  }

  async function saveProduct() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) };
      selectedProduct
        ? await updateProduct(selectedProduct.id, payload)
        : await createProduct(payload);
      catalog.refresh();
      setModalVisible(false);
    } catch (requestError) {
      setError(requestError.message);
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
          <InventoryHeader onAddProduct={() => openForm()} />
          <ProductSearchBar value={catalog.query} onChangeText={catalog.setQuery} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
        product={selectedProduct}
        form={form}
        saving={saving}
        onChange={updateForm}
        onSave={saveProduct}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  error: { color: '#b00020' },
});
