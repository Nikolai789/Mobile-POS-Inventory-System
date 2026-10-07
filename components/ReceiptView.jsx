import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney, formatSaleDate } from '../frontend/utils/money';

export default function ReceiptView({ receipt }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Receipt #{receipt.id}</Text>
      <Text style={styles.date}>{formatSaleDate(receipt.created_at)}</Text>
      <View style={styles.divider} />
      {receipt.items.map((item) => (
        <View key={item.product_id} style={styles.item}>
          <View style={styles.itemInfo}>
            <Text style={styles.name}>{item.name || `Product #${item.product_id}`}</Text>
            <Text style={styles.muted}>{item.quantity} × {formatMoney(item.unit_price)}</Text>
          </View>
          <Text style={styles.amount}>{formatMoney(item.line_total)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}><Text style={styles.total}>Total</Text><Text style={styles.total}>{formatMoney(receipt.total_amount)}</Text></View>
      <View style={styles.row}><Text>Cash received</Text><Text>{receipt.cash_received == null ? 'Not recorded' : formatMoney(receipt.cash_received)}</Text></View>
      <View style={styles.row}><Text>Change</Text><Text>{receipt.change_amount == null ? 'Not recorded' : formatMoney(receipt.change_amount)}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  date: { color: '#555' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 5 },
  item: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  muted: { color: '#555' },
  amount: { fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  total: { fontSize: 20, fontWeight: '700' },
});
