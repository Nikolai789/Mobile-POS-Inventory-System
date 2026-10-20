const { getDatabase, rowsFromResult } = require('../database');
const {
  BUSINESS_TIME_ZONE, DAY_MS, PHILIPPINE_UTC_OFFSET_MS,
  businessDate, businessDayWindow, businessMidnight, toSqlTimestamp,
} = require('../utils/businessTime');

const PERIOD_DAYS = { today: 1, '7d': 7, '30d': 30 };
const BUCKET_FORMATS = { hour: '%Y-%m-%dT%H:00:00+08:00', day: '%Y-%m-%d', month: '%Y-%m' };
const TOP_PRODUCT_LIMIT = 10;

function validatePeriod(period) {
  if (typeof period !== 'string' || !['today', '7d', '30d', 'all'].includes(period)) {
    const error = new Error('period must be today, 7d, 30d, or all');
    error.statusCode = 400;
    throw error;
  }
}

function periodWindow(database, period, now) {
  const today = businessDayWindow(now);
  let startDate;
  if (period === 'all') {
    const first = rowsFromResult(database.exec(`
      SELECT date(MIN(created_at), '+8 hours') AS date FROM sales WHERE created_at < ?
    `, [today.end]))[0];
    startDate = first.date || today.date;
  } else {
    startDate = businessDate(businessMidnight(today.date) - (PERIOD_DAYS[period] - 1) * DAY_MS);
  }
  return {
    start_date: startDate,
    end_date: today.date,
    start: toSqlTimestamp(businessMidnight(startDate)),
    end: today.end,
  };
}

function trendBuckets(startDate, endDate, granularity) {
  const buckets = [];
  if (granularity === 'month') {
    const cursor = new Date(`${startDate.slice(0, 7)}-01T00:00:00Z`);
    const lastMonth = endDate.slice(0, 7);
    while (cursor.toISOString().slice(0, 7) <= lastMonth) {
      buckets.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return buckets;
  }
  const step = granularity === 'hour' ? DAY_MS / 24 : DAY_MS;
  const end = businessMidnight(endDate) + DAY_MS;
  for (let cursor = businessMidnight(startDate); cursor < end; cursor += step) {
    const localTimestamp = new Date(cursor + PHILIPPINE_UTC_OFFSET_MS).toISOString();
    buckets.push(granularity === 'hour'
      ? `${localTimestamp.slice(0, 13)}:00:00+08:00` : localTimestamp.slice(0, 10));
  }
  return buckets;
}

function getAnalytics(period = '7d', now = new Date()) {
  validatePeriod(period);
  const database = getDatabase();
  const window = periodWindow(database, period, now);
  const params = [window.start, window.end];

  // Keep sale totals separate from line items: a join would count each receipt more than once.
  const sales = rowsFromResult(database.exec(`
    SELECT COUNT(*) AS transaction_count,
      COALESCE(SUM(CAST(ROUND(total_amount * 100) AS INTEGER)), 0) AS total_cents
    FROM sales WHERE created_at >= ? AND created_at < ?
  `, params))[0];
  const items = rowsFromResult(database.exec(`
    SELECT COALESCE(SUM(i.quantity), 0) AS units_sold
    FROM sales s JOIN sale_items i ON i.sale_id = s.id
    WHERE s.created_at >= ? AND s.created_at < ?
  `, params))[0];
  const topProducts = rowsFromResult(database.exec(`
    SELECT i.product_id, COALESCE(p.name, MAX(i.product_name), 'Unknown product') AS name,
      SUM(i.quantity) AS units_sold,
      SUM(CAST(ROUND(i.unit_price * 100) AS INTEGER) * i.quantity) AS total_cents
    FROM sales s JOIN sale_items i ON i.sale_id = s.id
    LEFT JOIN products p ON p.id = i.product_id
    WHERE s.created_at >= ? AND s.created_at < ?
    GROUP BY i.product_id
    ORDER BY units_sold DESC, name COLLATE NOCASE, i.product_id
    LIMIT ?
  `, [...params, TOP_PRODUCT_LIMIT])).map(({ total_cents, ...product }) => ({
    ...product, total_sales: total_cents / 100,
  }));

  const granularity = period === 'today' ? 'hour' : period === 'all' ? 'month' : 'day';
  const trendRows = rowsFromResult(database.exec(`
    SELECT strftime(?, created_at, '+8 hours') AS bucket,
      SUM(CAST(ROUND(total_amount * 100) AS INTEGER)) AS total_cents,
      COUNT(*) AS transaction_count
    FROM sales WHERE created_at >= ? AND created_at < ?
    GROUP BY bucket ORDER BY bucket
  `, [BUCKET_FORMATS[granularity], ...params]));
  const trendByBucket = new Map(trendRows.map((row) => [row.bucket, row]));
  const points = trendBuckets(window.start_date, window.end_date, granularity).map((bucket) => {
    const row = trendByBucket.get(bucket);
    return {
      bucket, total_sales: row ? row.total_cents / 100 : 0,
      transaction_count: row ? row.transaction_count : 0,
    };
  });

  return {
    period,
    time_zone: BUSINESS_TIME_ZONE,
    generated_at: now.toISOString(),
    range: {
      start_date: window.start_date,
      end_date: window.end_date,
      start_at: `${window.start.replace(' ', 'T')}Z`,
      end_at: `${window.end.replace(' ', 'T')}Z`,
    },
    summary: {
      total_sales: sales.total_cents / 100,
      transaction_count: sales.transaction_count,
      units_sold: items.units_sold,
      average_sale_value: sales.transaction_count
        ? Math.round(sales.total_cents / sales.transaction_count) / 100 : 0,
    },
    top_products: topProducts,
    sales_trend: { granularity, points },
  };
}

module.exports = { getAnalytics };
