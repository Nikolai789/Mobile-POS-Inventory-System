export type RequestErrorKind = 'http' | 'network' | 'invalid-response' | 'cancelled';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: RequestErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = kind === 'cancelled' ? 'AbortError' : 'ApiError';
  }

  get network(): boolean {
    return this.kind === 'network';
  }
}

export function isRequestCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function normalizeRequestError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isRequestCancelled(error)) return new ApiError('Request cancelled.', 'cancelled');
  return new ApiError(error instanceof Error ? error.message : 'Unable to complete request.', 'invalid-response');
}
