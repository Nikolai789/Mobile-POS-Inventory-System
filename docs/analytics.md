# Shop analytics

Open **Analytics** in the app drawer. The screen defaults to the last seven Philippine business days, including today.

## API

`GET /api/analytics?period=7d`

| Period | Coverage | Trend intervals |
| --- | --- | --- |
| `today` | Current Philippine business day | Hour |
| `7d` (default) | Today and the previous six days | Day |
| `30d` | Today and the previous 29 days | Day |
| `all` | First recorded sale through today | Month |

The response contains `period`, `time_zone`, `generated_at`, `range`, `summary`, `top_products`, and `sales_trend`. The shared HTTP contract is defined in `shared/contracts.ts`.

- `range.start_date` and `range.end_date` are inclusive Philippine calendar dates. `start_at` is the inclusive UTC boundary; `end_at` is exclusive.
- `summary` contains total sales, receipt count, units sold, and average sale value. Empty periods return zeros.
- `top_products` contains at most ten products ordered by units sold descending, then case-insensitive catalog name and product ID ascending. Archived products remain included.
- `sales_trend.points` is chronological and includes zero-sale intervals. Hour keys carry `+08:00`; day and month keys use `YYYY-MM-DD` and `YYYY-MM`, respectively.
- Invalid, empty, repeated, or object-valued `period` parameters return HTTP 400. Server failures return HTTP 500 with a generic error message.

## Calculation and maintenance

Sales totals and receipt counts come from `sales`. Units and product revenue come from `sale_items`, using recorded unit prices. Amounts are aggregated in integer centavos and returned as PHP amounts; average sale value rounds to the nearest centavo. Keeping receipt and item aggregates separate prevents double counting multi-product receipts.

Products are grouped by ID and labeled with their current catalog name. Stored receipt names provide a fallback for legacy missing catalog entries. The service reads existing records without modifying receipts or inventory.

The backend follows the existing route → controller → service structure. The screen uses a typed API helper, a lifecycle-aware fetching hook, and independent metric, trend, and product components. Refreshes run on focus, foreground return, pull-to-refresh, and Philippine midnight. Superseded requests are aborted and ignored. Failed same-period refreshes retain the last successful figures and timestamp; switching periods hides the previous figures immediately.

The sale timestamp index is reused. Startup creates `sale_items_sale_product_idx` idempotently; restarting the backend installs this index without a manual migration.

## Verification

Run `npm run check` for frontend/backend tests, lint, and both type checks.

For interface checks, verify all periods, narrow screens, long product names, selecting and scrolling chart bars, drawer navigation, rapid period changes during a slow request, retry after a failed load, and refresh after foreground return or Philippine midnight. Use a temporary database rather than modifying shop data.
