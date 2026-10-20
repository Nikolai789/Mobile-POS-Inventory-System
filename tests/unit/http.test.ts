import { apiRequest } from '../../src/shared/api/http';
import { ApiError } from '../../src/shared/api/errors';
import { validateApiUrl } from '../../src/shared/api/config';
import { createSale } from '../../src/shared/api/sales';
import { lookupProducts } from '../../src/shared/api/products';

const originalFetch = global.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });
afterAll(() => { global.fetch = originalFetch; });

test('normalizes API URLs and rejects missing, credentialed, or non-API URLs', () => {
  expect(validateApiUrl(' http://localhost:5000/api/ ')).toBe('http://localhost:5000/api');
  for (const value of [undefined, '', 'invalid', 'file:///api', 'https://example.com', 'http://a:b@localhost/api', 'http://localhost/api?token=x']) {
    expect(() => validateApiUrl(value)).toThrow('EXPO_PUBLIC_API_URL');
  }
});

test('merges caller headers without losing the JSON content type', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));
  await expect(apiRequest('/health', { headers: { 'X-Request': 'test' } })).resolves.toEqual({ ok: true });
  const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
  expect(headers.get('Content-Type')).toBe('application/json');
  expect(headers.get('X-Request')).toBe('test');
});

test('204 succeeds without attempting JSON parsing', async () => {
  const response = new Response(null, { status: 204 });
  const parse = jest.spyOn(response, 'json');
  fetchMock.mockResolvedValueOnce(response);
  await expect(apiRequest<void>('/products/1', { method: 'DELETE' })).resolves.toBeUndefined();
  expect(parse).not.toHaveBeenCalled();
});

test('preserves HTTP status and messages, distinguishes network and invalid responses', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Stock changed' }), { status: 409 }));
  await expect(apiRequest('/sales')).rejects.toMatchObject({ kind: 'http', status: 409, message: 'Stock changed' });
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  await expect(apiRequest('/sales')).rejects.toMatchObject({ kind: 'network', network: true });
  fetchMock.mockResolvedValueOnce(new Response('not JSON'));
  await expect(apiRequest('/sales')).rejects.toMatchObject({ kind: 'invalid-response', status: undefined });
  fetchMock.mockResolvedValueOnce(new Response('not JSON', { status: 503 }));
  await expect(apiRequest('/sales')).rejects.toMatchObject({ kind: 'http', status: 503 });
});

test('aborting a request is cancellation, including while reading its response body', async () => {
  const controller = new AbortController();
  controller.abort();
  fetchMock.mockRejectedValueOnce(new Error('aborted'));
  await expect(apiRequest('/sales', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError', kind: 'cancelled', network: false });
  const response = new Response('{}');
  jest.spyOn(response, 'json').mockRejectedValueOnce(new ApiError('aborted', 'cancelled'));
  fetchMock.mockResolvedValueOnce(response);
  await expect(apiRequest('/sales')).rejects.toMatchObject({ kind: 'cancelled' });
});

test('an incomplete successful sale response remains uncertain and is never retried by transport', async () => {
  fetchMock.mockResolvedValueOnce(new Response('{}'));
  await expect(createSale({ items: [], expected_total: 0, cash_received: 0, client_transaction_id: 'test' }))
    .rejects.toMatchObject({ kind: 'invalid-response', message: 'The server response was incomplete. Retry to retrieve this sale.' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('cart lookups batch at the server limit and propagate cancellation', async () => {
  const ids = Array.from({ length: 205 }, (_, index) => index + 1);
  const controller = new AbortController();
  fetchMock.mockImplementation(async () => new Response('[]'));
  await lookupProducts(ids, controller.signal);
  expect(fetchMock.mock.calls.map(([url]) => String(url).split('ids=')[1].split(',').length)).toEqual([100, 100, 5]);
  expect(fetchMock.mock.calls.every(([, options]) => options?.signal === controller.signal)).toBe(true);
});
