import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ComponentType } from 'react';
import DashboardScreen from '../../src/features/dashboard/screens/DashboardScreen';
import InventoryScreen from '../../src/features/catalog/screens/InventoryScreen';
import ArchivedProductsScreen from '../../src/features/catalog/screens/ArchivedProductsScreen';
import CheckoutScreen from '../../src/features/checkout/screens/CheckoutScreen';
import PurchaseHistoryScreen from '../../src/features/history/screens/PurchaseHistoryScreen';
import AnalyticsScreen from '../../src/features/analytics/screens/AnalyticsScreen';
import { getDashboard } from '../../src/shared/api/dashboard';
import { getAnalytics } from '../../src/shared/api/analytics';
import { getSale, getSales } from '../../src/shared/api/sales';
import { searchProducts } from '../../src/shared/api/products';
import { focus } from '../helpers/focus';

jest.mock('expo-router', () => ({
  useFocusEffect: jest.requireActual<typeof import('../helpers/focus')>('../helpers/focus').useTestFocusEffect,
  router: { navigate: jest.fn() },
}));
jest.mock('../../src/shared/api/dashboard');
jest.mock('../../src/shared/api/analytics');
jest.mock('../../src/shared/api/sales');
jest.mock('../../src/shared/api/products');

beforeEach(() => {
  focus.active = true;
  jest.mocked(getDashboard).mockResolvedValue({
    business_date: '2026-10-20', time_zone: 'Asia/Manila', today: { total_sales: 0, transaction_count: 0 },
    low_stock: { count: 0, items: [] }, latest_sale: null,
  });
  jest.mocked(searchProducts).mockResolvedValue({ items: [], next_offset: null });
  jest.mocked(getSales).mockResolvedValue([]);
  jest.mocked(getAnalytics).mockResolvedValue({
    period: '7d', time_zone: 'Asia/Manila', generated_at: '2026-10-20T00:00:00Z',
    range: { start_date: '2026-10-14', end_date: '2026-10-20', start_at: '2026-10-13T16:00:00Z', end_at: '2026-10-20T16:00:00Z' },
    summary: { total_sales: 0, transaction_count: 0, units_sold: 0, average_sale_value: 0 },
    top_products: [], sales_trend: { granularity: 'day', points: [] },
  });
});

const screens: [string, ComponentType, string][] = [
  ['dashboard', DashboardScreen, 'Dashboard'],
  ['inventory', InventoryScreen, 'Inventory'],
  ['archived products', ArchivedProductsScreen, 'Archived products'],
  ['checkout', CheckoutScreen, 'Process Orders'],
  ['purchase history', PurchaseHistoryScreen, 'Purchase History'],
  ['analytics', AnalyticsScreen, 'Analytics'],
];
test.each(screens)('%s screen renders its existing interface', async (_name, Screen, heading) => {
  const view = await render(<Screen />);
  expect(view.getByText(heading)).toBeTruthy();
  await waitFor(() => expect(view.queryByLabelText(/^Loading (inventory|archived products|dashboard|purchase history|analytics)$/)).toBeNull());
});

test('purchase history opens and closes a receipt through the shared loader', async () => {
  const summary = { id: 7, total_amount: 2, cash_received: 5, change_amount: 3, created_at: '2026-10-20 00:00:00' };
  jest.mocked(getSales).mockResolvedValueOnce([summary]);
  jest.mocked(getSale).mockResolvedValueOnce({ ...summary, items: [] });
  const view = await render(<PurchaseHistoryScreen />);
  await fireEvent.press(await view.findByLabelText('Open receipt 7'));
  expect(await view.findByText('Cash received')).toBeTruthy();
  await fireEvent.press(view.getByText('Close'));
  expect(view.queryByText('Cash received')).toBeNull();
});
