import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import type { Product, Receipt, SaleRequest } from '../../../../shared/contracts';
import { createSale } from '../../../shared/api/sales';
import { lookupProducts } from '../../../shared/api/products';
import { normalizeRequestError } from '../../../shared/api/errors';
import useLatestRequest from '../../../shared/hooks/useLatestRequest';
import { calculateCheckout, cartReducer, emptyCart } from '../model/cart';

export default function useCheckout(refreshProducts: () => void) {
  const [cartState, dispatch] = useReducer(cartReducer, undefined, emptyCart);
  const [cashInput, setCashInput] = useState('');
  const [checkingCart, setCheckingCart] = useState(false);
  const [cartLookupError, setCartLookupError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingSale, setPendingSale] = useState<SaleRequest | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const submittingRef = useRef(false);
  const pendingRef = useRef(pendingSale);
  const cartRef = useRef(cartState);
  useLayoutEffect(() => { cartRef.current = cartState; }, [cartState]);
  const requests = useLatestRequest();
  const amounts = useMemo(() => calculateCheckout(cartState, cashInput), [cartState, cashInput]);
  const canFinalize = amounts.valid && !checkingCart && !cartLookupError && !submitting;

  const refreshCart = useCallback(async (force = false) => {
    const ids = Object.keys(cartRef.current.items).map(Number);
    if (!ids.length || (pendingRef.current && !force)) return;
    const ticket = requests.start();
    setCheckingCart(true);
    try {
      const products = await lookupProducts(ids, ticket.signal);
      if (!requests.isCurrent(ticket)) return;
      dispatch({ type: 'reconcile', ids, products });
      setCartLookupError(false);
    } catch (cause) {
      if (requests.isCurrent(ticket)) {
        setCartLookupError(true);
        setError(normalizeRequestError(cause).message);
      }
    } finally {
      if (requests.isCurrent(ticket)) setCheckingCart(false);
    }
  }, [requests]);

  useFocusEffect(useCallback(() => {
    void refreshCart();
    return () => { requests.cancel(); setCheckingCart(false); };
  }, [refreshCart, requests]));

  function addProduct(product: Product) {
    if (pendingRef.current || submittingRef.current) return;
    if (!Object.keys(cartRef.current.items).length) setCartLookupError(false);
    dispatch({ type: 'add', product });
    setError('');
  }
  function changeQuantity(id: number, quantity: string) {
    if (pendingRef.current || !/^\d*$/.test(quantity)) return;
    dispatch({ type: 'quantity', id, quantity });
    setError('');
  }
  function removeProduct(id: number) {
    if (pendingRef.current) return;
    if (Object.keys(cartRef.current.items).length === 1) setCartLookupError(false);
    dispatch({ type: 'remove', id });
    setError('');
  }
  function changeCash(value: string) {
    if (!pendingRef.current && /^\d*(?:\.\d{0,2})?$/.test(value)) setCashInput(value);
  }
  async function finalizeSale() {
    if (submittingRef.current || (!pendingRef.current && !canFinalize)) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const payload = pendingRef.current ?? {
        client_transaction_id: Crypto.randomUUID(),
        items: amounts.cartItems.map((item) => ({ product_id: item.product.id, quantity: Number(item.quantity) })),
        expected_total: amounts.totalCents / 100,
        cash_received: amounts.cashCents! / 100,
      };
      pendingRef.current = payload;
      setPendingSale(payload);
      const savedReceipt = await createSale(payload);
      setReceipt(savedReceipt);
      dispatch({ type: 'clear' });
      setCartLookupError(false);
      setCashInput('');
      pendingRef.current = null;
      setPendingSale(null);
      refreshProducts();
    } catch (cause) {
      const requestError = normalizeRequestError(cause);
      if (requestError.status && requestError.status < 500) {
        pendingRef.current = null;
        setPendingSale(null);
      }
      setError(requestError.network
        ? 'Connection lost. Keep this cart unchanged and retry when the server is available.'
        : requestError.message);
      if (requestError.status === 409) { refreshProducts(); void refreshCart(true); }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  return {
    ...amounts, cart: cartState.items, cashInput, checkingCart, cartLookupError,
    submitting, error, pendingSale, receipt, canFinalize, refreshCart,
    addProduct, changeQuantity, removeProduct, changeCash, finalizeSale,
    isLocked: () => Boolean(pendingRef.current || submittingRef.current),
    quantityFor: (id: number) => Number(cartRef.current.items[id]?.quantity || 0),
    closeReceipt: () => setReceipt(null),
  };
}
