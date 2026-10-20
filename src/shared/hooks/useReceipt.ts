import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Receipt } from '../../../shared/contracts';
import { getSale } from '../api/sales';
import { normalizeRequestError } from '../api/errors';
import useLatestRequest from './useLatestRequest';

export default function useReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const focused = useRef(false);
  const requests = useLatestRequest();
  const close = useCallback(() => {
    requests.cancel();
    setSelectedId(null);
    setReceipt(null);
    setError('');
  }, [requests]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; close(); };
  }, [close]));
  const open = useCallback(async (id: number) => {
    const ticket = requests.start();
    setSelectedId(id);
    setReceipt(null);
    setError('');
    try {
      const result = await getSale(id, ticket.signal);
      if (focused.current && requests.isCurrent(ticket)) setReceipt(result);
    } catch (cause) {
      if (focused.current && requests.isCurrent(ticket)) setError(normalizeRequestError(cause).message);
    }
  }, [requests]);
  return { receipt, selectedId, error, loading: selectedId !== null && receipt === null && !error, open, close };
}
