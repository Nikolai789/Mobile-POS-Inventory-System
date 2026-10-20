import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import useFocusedResource from '../../src/shared/hooks/useFocusedResource';
import useReceipt from '../../src/shared/hooks/useReceipt';
import { getSale } from '../../src/shared/api/sales';
import type { Receipt } from '../../shared/contracts';
import { deferred } from '../helpers/deferred';
import { focus } from '../helpers/focus';

jest.mock('expo-router', () => ({ useFocusEffect: jest.requireActual<typeof import('../helpers/focus')>('../helpers/focus').useTestFocusEffect }));
jest.mock('../../src/shared/api/sales');
beforeEach(() => { focus.active = true; });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('filter changes hide old data immediately and ignore superseded responses', async () => {
  const old = deferred<string>();
  const latest = deferred<string>();
  const load = jest.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const { result, rerender } = await renderHook(({ key }: { key: string }) => useFocusedResource<string>(key, load), { initialProps: { key: 'old' } });
  await rerender({ key: 'new' });
  expect(result.current.data).toBeNull();
  expect(load.mock.calls[0][0].aborted).toBe(true);
  await act(() => latest.resolve('new data'));
  await act(() => old.resolve('obsolete data'));
  expect(result.current.data).toBe('new data');
});

test('a failed same-filter refresh retains the last successful result', async () => {
  const load = jest.fn().mockResolvedValueOnce('retained').mockRejectedValueOnce(new Error('offline'));
  const { result } = await renderHook(() => useFocusedResource<string>('same', load));
  expect(result.current.data).toBe('retained');
  await act(() => result.current.refresh());
  expect(result.current).toMatchObject({ data: 'retained', error: 'offline', loading: false, refreshing: false });
});

test('blur aborts pending reads and blocks their late results', async () => {
  const request = deferred<string>();
  const load = jest.fn().mockReturnValue(request.promise);
  const { result, rerender } = await renderHook(() => useFocusedResource<string>('same', load));
  focus.active = false;
  await rerender(undefined);
  expect(load.mock.calls[0][0].aborted).toBe(true);
  await act(() => request.resolve('hidden result'));
  expect(result.current.data).toBeNull();
});

test('business resources refresh on foreground and Philippine midnight and remove subscriptions on blur', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-19T15:59:59Z'));
  let listener: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => { listener = callback; return { remove }; });
  const load = jest.fn().mockResolvedValue('data');
  const { rerender } = await renderHook(() => useFocusedResource('dashboard', load, { foreground: true, midnight: true }));
  expect(load).toHaveBeenCalledTimes(1);
  await act(() => { listener?.('background'); listener?.('active'); });
  expect(load).toHaveBeenCalledTimes(2);
  await act(() => jest.advanceTimersByTime(1250));
  expect(load).toHaveBeenCalledTimes(3);
  focus.active = false;
  await rerender(undefined);
  expect(remove).toHaveBeenCalledTimes(1);
  await act(() => jest.advanceTimersByTime(24 * 60 * 60 * 1000));
  expect(load).toHaveBeenCalledTimes(3);
});

test('reopening the same receipt ignores the result from its previous opening', async () => {
  const older = deferred<Receipt>();
  const newer = deferred<Receipt>();
  const oldReceipt: Receipt = { id: 1, total_amount: 1, cash_received: 1, change_amount: 0, created_at: '2026-10-20 00:00:00', items: [] };
  jest.mocked(getSale).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  const { result } = await renderHook(() => useReceipt());
  await act(() => { void result.current.open(1); });
  await act(() => result.current.close());
  await act(() => { void result.current.open(1); });
  await act(() => newer.resolve({ ...oldReceipt, total_amount: 2 }));
  await act(() => older.resolve(oldReceipt));
  expect(result.current.receipt?.total_amount).toBe(2);
});
