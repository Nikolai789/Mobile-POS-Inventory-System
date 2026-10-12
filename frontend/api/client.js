import { API_BASE_URL } from './config';

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (_error) {
    const error = new Error('Unable to reach the POS server. Check that it is running and the URL is correct.');
    error.network = true;
    throw error;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'The server returned an error.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export const getProducts = () => apiRequest('/products');

export const searchProducts = ({ q = '', limit = 30, offset = 0, inStock = false, status = 'active' }, signal) => {
  const params = `q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&in_stock=${inStock ? '1' : '0'}&status=${status}`;
  return apiRequest(`/products/search?${params}`, { signal });
};

export const lookupProducts = async (ids) => {
  const groups = [];
  for (let offset = 0; offset < ids.length; offset += 100) groups.push(ids.slice(offset, offset + 100));
  const results = await Promise.all(groups.map((group) => apiRequest(`/products/lookup?ids=${group.join(',')}`)));
  return results.flat();
};

export const getProductByBarcode = (barcode) => apiRequest(
  `/products/by-barcode?value=${encodeURIComponent(barcode)}`,
);

export const restoreProduct = (id, product) => apiRequest(`/products/${id}/restore`, {
  method: 'PATCH',
  body: JSON.stringify(product),
});

export const createProduct = (product) => apiRequest('/products', {
  method: 'POST',
  body: JSON.stringify(product),
});

export const updateProduct = (id, product) => apiRequest(`/products/${id}`, {
  method: 'PUT',
  body: JSON.stringify(product),
});

export const archiveProduct = (id) => apiRequest(`/products/${id}`, {
  method: 'DELETE',
});

export const deleteArchivedProduct = (id) => apiRequest(`/products/${id}/permanent`, {
  method: 'DELETE',
});

export const updateStock = (id, stock_quantity) => apiRequest(`/products/${id}/stock`, {
  method: 'PATCH',
  body: JSON.stringify({ stock_quantity }),
});

export const createSale = (sale) => apiRequest('/sales', {
  method: 'POST',
  body: JSON.stringify(sale),
});

export const getSales = () => apiRequest('/sales');

export const getSale = (id) => apiRequest(`/sales/${id}`);

export const getDashboard = () => apiRequest('/dashboard');
