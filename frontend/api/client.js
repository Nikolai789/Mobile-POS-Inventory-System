import { API_BASE_URL } from './config';

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (error) {
    throw new Error('Unable to reach the POS server. Check that it is running and the URL is correct.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The server returned an error.');
  return body;
}

export const getProducts = () => apiRequest('/products');

export const updateStock = (id, stock_quantity) => apiRequest(`/products/${id}/stock`, {
  method: 'PATCH',
  body: JSON.stringify({ stock_quantity }),
});

export const createSale = (items) => apiRequest('/sales', {
  method: 'POST',
  body: JSON.stringify({ items }),
});