import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSales } from '../api/client';
import type { SaleSummary, SalesSort } from '../types/purchaseHistory';

interface HistoryState {
  date: string | null;
  sort: SalesSort;
  sales: SaleSummary[] | null;
  error: string;
  pending: boolean;
}

export default function usePurchaseHistory(date: string | null, sort: SalesSort) {
  const [state, setState] = useState<HistoryState>({ date, sort, sales: null, error: '', pending: true });
  const focused = useRef(false);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!focused.current) return;
    controller.current?.abort();
    const activeController = new AbortController();
    controller.current = activeController;
    const request = ++sequence.current;
    setState((current) => ({
      date, sort,
      sales: current.date === date && current.sort === sort ? current.sales : null,
      error: '', pending: true,
    }));
    try {
      const sales = await getSales({ date, sort }, activeController.signal);
      if (focused.current && request === sequence.current && !activeController.signal.aborted) {
        setState({ date, sort, sales, error: '', pending: false });
      }
    } catch (error) {
      if (focused.current && request === sequence.current && !activeController.signal.aborted) {
        setState((current) => ({
          ...current, pending: false,
          error: error instanceof Error ? error.message : 'Unable to load purchase history.',
        }));
      }
    }
  }, [date, sort]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void refresh();
    return () => {
      focused.current = false;
      sequence.current += 1;
      controller.current?.abort();
    };
  }, [refresh]));

  // Filter changes must hide old receipts before their replacement request starts.
  const matchesFilters = state.date === date && state.sort === sort;
  const sales = matchesFilters ? state.sales : null;
  return {
    sales: sales ?? [],
    hasResults: sales !== null,
    loading: !matchesFilters || (state.pending && sales === null),
    refreshing: matchesFilters && state.pending && sales !== null,
    error: matchesFilters ? state.error : '',
    refresh,
  };
}
