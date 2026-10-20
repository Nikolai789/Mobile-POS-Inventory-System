import { apiRequest } from './http';
import type { AnalyticsPeriod, AnalyticsResponse } from '../../../shared/contracts';

export function getAnalytics(period: AnalyticsPeriod, signal?: AbortSignal): Promise<AnalyticsResponse> {
  return apiRequest<AnalyticsResponse>(`/analytics?period=${encodeURIComponent(period)}`, { signal });
}
