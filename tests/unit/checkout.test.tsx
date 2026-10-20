import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Product, Receipt } from '../../shared/contracts';
import { ApiError } from '../../src/shared/api/errors';
import { createSale } from '../../src/shared/api/sales';
import { lookupProducts } from '../../src/shared/api/products';
import useCheckout from '../../src/features/checkout/hooks/useCheckout';
import { deferred } from '../helpers/deferred';
import { focus } from '../helpers/focus';

jest.mock('expo-router', () => ({ useFocusEffect: jest.requireActual<typeof import('../helpers/focus')>('../helpers/focus').useTestFocusEffect }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'df394239-a426-4265-9f13-aae049400001' }));
jest.mock('../../src/shared/api/sales');
jest.mock('../../src/shared/api/products');
const save = jest.mocked(createSale);
const lookup = jest.mocked(lookupProducts);
const product: Product = { id: 1, name: 'Coffee', barcode: 'COFFEE', price: 1.25, stock_quantity: 3 };
const receipt: Receipt = { id: 1, total_amount: 1.25, cash_received: 5, change_amount: 3.75, created_at: '2026-10-20 00:00:00', items: [] };
beforeEach(() => { focus.active = true; save.mockReset(); lookup.mockReset(); lookup.mockResolvedValue([product]); });

test('uncertain sale failures freeze the payload and retry the same transaction ID', async () => {
  const refresh = jest.fn();
  save.mockRejectedValueOnce(new ApiError('offline', 'network')).mockResolvedValueOnce(receipt);
  const { result } = await renderHook(() => useCheckout(refresh));
  await act(() => { result.current.addProduct(product); result.current.changeCash('5'); });
  await act(() => result.current.finalizeSale());
  expect(result.current.pendingSale).not.toBeNull();
  expect(result.current.error).toContain('Keep this cart unchanged');
  await act(() => { result.current.addProduct(product); result.current.changeQuantity(1, '2'); result.current.changeCash('10'); result.current.removeProduct(1); });
  expect(result.current.cart[1].quantity).toBe('1');
  expect(result.current.cashInput).toBe('5');
  await act(() => result.current.finalizeSale());
  expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  expect(result.current.cart).toEqual({});
  expect(result.current.pendingSale).toBeNull();
  expect(result.current.receipt).toEqual(receipt);
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('duplicate taps create only one request while the first sale is pending', async () => {
  const request = deferred<Receipt>();
  save.mockReturnValueOnce(request.promise);
  const { result } = await renderHook(() => useCheckout(jest.fn()));
  await act(() => { result.current.addProduct(product); result.current.changeCash('5'); });
  let pending: Promise<void>;
  await act(() => { pending = result.current.finalizeSale(); void result.current.finalizeSale(); });
  expect(save).toHaveBeenCalledTimes(1);
  expect(result.current.submitting).toBe(true);
  await act(async () => { request.resolve(receipt); await pending; });
  expect(result.current.submitting).toBe(false);
});

test.each(['network', 'invalid-response', 'server'] as const)('%s uncertainty retains a pending transaction', async (kind) => {
  save.mockRejectedValueOnce(new ApiError('uncertain', kind === 'server' ? 'http' : kind, kind === 'server' ? 500 : undefined));
  const { result } = await renderHook(() => useCheckout(jest.fn()));
  await act(() => { result.current.addProduct(product); result.current.changeCash('5'); });
  await act(() => result.current.finalizeSale());
  expect(result.current.pendingSale?.client_transaction_id).toBeDefined();
});

test('a definitive conflict unlocks the cart and refreshes current price and stock', async () => {
  save.mockRejectedValueOnce(new ApiError('Product prices changed.', 'http', 409));
  lookup.mockResolvedValueOnce([{ ...product, price: 2, stock_quantity: 0 }]);
  const refresh = jest.fn();
  const { result } = await renderHook(() => useCheckout(refresh));
  await act(() => { result.current.addProduct(product); result.current.changeCash('5'); });
  await act(() => result.current.finalizeSale());
  await waitFor(() => expect(result.current.checkingCart).toBe(false));
  expect(result.current.pendingSale).toBeNull();
  expect(result.current.totalCents).toBe(200);
  expect(result.current.canFinalize).toBe(false);
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('leaving checkout invalidates an unfinished cart lookup', async () => {
  const request = deferred<Product[]>();
  lookup.mockReturnValueOnce(request.promise);
  const { result, rerender } = await renderHook(() => useCheckout(jest.fn()));
  await act(() => result.current.addProduct(product));
  await act(() => { void result.current.refreshCart(); });
  const signal = lookup.mock.calls[0][1];
  focus.active = false;
  await rerender(undefined);
  expect(signal?.aborted).toBe(true);
  await act(() => request.resolve([{ ...product, price: 50 }]));
  expect(result.current.totalCents).toBe(125);
});
