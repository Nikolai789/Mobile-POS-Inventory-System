import { useState } from 'react';
import AnalyticsView from '../../components/analytics/AnalyticsView';
import useAnalytics from '../hooks/useAnalytics';
import type { AnalyticsPeriod } from '../types/analytics';

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const { data, loading, refreshing, error, refresh } = useAnalytics(period);
  return <AnalyticsView
    period={period}
    onPeriodChange={setPeriod}
    data={data}
    loading={loading}
    refreshing={refreshing}
    error={error}
    onRefresh={refresh}
  />;
}
