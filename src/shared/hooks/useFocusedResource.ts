import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { normalizeRequestError } from '../api/errors';
import { timeUntilNextBusinessDay } from '../utils/businessTime';
import useLatestRequest from './useLatestRequest';

interface ResourceState<T> {
  key: string;
  data: T | null;
  error: string;
  pending: boolean;
}

interface RefreshPolicy {
  foreground?: boolean;
  midnight?: boolean;
}

/** Retain data on same-key refreshes; a changed filter hides the previous result immediately. */
export default function useFocusedResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  { foreground = false, midnight = false }: RefreshPolicy = {},
) {
  const [state, setState] = useState<ResourceState<T>>({ key, data: null, error: '', pending: true });
  const focused = useRef(false);
  const requests = useLatestRequest();
  const refresh = useCallback(async () => {
    if (!focused.current) return;
    const ticket = requests.start();
    setState((current) => ({ key, data: current.key === key ? current.data : null, error: '', pending: true }));
    try {
      const data = await load(ticket.signal);
      if (focused.current && requests.isCurrent(ticket)) setState({ key, data, error: '', pending: false });
    } catch (cause) {
      if (focused.current && requests.isCurrent(ticket)) {
        setState((current) => ({ ...current, pending: false, error: normalizeRequestError(cause).message }));
      }
    }
  }, [key, load, requests]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void refresh();
    let appState = AppState.currentState;
    const subscription = foreground ? AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && appState !== 'active') void refresh();
      appState = nextState;
    }) : null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => { void refresh(); schedule(); }, timeUntilNextBusinessDay());
    };
    if (midnight) schedule();
    return () => {
      focused.current = false;
      requests.cancel();
      subscription?.remove();
      clearTimeout(timer);
    };
  }, [foreground, midnight, refresh, requests]));

  const matches = state.key === key;
  const data = matches ? state.data : null;
  return {
    data, refresh,
    error: matches ? state.error : '',
    loading: !matches || (state.pending && data === null),
    refreshing: matches && state.pending && data !== null,
  };
}
