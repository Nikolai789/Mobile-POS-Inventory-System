import type { BarcodeProduct, Product, ProductInput, ProductPage, ProductSearch } from '../../../shared/contracts';
import { apiRequest } from './http';

export function searchProducts<T extends Product = Product>(
  { q = '', limit = 30, offset = 0, inStock = false, status = 'active' }: ProductSearch,
  signal?: AbortSignal,
) {
  const params = `q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&in_stock=${inStock ? '1' : '0'}&status=${status}`;
  return apiRequest<ProductPage<T>>(`/products/search?${params}`, { signal });
}

export async function lookupProducts(ids: number[], signal?: AbortSignal): Promise<Product[]> {
  const groups: number[][] = [];
  for (let offset = 0; offset < ids.length; offset += 100) groups.push(ids.slice(offset, offset + 100));
  return (await Promise.all(groups.map((group) => apiRequest<Product[]>(`/products/lookup?ids=${group.join(',')}`, { signal })))).flat();
}

export const getProductByBarcode = (barcode: string, signal?: AbortSignal) => apiRequest<BarcodeProduct>(
  `/products/by-barcode?value=${encodeURIComponent(barcode)}`, { signal },
);
export const restoreProduct = (id: number, product: ProductInput) => apiRequest<BarcodeProduct>(`/products/${id}/restore`, {
  method: 'PATCH', body: JSON.stringify(product),
});
export const createProduct = (product: ProductInput) => apiRequest<Product>('/products', {
  method: 'POST', body: JSON.stringify(product),
});
export const updateProduct = (id: number, product: ProductInput) => apiRequest<Product>(`/products/${id}`, {
  method: 'PUT', body: JSON.stringify(product),
});
export const archiveProduct = (id: number) => apiRequest<void>(`/products/${id}`, { method: 'DELETE' });
export const deleteArchivedProduct = (id: number) => apiRequest<void>(`/products/${id}/permanent`, { method: 'DELETE' });
