import { apiRequest } from './client';
import type { AnalyticsPeriod, AnalyticsResponse } from '../types/analytics';

export function getAnalytics(period: AnalyticsPeriod, signal?: AbortSignal): Promise<AnalyticsResponse> {
  return apiRequest(`/analytics?period=${encodeURIComponent(period)}`, { signal });
}
