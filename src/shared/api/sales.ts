import type { Receipt, SaleRequest, SaleSummary, SalesFilters } from '../../../shared/contracts';
import { ApiError } from './errors';
import { apiRequest } from './http';

export async function createSale(sale: SaleRequest): Promise<Receipt> {
  const receipt = await apiRequest<Receipt | null>('/sales', { method: 'POST', body: JSON.stringify(sale) });
  if (!receipt?.id || !Array.isArray(receipt.items)) {
    throw new ApiError('The server response was incomplete. Retry to retrieve this sale.', 'invalid-response');
  }
  return receipt;
}

export function getSales(filters: SalesFilters = {}, signal?: AbortSignal) {
  const params: string[] = [];
  if (filters.date != null) params.push(`date=${encodeURIComponent(filters.date)}`);
  if (filters.sort != null) params.push(`sort=${encodeURIComponent(filters.sort)}`);
  return apiRequest<SaleSummary[]>(`/sales${params.length ? `?${params.join('&')}` : ''}`, { signal });
}

export const getSale = (id: number, signal?: AbortSignal) => apiRequest<Receipt>(`/sales/${id}`, { signal });
