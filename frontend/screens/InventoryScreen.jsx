import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text } from 'react-native';
import { archiveProduct, createProduct, getProducts, updateProduct } from '../api/client';
import InventoryHeader from '../../components/inventory/InventoryHeader';
import InventoryLoadingState from '../../components/inventory/InventoryLoadingState';
import ProductFormModal from '../../components/inventory/ProductFormModal';
import ProductRow from '../../components/inventory/ProductRow';

const emptyForm = { name: '', barcode: '', price: '', stock_quantity: '' };

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadProducts = useCallback(async () => {
    console.log('Loading products...');
    setLoading(true);
    setError('');
    try {
      setProducts(await getProducts());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(loadProducts); }, [loadProducts]);

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
      const savedProduct = selectedProduct
        ? await updateProduct(selectedProduct.id, payload)
        : await createProduct(payload);
      setProducts((current) => selectedProduct
        ? current.map((item) => item.id === savedProduct.id ? savedProduct : item)
        : [...current, savedProduct].sort((first, second) => first.name.localeCompare(second.name)));
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
      setProducts((current) => current.filter((product) => product.id !== productId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <InventoryLoadingState />;

  return (
    <>
      <FlatList
        contentContainerStyle={styles.container}
        data={products}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<><InventoryHeader onAddProduct={() => openForm()} />{error ? <Text style={styles.error}>{error}</Text> : null}</>}
        ListEmptyComponent={<Text>No products have been added yet.</Text>}
        renderItem={({ item }) => <ProductRow
          product={item}
          deleting={Boolean(deletingId)}
          onEdit={() => openForm(item)}
          onArchive={() => confirmArchive(item)}
        />}
        ListFooterComponent={<Button title="Refresh" onPress={loadProducts} />}
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
