import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { createSale, getProducts } from '../api/client';
import HeroCard from '../../components/herocard';
import { fontStyle } from '../../assets/branding/font';
import ReportCard from '../../components/maincard';
import { general_layout } from '../../assets/branding/layout';

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
    <View style={general_layout.layout}>

      <Text style={fontStyle.subZenFont1}>Dashboard</Text>
      <View style={styles.grid}>
        <HeroCard label="Items Tracked" value={32} color="#84e63c" />
        <HeroCard label="Expenses" value="$321.20" color="#ecd04f" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
      </View>

      <ReportCard title= 'Sales Report' rows={[
        { name: 'Water Bottle', sold: 31, profit: '$301' },
        { name: 'Notebook', sold: 12, profit: '$84' },
        { name: 'Notebook', sold: 12, profit: '$84' },
        { name: 'Notebook', sold: 12, profit: '$84' }]}
      ></ReportCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
});
