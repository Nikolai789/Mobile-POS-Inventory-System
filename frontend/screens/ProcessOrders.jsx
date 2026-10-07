import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { FlatList, StyleSheet, Text } from 'react-native';
import { createSale, getProducts } from '../api/client';
import { moneyCents, parseCashCents } from '../utils/money';
import AvailableProductRow from '../../components/orders/AvailableProductRow';
import CheckoutPanel from '../../components/orders/CheckoutPanel';
import OrdersHeader from '../../components/orders/OrdersHeader';
import ReceiptModal from '../../components/orders/ReceiptModal';

export default function ProcessOrders() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [cashInput, setCashInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingSale, setPendingSale] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const submittingRef = useRef(false);

  const refreshProducts = useCallback(async (preserveError = false) => {
    setLoading(true);
    if (!preserveError) setError('');
    try {
      setProducts(await getProducts());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { refreshProducts(); }, [refreshProducts]));

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const availableProducts = useMemo(() => products.filter((product) => product.stock_quantity > 0), [products]);
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalCents = cartItems.reduce((sum, item) => {
    const product = productById.get(item.product.id) || item.product;
    const quantity = Number(item.quantity);
    return sum + (Number.isSafeInteger(quantity) && quantity > 0
      ? moneyCents(product.price) * quantity : 0);
  }, 0);
  const cashCents = parseCashCents(cashInput);
  const changeCents = cashCents == null ? null : cashCents - totalCents;
  const cartValid = cartItems.length > 0 && cartItems.every((item) => {
    const product = productById.get(item.product.id);
    const quantity = Number(item.quantity);
    return product && /^\d+$/.test(item.quantity) && Number.isSafeInteger(quantity)
      && quantity > 0 && quantity <= product.stock_quantity;
  });
  const canFinalize = cartValid && cashCents != null && cashCents >= totalCents
    && Number.isSafeInteger(totalCents) && !loading && !submitting;

  function addProduct(product) {
    if (pendingSale) return;
    setCart((current) => {
      const previous = current[product.id];
      const currentQuantity = previous ? Number(previous.quantity) : 0;
      if (currentQuantity >= product.stock_quantity) return current;
      return { ...current, [product.id]: { product, quantity: String(currentQuantity + 1) } };
    });
    setError('');
  }

  function changeQuantity(id, quantity) {
    if (pendingSale || !/^\d*$/.test(quantity)) return;
    setCart((current) => ({ ...current, [id]: { ...current[id], quantity } }));
    setError('');
  }

  function removeProduct(id) {
    if (pendingSale) return;
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setError('');
  }

  function changeCash(value) {
    if (/^\d*(?:\.\d{0,2})?$/.test(value)) setCashInput(value);
  }

  async function finalizeSale() {
    if (submittingRef.current || (!pendingSale && !canFinalize)) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    const payload = pendingSale || {
      client_transaction_id: Crypto.randomUUID(),
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: Number(item.quantity),
      })),
      expected_total: totalCents / 100,
      cash_received: cashCents / 100,
    };
    setPendingSale(payload);
    try {
      const savedReceipt = await createSale(payload);
      if (!savedReceipt?.id || !Array.isArray(savedReceipt.items)) {
        throw new Error('The server response was incomplete. Retry to retrieve this sale.');
      }
      setReceipt(savedReceipt);
      setCart({});
      setCashInput('');
      setPendingSale(null);
      refreshProducts();
    } catch (requestError) {
      if (requestError.status && requestError.status < 500) setPendingSale(null);
      setError(requestError.network
        ? 'Connection lost. Keep this cart unchanged and retry when the server is available.'
        : requestError.message);
      if (requestError.status === 409) refreshProducts(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={availableProducts}
        keyExtractor={(product) => String(product.id)}
        ListHeaderComponent={<OrdersHeader
          error={error}
          pendingSale={pendingSale}
          loading={loading}
          submitting={submitting}
          onRefresh={() => refreshProducts()}
        />}
        ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>No products are in stock.</Text> : null}
        renderItem={({ item }) => {
          const selectedQuantity = Number(cart[item.id]?.quantity || 0);
          const disabled = Boolean(pendingSale) || loading || submitting || selectedQuantity >= item.stock_quantity;
          return <AvailableProductRow
            product={item}
            disabled={disabled}
            onAdd={() => addProduct(item)}
          />;
        }}
        ListFooterComponent={<CheckoutPanel
          cartItems={cartItems}
          productById={productById}
          totalCents={totalCents}
          cashInput={cashInput}
          cashCents={cashCents}
          changeCents={changeCents}
          pendingSale={pendingSale}
          submitting={submitting}
          canFinalize={canFinalize}
          onQuantityChange={changeQuantity}
          onRemove={removeProduct}
          onCashChange={changeCash}
          onFinalize={finalizeSale}
        />}
      />
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { padding: 16, paddingBottom: 40 },
  muted: { color: '#555' },
});
