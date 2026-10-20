import { act, renderHook } from '@testing-library/react-native';
import type { Product, ProductPage } from '../../shared/contracts';
import { createProduct, restoreProduct, searchProducts } from '../../src/shared/api/products';
import useProductCatalog from '../../src/features/catalog/hooks/useProductCatalog';
import useProductForm from '../../src/features/catalog/hooks/useProductForm';
import { deferred } from '../helpers/deferred';
import { focus } from '../helpers/focus';

jest.mock('expo-router', () => ({ useFocusEffect: jest.requireActual<typeof import('../helpers/focus')>('../helpers/focus').useTestFocusEffect }));
jest.mock('../../src/shared/api/products');
const search = jest.mocked(searchProducts);
const product: Product = { id: 1, name: 'Coffee', barcode: 'COFFEE', price: 1.25, stock_quantity: 3 };
beforeEach(() => { focus.active = true; jest.resetAllMocks(); });
afterEach(() => { jest.useRealTimers(); });

test('search-only checkout catalog does not download the full inventory', async () => {
  const { result } = await renderHook(() => useProductCatalog({ searchOnly: true, inStock: true }));
  expect(result.current.loading).toBe(false);
  expect(search).not.toHaveBeenCalled();
});

test('search debounces edits, cancels old queries and rejects late results', async () => {
  jest.useFakeTimers();
  const old = deferred<ProductPage>();
  search.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ items: [{ ...product, name: 'New Coffee' }], next_offset: null });
  const { result } = await renderHook(() => useProductCatalog());
  await act(() => jest.advanceTimersByTime(0));
  await act(() => result.current.setQuery('new'));
  expect(search.mock.calls[0][1]?.aborted).toBe(true);
  await act(() => jest.advanceTimersByTime(299));
  expect(search).toHaveBeenCalledTimes(1);
  await act(() => jest.advanceTimersByTime(1));
  expect(result.current.items[0].name).toBe('New Coffee');
  await act(() => old.resolve({ items: [product], next_offset: null }));
  expect(result.current.items[0].name).toBe('New Coffee');
});

test('paging is serialized and an old page cannot enter a new search', async () => {
  jest.useFakeTimers();
  const page = deferred<ProductPage>();
  search.mockResolvedValueOnce({ items: [product], next_offset: 30 }).mockReturnValueOnce(page.promise)
    .mockResolvedValueOnce({ items: [{ ...product, id: 3 }], next_offset: null });
  const { result } = await renderHook(() => useProductCatalog());
  await act(() => jest.advanceTimersByTime(0));
  await act(() => { void result.current.loadMore(); void result.current.loadMore(); });
  expect(search).toHaveBeenCalledTimes(2);
  expect(search.mock.calls[1][0]).toMatchObject({ offset: 30 });
  await act(() => result.current.setQuery('changed'));
  expect(search.mock.calls[1][1]?.aborted).toBe(true);
  await act(() => jest.advanceTimersByTime(300));
  await act(() => page.resolve({ items: [{ ...product, id: 2 }], next_offset: null }));
  expect(result.current.items.map((item) => item.id)).toEqual([3]);
});

test('search failure exposes retry and a successful refresh restores results', async () => {
  jest.useFakeTimers();
  search.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ items: [product], next_offset: null });
  const { result } = await renderHook(() => useProductCatalog());
  await act(() => jest.advanceTimersByTime(0));
  expect(result.current.error).toBe('offline');
  await act(() => result.current.refresh());
  await act(() => jest.advanceTimersByTime(0));
  expect(result.current.items).toEqual([product]);
  expect(result.current.error).toBe('');
});

test('product editor clears only edited field errors and prevents duplicate saves', async () => {
  const saved = deferred<Product>();
  jest.mocked(createProduct).mockReturnValueOnce(saved.promise);
  const onSaved = jest.fn();
  const { result } = await renderHook(() => useProductForm(onSaved));
  await act(() => result.current.open());
  await act(() => result.current.save());
  expect(result.current.fieldErrors.name).toBeDefined();
  await act(() => result.current.update({ name: 'Coffee' }));
  expect(result.current.fieldErrors.name).toBeUndefined();
  expect(result.current.fieldErrors.price).toBeDefined();
  await act(() => result.current.update({ barcode: 'COFFEE', price: '1.25', stock_quantity: '3' }));
  let pending: Promise<void>;
  await act(() => { pending = result.current.save(); void result.current.save(); result.current.close(); });
  expect(createProduct).toHaveBeenCalledTimes(1);
  expect(result.current.visible).toBe(true);
  await act(async () => { saved.resolve(product); await pending; });
  expect(result.current.visible).toBe(false);
  expect(onSaved).toHaveBeenCalledTimes(1);
});

test('restoring a product requires fresh stock, retains server errors and retries explicitly', async () => {
  jest.mocked(restoreProduct).mockRejectedValueOnce(new Error('Barcode already belongs to another product')).mockResolvedValueOnce({ ...product, active: 1 });
  const { result } = await renderHook(() => useProductForm(jest.fn()));
  await act(() => result.current.open(product, 'restore'));
  expect(result.current.form.stock_quantity).toBe('');
  await act(() => result.current.save());
  expect(restoreProduct).not.toHaveBeenCalled();
  await act(() => result.current.update({ stock_quantity: '0' }));
  await act(() => result.current.save());
  expect(result.current.error).toBe('Barcode already belongs to another product');
  expect(result.current.visible).toBe(true);
  await act(() => result.current.save());
  expect(restoreProduct).toHaveBeenCalledTimes(2);
  expect(result.current.visible).toBe(false);
});
