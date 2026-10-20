import { router } from 'expo-router';
import { getDashboard } from '../../../shared/api/dashboard';
import useFocusedResource from '../../../shared/hooks/useFocusedResource';
import useReceipt from '../../../shared/hooks/useReceipt';
import DashboardView from '../components/DashboardView';
import ReceiptModal from '../../../shared/components/ReceiptModal';

export default function DashboardScreen() {
  const { data: dashboard, loading, refreshing, error, refresh: loadDashboard } = useFocusedResource(
    'dashboard', getDashboard, { foreground: true, midnight: true },
  );
  const { receipt, loading: receiptLoading, error: receiptError, open: openReceipt, close: closeReceipt } = useReceipt();

  return (
    <>
      <DashboardView
        dashboard={dashboard}
        loading={loading}
        refreshing={refreshing}
        error={error}
        receiptLoading={receiptLoading}
        receiptError={receiptError}
        onRefresh={loadDashboard}
        onInventory={() => router.navigate('/inventory')}
        onHistory={() => router.navigate('/purchase-history')}
        onOpenReceipt={openReceipt}
      />
      <ReceiptModal receipt={receipt} onClose={closeReceipt} />
    </>
  );
}
