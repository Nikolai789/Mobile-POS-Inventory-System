import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import SalesMetrics from './SalesMetrics';
import LowStockCard from './LowStockCard';
import RecentSaleCard from './RecentSaleCard';

function formatBusinessDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function DashboardView({
  dashboard, loading, refreshing, error, receiptLoading, receiptError,
  onRefresh, onInventory, onHistory, onOpenReceipt,
}) {
  const businessDate = dashboard ? formatBusinessDate(dashboard.business_date) : '';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STORE OVERVIEW</Text>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.muted}>{dashboard
          ? `Philippine business day · ${businessDate}`
          : 'Today’s sales and stock at a glance'}</Text>
      </View>

      {error ? <View style={styles.errorBox}>
        <Text style={styles.error}>{dashboard
          ? `Could not refresh. Showing figures from ${businessDate}. ${error}`
          : error}</Text>
        <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View> : null}
      {loading && !dashboard ? <ActivityIndicator size="large" accessibilityLabel="Loading dashboard" /> : null}

      {dashboard ? <>
        <SalesMetrics today={dashboard.today} lowStockCount={dashboard.low_stock.count} businessDate={businessDate} />
        <LowStockCard lowStock={dashboard.low_stock} onInventory={onInventory} />
        <RecentSaleCard
          sale={dashboard.latest_sale}
          receiptLoading={receiptLoading}
          receiptError={receiptError}
          onHistory={onHistory}
          onOpenReceipt={onOpenReceipt}
        />
      </> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f4' },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  header: { gap: 3, marginBottom: 2 },
  eyebrow: { color: '#35694d', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18291f', fontSize: 30, fontWeight: '700' },
  muted: { color: '#647268', fontSize: 13 },
  errorBox: { backgroundColor: '#fff1ee', borderRadius: 12, padding: 14, gap: 8 },
  error: { color: '#a22d21', fontSize: 13 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 16 },
  retryText: { color: '#1759a7', fontWeight: '700' },
});
