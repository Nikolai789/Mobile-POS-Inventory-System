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

export interface Product {
  id: number;
  name: string;
  barcode: string;
  /** PHP amount; arithmetic uses integer centavos. */
  price: number;
  stock_quantity: number;
}

export interface BarcodeProduct extends Product {
  active: 0 | 1;
}

export interface ArchivedProduct extends Product {
  can_delete: 0 | 1;
}

export interface ProductInput {
  name: string;
  barcode: string;
  price: number;
  stock_quantity: number;
}

export interface ProductPage<T extends Product = Product> {
  items: T[];
  next_offset: number | null;
}

export interface ProductSearch {
  q?: string;
  limit?: number;
  offset?: number;
  inStock?: boolean;
  status?: 'active' | 'archived';
}

export interface SaleRequest {
  client_transaction_id: string;
  items: { product_id: number; quantity: number }[];
  expected_total: number;
  cash_received: number;
}

export interface ReceiptItem {
  product_id: number;
  name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Receipt extends SaleSummary {
  items: ReceiptItem[];
}

export interface DashboardResponse {
  business_date: string;
  time_zone: 'Asia/Manila';
  today: { total_sales: number; transaction_count: number };
  low_stock: {
    count: number;
    items: Pick<Product, 'id' | 'name' | 'stock_quantity'>[];
  };
  latest_sale: Pick<SaleSummary, 'id' | 'total_amount' | 'created_at'> | null;
}
