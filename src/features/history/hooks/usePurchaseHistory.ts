import { useCallback } from 'react';
import type { SalesSort } from '../../../../shared/contracts';
import { getSales } from '../../../shared/api/sales';
import useFocusedResource from '../../../shared/hooks/useFocusedResource';

export default function usePurchaseHistory(date: string | null, sort: SalesSort) {
  const load = useCallback((signal: AbortSignal) => getSales({ date, sort }, signal), [date, sort]);
  const { data, ...resource } = useFocusedResource(JSON.stringify([date, sort]), load);
  return { ...resource, sales: data ?? [], hasResults: data !== null };
}
