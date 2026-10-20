import { useCallback } from 'react';
import type { AnalyticsPeriod } from '../../../../shared/contracts';
import { getAnalytics } from '../../../shared/api/analytics';
import useFocusedResource from '../../../shared/hooks/useFocusedResource';

export default function useAnalytics(period: AnalyticsPeriod) {
  const load = useCallback((signal: AbortSignal) => getAnalytics(period, signal), [period]);
  return useFocusedResource(period, load, { foreground: true, midnight: true });
}
