import type { DashboardResponse } from '../../../shared/contracts';
import { apiRequest } from './http';

export const getDashboard = (signal?: AbortSignal) => apiRequest<DashboardResponse>('/dashboard', { signal });
