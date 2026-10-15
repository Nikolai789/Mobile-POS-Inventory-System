import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney, formatSaleDate } from '../../frontend/utils/money';

export default function RecentSaleCard({
  sale, receiptLoading, receiptError, onHistory, onOpenReceipt,
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Most recent sale</Text>
        <Pressable accessibilityRole="button" onPress={onHistory}>
          <Text style={styles.link}>History</Text>
        </Pressable>
      </View>
      {sale ? <>
        <View style={styles.latestRow}>
          <View style={styles.latestInfo}>
            <Text style={styles.receiptTitle}>Receipt #{sale.id}</Text>
            <Text style={styles.muted}>{formatSaleDate(sale.created_at)}</Text>
          </View>
          <Text style={styles.latestAmount}>{formatMoney(sale.total_amount)}</Text>
        </View>
        {receiptError ? <Text style={styles.error}>{receiptError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenReceipt(sale.id)}
          disabled={receiptLoading}
          style={[styles.receiptButton, receiptLoading && styles.disabled]}
        >
          <Text style={styles.receiptButtonText}>{receiptLoading ? 'Opening receipt...' : 'Open receipt'}</Text>
        </Pressable>
      </> : <Text style={styles.emptyText}>No completed sales yet.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionTitle: { color: '#18291f', fontSize: 19, fontWeight: '700', flex: 1 },
  link: { color: '#1759a7', fontSize: 13, fontWeight: '700', paddingVertical: 4 },
  latestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  latestInfo: { flex: 1, gap: 3 },
  receiptTitle: { color: '#18291f', fontSize: 16, fontWeight: '700' },
  muted: { color: '#647268', fontSize: 13 },
  latestAmount: { color: '#18291f', fontSize: 18, fontWeight: '700' },
  error: { color: '#a22d21', fontSize: 13 },
  receiptButton: { backgroundColor: '#17663c', borderRadius: 9, alignItems: 'center', padding: 13 },
  receiptButtonText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  emptyText: { color: '#647268', lineHeight: 20 },
});
