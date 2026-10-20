/** Validate at the configuration boundary, before a request can be sent. */
export function validateApiUrl(value: string | undefined): string {
  if (!value?.trim()) throw new Error('Set EXPO_PUBLIC_API_URL in .env.local to the POS server /api URL.');
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTP or HTTPS /api URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || url.pathname.replace(/\/+$/, '') !== '/api') {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTP or HTTPS /api URL.');
  }
  return url.toString().replace(/\/+$/, '');
}

export const API_BASE_URL = validateApiUrl(process.env.EXPO_PUBLIC_API_URL);
