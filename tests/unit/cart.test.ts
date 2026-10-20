import type { Product } from '../../shared/contracts';
import { calculateCheckout, cartReducer, emptyCart } from '../../src/features/checkout/model/cart';
import { parseCashCents } from '../../src/shared/utils/money';
import { emptyProductForm, productFormFromProduct, validateProductForm } from '../../src/features/catalog/utils/productForm';

const product: Product = { id: 1, name: 'Coffee', barcode: 'COFFEE', price: 1.25, stock_quantity: 3 };

test('cart transitions respect stock, accept unfinished quantity input, and use integer cents', () => {
  let cart = emptyCart();
  for (let index = 0; index < 4; index += 1) cart = cartReducer(cart, { type: 'add', product });
  expect(cart.items[1].quantity).toBe('3');
  expect(calculateCheckout(cart, '5')).toMatchObject({ totalCents: 375, cashCents: 500, changeCents: 125, valid: true });
  cart = cartReducer(cart, { type: 'quantity', id: 1, quantity: '' });
  expect(calculateCheckout(cart, '5').valid).toBe(false);
  expect(cartReducer(cart, { type: 'quantity', id: 1, quantity: '-1' })).toBe(cart);
  expect(cartReducer(cart, { type: 'remove', id: 1 })).toEqual(emptyCart());
});

test('reconciliation detects archived, depleted, and repriced products without resurrecting removed items', () => {
  const initial = cartReducer(emptyCart(), { type: 'add', product });
  const missing = cartReducer(initial, { type: 'reconcile', ids: [1], products: [] });
  expect(calculateCheckout(missing, '5').valid).toBe(false);
  const repriced = cartReducer(missing, { type: 'reconcile', ids: [1], products: [{ ...product, price: 1.5, stock_quantity: 0 }] });
  expect(calculateCheckout(repriced, '5')).toMatchObject({ totalCents: 150, valid: false });
  const removed = cartReducer(initial, { type: 'remove', id: 1 });
  expect(cartReducer(removed, { type: 'reconcile', ids: [1], products: [product] })).toEqual(emptyCart());
});

test('checkout rejects invalid cash, overlarge totals and quantities above available stock', () => {
  for (const cash of ['', '.', '-1', '1.001', 'Infinity']) expect(parseCashCents(cash)).toBeNull();
  const cart = cartReducer(emptyCart(), { type: 'add', product });
  expect(calculateCheckout(cart, '1').valid).toBe(false);
  expect(calculateCheckout(cartReducer(cart, { type: 'quantity', id: 1, quantity: '4' }), '10').valid).toBe(false);
  const huge = cartReducer(emptyCart(), { type: 'add', product: { ...product, price: Number.MAX_SAFE_INTEGER } });
  expect(calculateCheckout(huge, '90071992547409').valid).toBe(false);
});

test('product form validation preserves decimal, integer, trim, and restore rules', () => {
  expect(Object.keys(validateProductForm(emptyProductForm).errors)).toEqual(['name', 'barcode', 'price', 'stock_quantity']);
  expect(productFormFromProduct(product, true).stock_quantity).toBe('');
  expect(validateProductForm({ name: ' Coffee ', barcode: ' ABC ', price: '1.25', stock_quantity: '0' }).payload)
    .toEqual({ name: 'Coffee', barcode: 'ABC', price: 1.25, stock_quantity: 0 });
  for (const price of ['1.001', '-1', '', '1e2']) expect(validateProductForm({ ...productFormFromProduct(product), price }).errors.price).toBeDefined();
  for (const stock_quantity of ['-1', '1.5', '1e2', '']) expect(validateProductForm({ ...productFormFromProduct(product), stock_quantity }).errors.stock_quantity).toBeDefined();
});
