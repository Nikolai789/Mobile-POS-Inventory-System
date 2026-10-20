import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnalyticsSummary } from '../../../../shared/contracts';
import { formatMoney } from '../../../shared/utils/money';
import { colors } from '../../../shared/theme';

interface Metric {
  label: string;
  value: string;
  hint: string;
  primary?: boolean;
}

function MetricCard({ metric }: { metric: Metric }) {
  const [width, setWidth] = useState(160);
  const fontSize = Math.min(30, Math.max(16, Math.floor((width - 32) / (metric.value.length * 0.68))));
  return <View
    onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    style={[styles.card, metric.primary && styles.primaryCard]}
    accessible
    accessibilityLabel={`${metric.label}: ${metric.value}. ${metric.hint}.`}
  >
    <Text style={[styles.label, metric.primary && styles.light]}>{metric.label}</Text>
    <Text style={[styles.value, { fontSize }, metric.primary && styles.light]}>{metric.value}</Text>
    <Text style={[styles.hint, metric.primary && styles.light]}>{metric.hint}</Text>
  </View>;
}

export default function AnalyticsMetrics({ summary }: { summary: AnalyticsSummary }) {
  const metrics: Metric[] = [
    { label: 'Total sales', value: formatMoney(summary.total_sales), hint: 'Completed cash sales', primary: true },
    { label: 'Transactions', value: summary.transaction_count.toLocaleString('en-PH'), hint: 'Completed receipts' },
    { label: 'Units sold', value: summary.units_sold.toLocaleString('en-PH'), hint: 'Across all products' },
    { label: 'Average sale', value: formatMoney(summary.average_sale_value), hint: 'Per transaction' },
  ];
  return <View style={styles.grid}>
    {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
  </View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexGrow: 1, flexBasis: '46%', minWidth: 130, minHeight: 128, backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  primaryCard: { backgroundColor: colors.primary },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  value: { color: colors.text, fontSize: 30, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12 },
  light: { color: '#ffffff' },
});
