import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { archiveProduct, createProduct, getProducts, updateProduct } from '../api/client';

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text>Loading inventory...</Text></View>;

  return (
    <>
      <FlatList
        contentContainerStyle={styles.container}
        data={products}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<><View style={styles.header}><Text style={styles.title}>Inventory</Text><Button title="Add product" onPress={() => openForm()} /></View>{error ? <Text style={styles.error}>{error}</Text> : null}</>}
        ListEmptyComponent={<Text>No products have been added yet.</Text>}
        renderItem={({ item }) => <View style={styles.row}>
          <View style={styles.productInfo}><Text style={styles.name}>{item.name}</Text><Text>{item.barcode}  ${item.price.toFixed(2)}  |  {item.stock_quantity} in stock</Text></View>
          <Button title="Edit" onPress={() => openForm(item)} disabled={Boolean(deletingId)} />
          <Button title={deletingId === item.id ? '...' : 'Archive'} onPress={() => confirmArchive(item)} disabled={Boolean(deletingId)} color="#b00020" />
        </View>}
        ListFooterComponent={<Button title="Refresh" onPress={loadProducts} />}
      />
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modal}>
        <Text style={styles.title}>{selectedProduct ? 'Edit product' : 'Add product'}</Text>
        <TextInput style={styles.formInput} placeholder="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <TextInput style={styles.formInput} placeholder="Barcode" value={form.barcode} onChangeText={(barcode) => setForm({ ...form, barcode })} />
        <TextInput style={styles.formInput} placeholder="Price" keyboardType="decimal-pad" value={form.price} onChangeText={(price) => setForm({ ...form, price })} />
        <TextInput style={styles.formInput} placeholder="Stock quantity" keyboardType="number-pad" value={form.stock_quantity} onChangeText={(stock_quantity) => setForm({ ...form, stock_quantity })} />
        <Button title={saving ? 'Saving...' : 'Save'} onPress={saveProduct} disabled={saving} />
        <Button title="Cancel" onPress={() => setModalVisible(false)} disabled={saving} />
      </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700' },
  error: { color: '#b00020' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  productInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600' },
  modal: { flex: 1, padding: 20, gap: 14, justifyContent: 'center' },
  formInput: { borderWidth: 1, borderColor: '#aaa', borderRadius: 4, padding: 12 },
});
