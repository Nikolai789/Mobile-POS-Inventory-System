import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import type { PermissionStatus } from 'expo-modules-core';
import type { BarcodeProduct } from '../../shared/contracts';
import { getProductByBarcode } from '../../src/shared/api/products';
import BarcodeScannerModal from '../../src/features/catalog/components/BarcodeScannerModal';
import useBarcodeLookup from '../../src/features/catalog/hooks/useBarcodeLookup';
import { deferred } from '../helpers/deferred';
import { focus } from '../helpers/focus';

jest.mock('expo-router', () => ({ useFocusEffect: jest.requireActual<typeof import('../helpers/focus')>('../helpers/focus').useTestFocusEffect }));
jest.mock('../../src/shared/api/products');
jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
  CameraView: (props: Record<string, unknown>) => jest.requireActual<typeof import('react')>('react').createElement('CameraView', props),
}));
const product: BarcodeProduct = { id: 1, name: 'Coffee', barcode: 'COFFEE', price: 1.25, stock_quantity: 3, active: 1 };
beforeEach(() => { focus.active = true; jest.resetAllMocks(); });

test('closing or leaving a barcode lookup aborts it and discards late results', async () => {
  const pending = deferred<BarcodeProduct>();
  jest.mocked(getProductByBarcode).mockReturnValueOnce(pending.promise);
  const { result } = await renderHook(() => useBarcodeLookup());
  let loaded: BarcodeProduct | null | undefined;
  await act(() => { void result.current.lookup('COFFEE').then((value) => { loaded = value; }); });
  expect(result.current.busy).toBe(true);
  await act(() => result.current.cancel());
  expect(jest.mocked(getProductByBarcode).mock.calls[0][1]?.aborted).toBe(true);
  await act(() => pending.resolve(product));
  expect(loaded).toBeNull();
  expect(result.current.busy).toBe(false);
});

test('a superseded barcode result cannot replace a newer lookup', async () => {
  const old = deferred<BarcodeProduct>();
  jest.mocked(getProductByBarcode).mockReturnValueOnce(old.promise).mockResolvedValueOnce({ ...product, id: 2 });
  const { result } = await renderHook(() => useBarcodeLookup());
  let first: Promise<BarcodeProduct | null>;
  await act(() => { first = result.current.lookup('old'); });
  let latest: BarcodeProduct | null | undefined;
  await act(async () => { latest = await result.current.lookup('new'); });
  expect(latest?.id).toBe(2);
  await act(() => old.resolve(product));
  await expect(first!).resolves.toBeNull();
});

test('denied camera permission leaves manual search available without requesting permission automatically', async () => {
  const request = jest.fn();
  jest.mocked(useCameraPermissions).mockReturnValue([
    { granted: false, canAskAgain: false, status: 'denied' as PermissionStatus, expires: 'never' }, request, jest.fn(),
  ]);
  const close = jest.fn();
  const view = await render(<BarcodeScannerModal visible onClose={close} onScan={jest.fn()} />);
  expect(view.getByText('Camera access is needed to scan. You can still enter a barcode or use search manually.')).toBeTruthy();
  expect(view.queryByText('Allow camera')).toBeNull();
  expect(view.queryByLabelText('Barcode camera')).toBeNull();
  expect(request).not.toHaveBeenCalled();
  await fireEvent.press(view.getByText('Close scanner'));
  expect(close).toHaveBeenCalledTimes(1);
});

test('scanner accepts one barcode until Scan next rearms it', async () => {
  jest.mocked(useCameraPermissions).mockReturnValue([
    { granted: true, canAskAgain: true, status: 'granted' as PermissionStatus, expires: 'never' }, jest.fn(), jest.fn(),
  ]);
  const scan = jest.fn();
  const view = await render(<BarcodeScannerModal visible onClose={jest.fn()} onScan={scan} />);
  const camera = view.getByLabelText('Barcode camera');
  await act(async () => {
    await fireEvent(camera, 'barcodeScanned', { data: ' COFFEE ' });
  });
  expect(scan).toHaveBeenCalledWith('COFFEE');
  expect(view.queryByLabelText('Barcode camera')).toBeNull();
  await fireEvent.press(view.getByText('Scan next'));
  await fireEvent(view.getByLabelText('Barcode camera'), 'barcodeScanned', { data: 'TEA' });
  expect(scan.mock.calls).toEqual([['COFFEE'], ['TEA']]);
});
