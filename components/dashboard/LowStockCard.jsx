import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LowStockCard({ lowStock, onInventory }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Needs restocking</Text>
          <Text style={styles.muted}>Active products with 5 units or fewer</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onInventory}>
          <Text style={styles.link}>Inventory</Text>
        </Pressable>
      </View>
      {lowStock.items.length ? lowStock.items.map((product) => (
        <View key={product.id} style={styles.productRow}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.stockPill, product.stock_quantity === 0 && styles.emptyStock]}>
            {product.stock_quantity === 0 ? 'Out of stock' : `${product.stock_quantity} left`}
          </Text>
        </View>
      )) : <Text style={styles.emptyText}>All active products have more than 5 units in stock.</Text>}
      {lowStock.count > lowStock.items.length
        ? <Text style={styles.muted}>Showing the 5 products with the lowest stock.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionHeading: { flex: 1, gap: 2 },
  sectionTitle: { color: '#18291f', fontSize: 19, fontWeight: '700', flex: 1 },
  muted: { color: '#647268', fontSize: 13 },
  link: { color: '#1759a7', fontSize: 13, fontWeight: '700', paddingVertical: 4 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#edf0ed' },
  productName: { flex: 1, color: '#24352a', fontSize: 15, fontWeight: '600' },
  stockPill: { overflow: 'hidden', color: '#85521b', backgroundColor: '#fff1d9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: '700' },
  emptyStock: { color: '#a22d21', backgroundColor: '#ffe4df' },
  emptyText: { color: '#647268', lineHeight: 20 },
});
