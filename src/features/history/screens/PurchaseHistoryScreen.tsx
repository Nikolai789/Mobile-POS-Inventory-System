import { colors } from '../../../shared/theme';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SalesSort } from '../../../../shared/contracts';
import { formatMoney, formatSaleDate } from '../../../shared/utils/money';
import { BUSINESS_TIME_ZONE } from '../../../shared/utils/businessTime';
import useReceipt from '../../../shared/hooks/useReceipt';
import usePurchaseHistory from '../hooks/usePurchaseHistory';
import ReceiptView from '../../../shared/components/ReceiptView';
import PurchaseHistoryFilters from '../components/PurchaseHistoryFilters';
import HistoryDatePicker from '../components/HistoryDatePicker';

export default function PurchaseHistoryScreen() {
  const [date, setDate] = useState<string | null>(null);
  const [sort, setSort] = useState<SalesSort>('newest');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const { sales, loading, refreshing, hasResults, error, refresh } = usePurchaseHistory(date, sort);
  const { receipt, selectedId, error: receiptError, open: openReceipt, close: closeReceipt } = useReceipt();
  useFocusEffect(useCallback(() => () => setDatePickerVisible(false), []));

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={sales}
        keyExtractor={(sale) => String(sale.id)}
        refreshing={refreshing}
        onRefresh={refresh}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.title}>Purchase History</Text>
            <Text style={styles.muted}>Completed cash sales</Text>
            <PurchaseHistoryFilters
              date={date}
              sort={sort}
              onChooseDate={() => setDatePickerVisible(true)}
              onClearDate={() => setDate(null)}
              onSortChange={setSort}
            />
            {error ? <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.error}>{hasResults ? `Could not refresh. Showing the previously loaded receipts. ${error}` : error}</Text>
              <Pressable onPress={refresh} accessibilityRole="button" style={styles.retryButton}><Text style={styles.retryText}>Retry history</Text></Pressable>
            </View> : null}
            {loading ? <ActivityIndicator accessibilityLabel="Loading purchase history" /> : null}
            <Pressable onPress={refresh} disabled={loading || refreshing} style={styles.refreshButton} accessibilityRole="button">
              <Text style={styles.refreshText}>{refreshing ? 'Refreshing history…' : 'Refresh history'}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>{date ? 'No receipts for this date' : 'No completed sales yet.'}</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open receipt ${item.id}`}
            onPress={() => openReceipt(item.id)}
            style={styles.saleRow}
          >
            <View style={styles.saleInfo}>
              <Text style={styles.saleTitle}>Receipt #{item.id}</Text>
              <Text style={styles.muted}>{formatSaleDate(item.created_at, BUSINESS_TIME_ZONE)}</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(item.total_amount)}</Text>
          </Pressable>
        )}
      />
      <Modal visible={selectedId != null} animationType="slide" onRequestClose={closeReceipt}>
        <View style={styles.receiptModal}>
          {receipt ? <ReceiptView receipt={receipt} timeZone={BUSINESS_TIME_ZONE} /> : null}
          {selectedId != null && !receipt && !receiptError ? <ActivityIndicator style={styles.loader} accessibilityLabel="Loading receipt" /> : null}
          {receiptError ? <Text style={styles.error}>{receiptError}</Text> : null}
          {receiptError ? <Pressable onPress={() => { if (selectedId !== null) void openReceipt(selectedId); }} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable> : null}
          <Pressable onPress={closeReceipt} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
      {datePickerVisible ? <HistoryDatePicker
        value={date}
        onCancel={() => setDatePickerVisible(false)}
        onApply={(selectedDate) => { setDate(selectedDate); setDatePickerVisible(false); }}
      /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { padding: 16, paddingBottom: 40 },
  header: { gap: 9, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  muted: { color: '#555' },
  error: { color: '#b00020', margin: 16 },
  errorBox: { backgroundColor: colors.errorBackground, borderRadius: 10, paddingBottom: 8 },
  refreshButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingRight: 16 },
  refreshText: { color: '#1759a7', fontWeight: '600' },
  saleRow: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  saleInfo: { flex: 1, gap: 4 },
  saleTitle: { fontSize: 17, fontWeight: '700' },
  amount: { fontSize: 18, fontWeight: '700' },
  receiptModal: { flex: 1, paddingBottom: 20 },
  loader: { flex: 1 },
  retryButton: { marginHorizontal: 20, minHeight: 44, padding: 12, alignItems: 'center' },
  retryText: { color: '#1759a7', fontWeight: '600' },
  closeButton: { marginHorizontal: 20, backgroundColor: '#1759a7', borderRadius: 8, alignItems: 'center', padding: 15 },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
