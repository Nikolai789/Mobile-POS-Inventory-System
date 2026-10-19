import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { getAnalytics } from '../api/analytics';
import type { AnalyticsPeriod, AnalyticsResponse } from '../types/analytics';
import { timeUntilNextBusinessDay } from '../utils/businessTime';

interface AnalyticsState {
  period: AnalyticsPeriod;
  data: AnalyticsResponse | null;
  error: string;
  pending: boolean;
}

export default function useAnalytics(period: AnalyticsPeriod) {
  const [state, setState] = useState<AnalyticsState>({ period, data: null, error: '', pending: true });
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
      period, data: current.period === period ? current.data : null, error: '', pending: true,
    }));
    try {
      const data = await getAnalytics(period, activeController.signal);
      if (focused.current && request === sequence.current && !activeController.signal.aborted) {
        setState({ period, data, error: '', pending: false });
      }
    } catch (error) {
      if (focused.current && request === sequence.current && !activeController.signal.aborted) {
        setState((current) => ({
          ...current, pending: false,
          error: error instanceof Error ? error.message : 'Unable to load analytics. Please try again.',
        }));
      }
    }
  }, [period]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void refresh();
    let appState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && appState !== 'active') void refresh();
      appState = nextState;
    });
    let midnightTimer: ReturnType<typeof setTimeout>;
    const scheduleMidnightRefresh = () => {
      midnightTimer = setTimeout(() => {
        void refresh();
        scheduleMidnightRefresh();
      }, timeUntilNextBusinessDay());
    };
    scheduleMidnightRefresh();
    return () => {
      focused.current = false;
      sequence.current += 1;
      controller.current?.abort();
      subscription.remove();
      clearTimeout(midnightTimer);
    };
  }, [refresh]));

  // Hide the previous period immediately, before the next focus effect starts its request.
  const matchesPeriod = state.period === period;
  const data = matchesPeriod ? state.data : null;
  return {
    data,
    error: matchesPeriod ? state.error : '',
    loading: !matchesPeriod || (state.pending && !data),
    refreshing: matchesPeriod && state.pending && data !== null,
    refresh,
  };
}
