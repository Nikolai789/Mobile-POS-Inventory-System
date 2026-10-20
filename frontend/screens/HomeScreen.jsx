import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { getDashboard, getSale } from '../api/client';
import DashboardView from '../../components/dashboard/DashboardView';
import ReceiptModal from '../../components/orders/ReceiptModal';
import { timeUntilNextBusinessDay } from '../utils/businessTime';

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const hasData = useRef(false);
  const focused = useRef(false);
  const dashboardRequest = useRef(0);
  const receiptRequest = useRef(0);

  const loadDashboard = useCallback(async () => {
    const request = ++dashboardRequest.current;
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const summary = await getDashboard();
      if (!focused.current || request !== dashboardRequest.current) return;
      hasData.current = true;
      setDashboard(summary);
    } catch (requestError) {
      if (focused.current && request === dashboardRequest.current) setError(requestError.message);
    } finally {
      if (focused.current && request === dashboardRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    loadDashboard();
    let appState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && appState !== 'active') loadDashboard();
      appState = nextState;
    });
    let midnightTimer;
    const scheduleMidnightRefresh = () => {
      midnightTimer = setTimeout(() => {
        loadDashboard();
        scheduleMidnightRefresh();
      }, timeUntilNextBusinessDay());
    };
    scheduleMidnightRefresh();
    return () => {
      focused.current = false;
      dashboardRequest.current += 1;
      receiptRequest.current += 1;
      subscription.remove();
      clearTimeout(midnightTimer);
      setReceipt(null);
      setReceiptLoading(false);
      setReceiptError('');
    };
  }, [loadDashboard]));

  async function openReceipt(id) {
    const request = ++receiptRequest.current;
    setReceiptLoading(true);
    setReceiptError('');
    try {
      const sale = await getSale(id);
      if (focused.current && request === receiptRequest.current) setReceipt(sale);
    } catch (requestError) {
      if (focused.current && request === receiptRequest.current) setReceiptError(requestError.message);
    } finally {
      if (focused.current && request === receiptRequest.current) setReceiptLoading(false);
    }
  }

  function closeReceipt() {
    receiptRequest.current += 1;
    setReceipt(null);
    setReceiptError('');
    setReceiptLoading(false);
  }

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
