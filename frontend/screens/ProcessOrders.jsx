import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { createSale, getProductByBarcode, lookupProducts } from '../api/client';
import useProductCatalog from '../hooks/useProductCatalog';
import useCheckoutKeyboard from '../hooks/useCheckoutKeyboard';
import { moneyCents, parseCashCents } from '../utils/money';
import AvailableProductRow from '../../components/orders/AvailableProductRow';
import CheckoutPanel from '../../components/orders/CheckoutPanel';
import OrdersHeader from '../../components/orders/OrdersHeader';
import ReceiptModal from '../../components/orders/ReceiptModal';
import BarcodeScannerModal from '../../components/products/BarcodeScannerModal';

export default function ProcessOrders() {
  const catalog = useProductCatalog(true, true);
  const checkoutKeyboard = useCheckoutKeyboard();
  const [cart, setCart] = useState({});
  const [unavailableIds, setUnavailableIds] = useState(new Set());
  const [checkingCart, setCheckingCart] = useState(false);
  const [cartLookupError, setCartLookupError] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingSale, setPendingSale] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanFeedback, setScanFeedback] = useState('');
  const [scanRetryCode, setScanRetryCode] = useState('');
  const submittingRef = useRef(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const pendingSaleRef = useRef(pendingSale);
  pendingSaleRef.current = pendingSale;
  const lookupSequence = useRef(0);
  const scanRequestSequence = useRef(0);

  const refreshCart = useCallback(async (force = false) => {
    const ids = Object.keys(cartRef.current).map(Number);
    if (!ids.length || (pendingSaleRef.current && !force)) return;
    const request = ++lookupSequence.current;
    setCheckingCart(true);
    try {
      const products = await lookupProducts(ids);
      if (request !== lookupSequence.current) return;
      const found = new Map(products.map((product) => [product.id, product]));
      setCart((current) => Object.fromEntries(Object.entries(current).map(([id, item]) =>
        [id, found.has(Number(id)) ? { ...item, product: found.get(Number(id)) } : item])));
      setUnavailableIds((current) => {
        const next = new Set(current);
        ids.forEach((id) => { if (found.has(id)) next.delete(id); else next.add(id); });
        return next;
      });
      setCartLookupError(false);
    } catch (requestError) {
      if (request === lookupSequence.current) {
        setCartLookupError(true);
        setError(requestError.message);
      }
    } finally {
      if (request === lookupSequence.current) setCheckingCart(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    catalog.refresh();
    refreshCart();
    return () => {
      scanRequestSequence.current += 1;
      setScannerVisible(false);
      setScanBusy(false);
    };
  }, [catalog.refresh, refreshCart]));

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const productById = useMemo(() => new Map(cartItems
    .filter((item) => !unavailableIds.has(item.product.id))
    .map((item) => [item.product.id, item.product])), [cartItems, unavailableIds]);
  const totalCents = cartItems.reduce((sum, item) => {
    const product = item.product;
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
    && Number.isSafeInteger(totalCents) && !checkingCart && !cartLookupError && !submitting;

  function addProduct(product) {
    if (pendingSale) return;
    if (!Object.keys(cartRef.current).length) setCartLookupError(false);
    setCart((current) => {
      const previous = current[product.id];
      const currentQuantity = previous ? Number(previous.quantity) : 0;
      if (currentQuantity >= product.stock_quantity) return current;
      return { ...current, [product.id]: { product, quantity: String(currentQuantity + 1) } };
    });
    setUnavailableIds((current) => {
      const next = new Set(current);
      next.delete(product.id);
      return next;
    });
    setError('');
  }

  function closeScanner() {
    scanRequestSequence.current += 1;
    setScannerVisible(false);
    setScanBusy(false);
    setScanRetryCode('');
  }

  async function handleScannedBarcode(barcode) {
    if (pendingSaleRef.current || submittingRef.current) return;
    const request = ++scanRequestSequence.current;
    setScanBusy(true);
    setScanRetryCode('');
    setScanFeedback(`Checking ${barcode}...`);
    try {
      const product = await getProductByBarcode(barcode);
      if (request !== scanRequestSequence.current || pendingSaleRef.current || submittingRef.current) return;
      if (!product.active) {
        setScanFeedback('This product is archived. Restore it in Inventory before selling it.');
      } else if (product.stock_quantity <= 0) {
        setScanFeedback(`${product.name} is out of stock.`);
      } else {
        const selectedQuantity = Number(cartRef.current[product.id]?.quantity || 0);
        if (selectedQuantity >= product.stock_quantity) {
          setScanFeedback(`${product.name} has reached its available stock in this cart.`);
        } else {
          addProduct(product);
          setScanFeedback(`${product.name} added to the cart. Quantity: ${selectedQuantity + 1}.`);
        }
      }
    } catch (requestError) {
      if (request !== scanRequestSequence.current) return;
      if (requestError.status === 404) setScanFeedback('This barcode is not in Inventory. The cart is unchanged.');
      else {
        setScanFeedback(requestError.message);
        setScanRetryCode(barcode);
      }
    } finally {
      if (request === scanRequestSequence.current) setScanBusy(false);
    }
  }

  function changeQuantity(id, quantity) {
    if (pendingSale || !/^\d*$/.test(quantity)) return;
    setCart((current) => ({ ...current, [id]: { ...current[id], quantity } }));
    setError('');
  }

  function removeProduct(id) {
    if (pendingSale) return;
    if (Object.keys(cartRef.current).length === 1) setCartLookupError(false);
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setUnavailableIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setError('');
  }

  function changeCash(value) {
    if (/^\d*(?:\.\d{0,2})?$/.test(value)) setCashInput(value);
  }

  async function finalizeSale() {
    if (submittingRef.current || (!pendingSale && !canFinalize)) return;
    closeScanner();
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
      setUnavailableIds(new Set());
      setCartLookupError(false);
      setCashInput('');
      setPendingSale(null);
      catalog.refresh();
    } catch (requestError) {
      if (requestError.status && requestError.status < 500) setPendingSale(null);
      setError(requestError.network
        ? 'Connection lost. Keep this cart unchanged and retry when the server is available.'
        : requestError.message);
      if (requestError.status === 409) {
        catalog.refresh();
        refreshCart(true);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <View
        ref={checkoutKeyboard.containerRef}
        collapsable={false}
        onLayout={checkoutKeyboard.onContainerLayout}
        style={styles.screen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          enabled={Platform.OS !== 'web'}
          keyboardVerticalOffset={checkoutKeyboard.keyboardOffset}
          style={styles.screen}
        >
          <FlatList
            ref={checkoutKeyboard.listRef}
            style={styles.screen}
            keyboardShouldPersistTaps="handled"
            onLayout={checkoutKeyboard.onListLayout}
            onContentSizeChange={checkoutKeyboard.scrollToCash}
            contentContainerStyle={styles.content}
            data={catalog.loading ? [] : catalog.items}
            keyExtractor={(product) => String(product.id)}
            ListHeaderComponent={<OrdersHeader
              error={error}
              catalogError={catalog.error}
              query={catalog.query}
              onQueryChange={catalog.setQuery}
              pendingSale={pendingSale}
              loading={catalog.loading}
              submitting={submitting}
              onRefresh={() => { catalog.refresh(); refreshCart(); }}
              onScanBarcode={() => {
                setScanFeedback('');
                setScanRetryCode('');
                setScannerVisible(true);
              }}
            />}
            ListEmptyComponent={!catalog.loading && !catalog.error
              ? <Text style={styles.muted}>{catalog.query ? 'No matching in-stock products.' : 'search a product.'}</Text> : null}
            renderItem={({ item }) => {
              const selectedQuantity = Number(cart[item.id]?.quantity || 0);
              const disabled = Boolean(pendingSale) || catalog.loading || submitting || selectedQuantity >= item.stock_quantity;
              return <AvailableProductRow
                product={item}
                disabled={disabled}
                onAdd={() => addProduct(item)}
              />;
            }}
            ListFooterComponent={<>
              {checkingCart ? <Text style={styles.muted}>Checking selected products...</Text> : null}
              {cartLookupError ? <>
                <Text style={styles.error}>Selected products could not be checked.</Text>
                <Button title="Retry selected products" onPress={() => refreshCart()} />
              </> : null}
              <CheckoutPanel
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
                onCashFocus={checkoutKeyboard.onCashFocus}
                onCashBlur={checkoutKeyboard.onCashBlur}
                onFinalize={finalizeSale}
              />
            </>}
          />
        </KeyboardAvoidingView>
      </View>
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      {scannerVisible ? <BarcodeScannerModal
        visible={scannerVisible}
        onClose={closeScanner}
        onScan={handleScannedBarcode}
        onScanNext={() => { setScanFeedback(''); setScanRetryCode(''); }}
        feedback={scanFeedback}
        busy={scanBusy}
        retryCode={scanRetryCode}
        onRetry={() => handleScannedBarcode(scanRetryCode)}
      /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { padding: 16, paddingBottom: 40 },
  muted: { color: '#555' },
  error: { color: '#b00020' },
});
