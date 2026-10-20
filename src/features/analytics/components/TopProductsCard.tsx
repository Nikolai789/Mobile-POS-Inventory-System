import { StyleSheet, Text, View } from 'react-native';
import type { TopProduct } from '../../../../shared/contracts';
import { formatMoney } from '../../../shared/utils/money';
import { colors } from '../../../shared/theme';

export default function TopProductsCard({ products }: { products: TopProduct[] }) {
  const maximum = products[0]?.units_sold || 1;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Best-selling products</Text>
    <Text style={styles.muted}>Top 10 ranked by units sold</Text>
    {products.length === 0 ? <Text style={styles.empty}>Products will appear here after a sale.</Text> : null}
    {products.map((product, index) => <View
      key={product.product_id}
      style={styles.row}
      accessible
      accessibilityLabel={`Rank ${index + 1}: ${product.name}. ${product.units_sold} ${product.units_sold === 1 ? 'unit' : 'units'} sold. ${formatMoney(product.total_sales)} in sales.`}
    >
      <View style={[styles.rank, index === 0 && styles.firstRank]}>
        <Text style={[styles.rankText, index === 0 && styles.firstRankText]}>{index + 1}</Text>
      </View>
      <View style={styles.product}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.figures}>
          <Text style={styles.quantity}>{product.units_sold.toLocaleString('en-PH')} {product.units_sold === 1 ? 'unit' : 'units'}</Text>
          <Text style={styles.muted}>{formatMoney(product.total_sales)}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${product.units_sold / maximum * 100}%` }]} />
        </View>
      </View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 6 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, paddingVertical: 20, lineHeight: 21 },
  row: { flexDirection: 'row', gap: 12, paddingTop: 18, paddingBottom: 6, alignItems: 'flex-start' },
  rank: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  firstRank: { backgroundColor: colors.primary },
  rankText: { color: colors.muted, fontWeight: '700' },
  firstRankText: { color: '#ffffff' },
  product: { flex: 1, minWidth: 0, gap: 7 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  figures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  quantity: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  track: { height: 5, backgroundColor: colors.softGreen, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.primary, borderRadius: 3 },
});
