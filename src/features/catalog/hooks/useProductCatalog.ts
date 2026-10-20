import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Product, ProductSearch } from '../../../../shared/contracts';
import { searchProducts } from '../../../shared/api/products';
import { normalizeRequestError } from '../../../shared/api/errors';
import useLatestRequest from '../../../shared/hooks/useLatestRequest';

export default function useProductCatalog<T extends Product = Product>(
  { inStock = false, searchOnly = false, status = 'active' }: Pick<ProductSearch, 'inStock' | 'status'> & { searchOnly?: boolean } = {},
) {
  const [query, setQuery] = useState('');
  const [resultsQuery, setResultsQuery] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([query, inStock, searchOnly, status, revision]);
  const requests = useLatestRequest();
  const paging = useRef(false);
  const previousQuery = useRef<string | null>(null);

  useFocusEffect(useCallback(() => {
    const ticket = requests.start();
    const delay = previousQuery.current !== null && previousQuery.current !== query ? 300 : 0;
    previousQuery.current = query;
    paging.current = false;
    setLoading(true);
    setLoadingMore(false);
    setError('');
    setItems([]);
    setResultsQuery(null);
    setNextOffset(null);
    if (searchOnly && !query.trim()) {
      setResultsQuery(requestKey);
      setLoading(false);
      return () => {
        requests.cancel();
      };
    }
    const timer = setTimeout(() => {
      searchProducts<T>({ q: query, inStock, status }, ticket.signal).then((result) => {
        if (!requests.isCurrent(ticket)) return;
        setItems(result.items);
        setNextOffset(result.next_offset);
        setResultsQuery(requestKey);
      }).catch((cause: unknown) => {
        if (!requests.isCurrent(ticket)) return;
        setError(normalizeRequestError(cause).message);
        setResultsQuery(requestKey);
      }).finally(() => {
        if (requests.isCurrent(ticket)) setLoading(false);
      });
    }, delay);
    return () => {
      clearTimeout(timer);
      requests.cancel();
    };
  }, [query, inStock, requestKey, searchOnly, status, requests]));

  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  const loadMore = useCallback(async () => {
    if (paging.current || loading || error || nextOffset == null || requestKey !== resultsQuery) return;
    paging.current = true;
    const ticket = requests.start();
    setLoadingMore(true);
    try {
      const result = await searchProducts<T>({ q: query, inStock, status, offset: nextOffset }, ticket.signal);
      if (!requests.isCurrent(ticket)) return;
      setItems((current) => [...current, ...result.items]);
      setNextOffset(result.next_offset);
    } catch (cause) {
      if (requests.isCurrent(ticket)) setError(normalizeRequestError(cause).message);
    } finally {
      if (requests.isCurrent(ticket)) {
        setLoadingMore(false);
        paging.current = false;
      }
    }
  }, [error, inStock, loading, nextOffset, query, requestKey, resultsQuery, status, requests]);

  return {
    query, setQuery, items: requestKey === resultsQuery ? items : [],
    loading: loading || requestKey !== resultsQuery, loadingMore,
    error: requestKey === resultsQuery ? error : '', refresh, loadMore,
  };
}
