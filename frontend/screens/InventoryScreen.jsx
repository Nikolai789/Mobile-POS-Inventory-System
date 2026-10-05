import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { getProducts } from '../../backend/services/productService';

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      setProducts(await getProducts());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading) {
    return <ActivityIndicator style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={products}
        keyExtractor={(product) => String(product.id)}
        onRefresh={loadProducts}
        refreshing={loading}
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.barcode}>{item.barcode}</Text>
            </View>
            <View style={styles.stockBlock}>
              <Text>${item.price.toFixed(2)}</Text>
              <Text style={styles.stock}>{item.stock_quantity} in stock</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f8fa' },
  centered: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  productRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 16,
  },
  productName: { fontSize: 16, fontWeight: '600' },
  barcode: { color: '#68707d', marginTop: 4 },
  stockBlock: { alignItems: 'flex-end' },
  stock: { color: '#68707d', marginTop: 4 },
  empty: { color: '#68707d', textAlign: 'center', marginTop: 24 },
  error: { color: '#b42318', marginBottom: 12 },
});
