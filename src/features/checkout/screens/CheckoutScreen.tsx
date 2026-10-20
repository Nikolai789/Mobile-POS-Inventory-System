import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Button, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import useProductCatalog from '../../catalog/hooks/useProductCatalog';
import useBarcodeLookup from '../../catalog/hooks/useBarcodeLookup';
import { normalizeRequestError } from '../../../shared/api/errors';
import useCheckout from '../hooks/useCheckout';
import useCheckoutKeyboard from '../hooks/useCheckoutKeyboard';
import AvailableProductRow from '../components/AvailableProductRow';
import CheckoutPanel from '../components/CheckoutPanel';
import OrdersHeader from '../components/OrdersHeader';
import ReceiptModal from '../../../shared/components/ReceiptModal';
import BarcodeScannerModal from '../../catalog/components/BarcodeScannerModal';

export default function CheckoutScreen() {
  const catalog = useProductCatalog({ inStock: true, searchOnly: true });
  const { containerRef, listRef, onContainerLayout, keyboardOffset, onListLayout, scrollToCash, onCashFocus, onCashBlur } = useCheckoutKeyboard();
  const checkout = useCheckout(catalog.refresh);
  const {
    cart, cartItems, productById, totalCents, cashInput, cashCents, changeCents,
    checkingCart, cartLookupError, submitting, error, pendingSale, receipt, canFinalize,
    refreshCart, addProduct, changeQuantity, removeProduct, changeCash, closeReceipt,
  } = checkout;
  const barcodeLookup = useBarcodeLookup();
  const scanBusy = barcodeLookup.busy;
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanFeedback, setScanFeedback] = useState('');
  const [scanRetryCode, setScanRetryCode] = useState('');

  useFocusEffect(useCallback(() => () => setScannerVisible(false), []));

  function closeScanner() {
    barcodeLookup.cancel();
    setScannerVisible(false);
    setScanRetryCode('');
  }
  async function handleScannedBarcode(barcode: string) {
    if (checkout.isLocked()) return;
    setScanRetryCode('');
    setScanFeedback(`Checking ${barcode}...`);
    try {
      const product = await barcodeLookup.lookup(barcode);
      if (!product || checkout.isLocked()) return;
      if (!product.active) {
        setScanFeedback('This product is archived. Restore it in Inventory before selling it.');
      } else if (product.stock_quantity <= 0) {
        setScanFeedback(`${product.name} is out of stock.`);
      } else {
        const selectedQuantity = checkout.quantityFor(product.id);
        if (selectedQuantity >= product.stock_quantity) {
          setScanFeedback(`${product.name} has reached its available stock in this cart.`);
        } else {
          addProduct(product);
          setScanFeedback(`${product.name} added to the cart. Quantity: ${selectedQuantity + 1}.`);
        }
      }
    } catch (cause) {
      const requestError = normalizeRequestError(cause);
      if (requestError.status === 404) setScanFeedback('This barcode is not in Inventory. The cart is unchanged.');
      else { setScanFeedback(requestError.message); setScanRetryCode(barcode); }
    }
  }
  async function finalizeSale() { closeScanner(); await checkout.finalizeSale(); }

  return (
    <>
      <View
        ref={containerRef}
        collapsable={false}
        onLayout={onContainerLayout}
        style={styles.screen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          enabled={Platform.OS !== 'web'}
          keyboardVerticalOffset={keyboardOffset}
          style={styles.screen}
        >
          <FlatList
            ref={listRef}
            style={styles.screen}
            keyboardShouldPersistTaps="handled"
            onLayout={onListLayout}
            onContentSizeChange={scrollToCash}
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
                onCashFocus={onCashFocus}
                onCashBlur={onCashBlur}
                onFinalize={finalizeSale}
              />
            </>}
          />
        </KeyboardAvoidingView>
      </View>
      <ReceiptModal receipt={receipt} onClose={closeReceipt} />
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
