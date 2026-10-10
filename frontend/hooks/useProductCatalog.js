import { useCallback, useEffect, useRef, useState } from 'react';
import { searchProducts } from '../api/client';

export default function useProductCatalog(inStock = false, searchOnly = false) {
  const [query, setQuery] = useState('');
  const [resultsQuery, setResultsQuery] = useState(null);
  const [items, setItems] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const paging = useRef(false);
  const previousQuery = useRef(null);

  useEffect(() => {
    const request = ++sequence.current;
    const controller = new AbortController();
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
      setResultsQuery(query);
      setLoading(false);
      return () => {
        controller.abort();
        sequence.current += 1;
      };
    }
    const timer = setTimeout(() => {
      searchProducts({ q: query, inStock }, controller.signal).then((result) => {
        if (request !== sequence.current) return;
        setItems(result.items);
        setNextOffset(result.next_offset);
        setResultsQuery(query);
      }).catch((requestError) => {
        if (request !== sequence.current || controller.signal.aborted) return;
        setError(requestError.message);
        setResultsQuery(query);
      }).finally(() => {
        if (request === sequence.current) setLoading(false);
      });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
      sequence.current += 1;
    };
  }, [query, inStock, revision, searchOnly]);

  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  const loadMore = useCallback(async () => {
    if (paging.current || loading || error || nextOffset == null || query !== resultsQuery) return;
    paging.current = true;
    const request = sequence.current;
    setLoadingMore(true);
    try {
      const result = await searchProducts({ q: query, inStock, offset: nextOffset });
      if (request !== sequence.current) return;
      setItems((current) => [...current, ...result.items]);
      setNextOffset(result.next_offset);
    } catch (requestError) {
      if (request === sequence.current) setError(requestError.message);
    } finally {
      if (request === sequence.current) {
        setLoadingMore(false);
        paging.current = false;
      }
    }
  }, [error, inStock, loading, nextOffset, query, resultsQuery]);

  return {
    query, setQuery, items: query === resultsQuery ? items : [],
    loading: loading || query !== resultsQuery, loadingMore,
    error: query === resultsQuery ? error : '', refresh, loadMore,
  };
}
