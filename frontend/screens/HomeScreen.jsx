import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { createSale, getProducts } from '../api/client';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setProducts(await getProducts()); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) return current.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { product_id: product.id, name: product.name, quantity: 1, price: product.price }];
    });
  }

  async function checkout() {
    setCheckingOut(true);
    setError('');
    try { await createSale(cart.map(({ product_id, quantity }) => ({ product_id, quantity }))); setCart([]); await loadProducts(); }
    catch (requestError) { setError(requestError.message); }
    finally { setCheckingOut(false); }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text>Loading products...</Text></View>;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={products}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<><Text style={styles.title}>New sale</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<Text style={styles.section}>Products</Text></>}
      ListEmptyComponent={<Text>No products available.</Text>}
      renderItem={({ item }) => <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{item.name}</Text><Text>${item.price.toFixed(2)}  |  {item.stock_quantity} in stock</Text></View><Button title="Add" disabled={!item.stock_quantity} onPress={() => addToCart(item)} /></View>}
      ListFooterComponent={<View style={styles.cart}><Text style={styles.section}>Cart</Text>{cart.map((item) => <Text key={item.product_id}>{item.name} x {item.quantity}</Text>)}<Text style={styles.total}>Total: ${total.toFixed(2)}</Text><Button title={checkingOut ? 'Processing...' : 'Complete sale'} disabled={!cart.length || checkingOut} onPress={checkout} /><Button title="Refresh" onPress={loadProducts} /></View>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  section: { fontSize: 20, fontWeight: '700', marginTop: 10 },
  error: { color: '#b00020' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600' },
  cart: { gap: 8, borderTopWidth: 1, borderTopColor: '#aaa', paddingTop: 12 },
  total: { fontSize: 18, fontWeight: '700', marginVertical: 8 },
});
