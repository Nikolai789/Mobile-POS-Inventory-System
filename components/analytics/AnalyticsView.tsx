import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnalyticsPeriod, AnalyticsResponse } from '../../frontend/types/analytics';
import { formatBusinessDate, formatBusinessTimestamp } from '../../frontend/utils/businessTime';
import AnalyticsMetrics from './AnalyticsMetrics';
import SalesTrendChart from './SalesTrendChart';
import TopProductsCard from './TopProductsCard';
import { analyticsColors as colors } from './theme';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

interface AnalyticsViewProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  data: AnalyticsResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  onRefresh: () => void;
}

export default function AnalyticsView({
  period, onPeriodChange, data, loading, refreshing, error, onRefresh,
}: AnalyticsViewProps) {
  const dateRange = data ? data.range.start_date === data.range.end_date
    ? formatBusinessDate(data.range.start_date)
    : `${formatBusinessDate(data.range.start_date)} – ${formatBusinessDate(data.range.end_date)}`
    : 'Philippine business days · Asia/Manila';

  return <ScrollView
    style={styles.screen}
    contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
  >
    <View style={styles.body}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>SHOP INSIGHTS</Text>
          <Text accessibilityRole="header" style={styles.title}>Analytics</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh analytics" disabled={loading || refreshing} onPress={onRefresh} style={[styles.refreshButton, (loading || refreshing) && styles.disabled]}>
          <Text style={styles.refreshText}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      </View>
      <Text style={styles.muted}>See what sells and how your shop is doing.</Text>
      <View style={styles.filters} accessibilityLabel="Analytics time period">
        {PERIODS.map((option) => <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === period }}
          onPress={() => onPeriodChange(option.value)}
          style={[styles.filter, option.value === period && styles.selectedFilter]}
        >
          <Text style={[styles.filterText, option.value === period && styles.selectedFilterText]}>{option.label}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.periodLabel}>{dateRange}</Text>
      {error ? <View style={styles.errorBox} accessibilityRole="alert">
        <Text style={styles.error}>{data
          ? `Could not refresh. Showing figures updated ${formatBusinessTimestamp(data.generated_at)} (Philippine time). ${error}`
          : error}</Text>
        <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View> : null}
      {loading ? <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading analytics" />
        <Text style={styles.muted}>Loading shop insights…</Text>
      </View> : null}
      {data ? <>
        <AnalyticsMetrics summary={data.summary} />
        {data.summary.transaction_count === 0 ? <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No sales in this period</Text>
          <Text style={styles.muted}>Complete a sale or choose another period to see your shop’s activity.</Text>
        </View> : null}
        <SalesTrendChart trend={data.sales_trend} />
        <TopProductsCard products={data.top_products} />
        <Text style={styles.updated}>Updated {formatBusinessTimestamp(data.generated_at)} · Philippine time</Text>
      </> : null}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  body: { width: '100%', maxWidth: 900, alignSelf: 'center', gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  heading: { flex: 1, gap: 3 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  refreshButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.softGreen },
  refreshText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  selectedFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  selectedFilterText: { color: '#ffffff' },
  periodLabel: { color: colors.muted, fontSize: 12 },
  loading: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  errorBox: { backgroundColor: colors.errorBackground, borderRadius: 12, padding: 14, gap: 8 },
  error: { color: colors.error, fontSize: 13, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingRight: 24 },
  retryText: { color: colors.primary, fontWeight: '700' },
  empty: { backgroundColor: colors.softGreen, padding: 18, borderRadius: 14, gap: 6 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  updated: { color: colors.muted, fontSize: 11, textAlign: 'center' },
});
