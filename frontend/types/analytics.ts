export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';
export type TrendGranularity = 'hour' | 'day' | 'month';

export interface AnalyticsSummary {
  total_sales: number;
  transaction_count: number;
  units_sold: number;
  average_sale_value: number;
}

export interface TopProduct {
  product_id: number;
  name: string;
  units_sold: number;
  total_sales: number;
}

export interface SalesTrendPoint {
  /** Philippine local hour (with +08:00), YYYY-MM-DD, or YYYY-MM, per granularity. */
  bucket: string;
  total_sales: number;
  transaction_count: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  time_zone: 'Asia/Manila';
  generated_at: string;
  range: {
    start_date: string;
    end_date: string;
    start_at: string;
    /** Exclusive UTC boundary; the displayed end_date is inclusive. */
    end_at: string;
  };
  summary: AnalyticsSummary;
  top_products: TopProduct[];
  sales_trend: { granularity: TrendGranularity; points: SalesTrendPoint[] };
}
