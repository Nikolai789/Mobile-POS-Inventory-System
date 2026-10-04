import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { getProducts, updateStock } from '../api/client';

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadProducts = useCallback(async () => {
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

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function saveStock(product, value) {
    const stockQuantity = Number(value);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) return;
    setSavingId(product.id);
    setError('');
    try {
      const updatedProduct = await updateStock(product.id, stockQuantity);
      setProducts((current) => current.map((item) => item.id === product.id ? updatedProduct : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text>Loading inventory...</Text></View>;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={products}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<><Text style={styles.title}>Inventory</Text>{error ? <Text style={styles.error}>{error}</Text> : null}</>}
      ListEmptyComponent={<Text>No products have been added yet.</Text>}
      renderItem={({ item }) => <View style={styles.row}>
        <View style={styles.productInfo}><Text style={styles.name}>{item.name}</Text><Text>{item.barcode}  ${item.price.toFixed(2)}</Text></View>
        <TextInput style={styles.input} defaultValue={String(item.stock_quantity)} keyboardType="number-pad" onEndEditing={(event) => saveStock(item, event.nativeEvent.text)} />
        {savingId === item.id ? <ActivityIndicator /> : null}
      </View>}
      ListFooterComponent={<Button title="Refresh" onPress={loadProducts} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  error: { color: '#b00020' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  productInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600' },
  input: { width: 70, borderWidth: 1, borderColor: '#aaa', borderRadius: 4, padding: 8, textAlign: 'center' },
});
