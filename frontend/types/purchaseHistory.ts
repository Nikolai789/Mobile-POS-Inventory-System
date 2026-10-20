export type SalesSort = 'newest' | 'oldest';

export interface SalesFilters {
  /** YYYY-MM-DD in Philippine time; null or omitted shows all dates. */
  date?: string | null;
  sort?: SalesSort;
}

export interface SaleSummary {
  id: number;
  total_amount: number;
  cash_received: number | null;
  change_amount: number | null;
  created_at: string;
}
