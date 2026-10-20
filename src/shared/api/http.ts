import { API_BASE_URL } from './config';
import { ApiError, isRequestCancelled } from './errors';

function serverMessage(body: unknown): string {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') return body.error;
  return 'The server returned an error.';
}

/** JSON transport only. Feature code owns retry decisions, especially for mutations. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted || isRequestCancelled(error)) throw new ApiError('Request cancelled.', 'cancelled');
    throw new ApiError('Unable to reach the POS server. Check that it is running and the URL is correct.', 'network');
  }
  if (response.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (options.signal?.aborted || isRequestCancelled(error)) throw new ApiError('Request cancelled.', 'cancelled');
    if (!response.ok) throw new ApiError('The server returned an error.', 'http', response.status);
    throw new ApiError('The server returned an invalid response.', 'invalid-response');
  }
  if (!response.ok) throw new ApiError(serverMessage(body), 'http', response.status);
  return body as T;
}
