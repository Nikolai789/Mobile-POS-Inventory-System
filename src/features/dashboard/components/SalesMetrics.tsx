import { colors } from '../../../shared/theme';
import type { DashboardResponse } from '../../../../shared/contracts';
import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../../../shared/utils/money';

interface SalesMetricsProps {
  today: DashboardResponse['today'];
  lowStockCount: number;
  businessDate: string;
}

export default function SalesMetrics({ today, lowStockCount, businessDate }: SalesMetricsProps) {
  return <>
    <View style={styles.salesCard}>
      <Text style={styles.salesLabel}>Today’s sales</Text>
      <Text style={styles.salesValue} adjustsFontSizeToFit numberOfLines={1}>
        {formatMoney(today.total_sales)}
      </Text>
      <Text style={styles.salesHint}>Completed cash sales · {businessDate}</Text>
    </View>

    <View style={styles.metricsRow}>
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Transactions today</Text>
        <Text style={styles.metricValue}>{today.transaction_count}</Text>
      </View>
      <View style={[styles.metricCard, styles.lowStockMetric]}>
        <Text style={styles.metricLabel}>Low-stock products</Text>
        <Text style={styles.metricValue}>{lowStockCount}</Text>
      </View>
    </View>
  </>;
}

const styles = StyleSheet.create({
  salesCard: { backgroundColor: colors.primary, borderRadius: 18, padding: 20, gap: 12 },
  salesLabel: { color: colors.softGreen, fontSize: 15, fontWeight: '600' },
  salesValue: { color: '#fff', fontSize: 42, fontWeight: '800' },
  salesHint: { color: '#d9eddf', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, minWidth: 0, minHeight: 112, borderRadius: 14, padding: 15, backgroundColor: '#fff', justifyContent: 'space-between' },
  lowStockMetric: { backgroundColor: '#fff0e9' },
  metricLabel: { color: '#46554a', fontSize: 13, fontWeight: '600' },
  metricValue: { color: colors.text, fontSize: 30, fontWeight: '800' },
});
