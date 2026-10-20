const { getDatabase, rowsFromResult } = require('../database');
const { BUSINESS_TIME_ZONE, businessDayWindow } = require('../utils/businessTime');

const LOW_STOCK_LIMIT = 5;
const LOW_STOCK_PREVIEW_SIZE = 5;

function getDashboard(now = new Date()) {
  const database = getDatabase();
  const day = businessDayWindow(now);
  const sales = rowsFromResult(database.exec(`
    SELECT COUNT(*) AS transaction_count,
      COALESCE(SUM(CAST(ROUND(total_amount * 100) AS INTEGER)), 0) AS total_cents
    FROM sales WHERE created_at >= ? AND created_at < ?
  `, [day.start, day.end]))[0];
  const lowStockCount = rowsFromResult(database.exec(`
    SELECT COUNT(*) AS count FROM products
    WHERE active = 1 AND stock_quantity <= ?
  `, [LOW_STOCK_LIMIT]))[0].count;
  const lowStockItems = rowsFromResult(database.exec(`
    SELECT id, name, stock_quantity FROM products
    WHERE active = 1 AND stock_quantity <= ?
    ORDER BY stock_quantity, name COLLATE NOCASE, id LIMIT ?
  `, [LOW_STOCK_LIMIT, LOW_STOCK_PREVIEW_SIZE]));
  const latestSale = rowsFromResult(database.exec(`
    SELECT id, total_amount, created_at FROM sales
    ORDER BY created_at DESC, id DESC LIMIT 1
  `))[0] || null;

  return {
    business_date: day.date,
    time_zone: BUSINESS_TIME_ZONE,
    today: { total_sales: sales.total_cents / 100, transaction_count: sales.transaction_count },
    low_stock: { count: lowStockCount, items: lowStockItems },
    latest_sale: latestSale,
  };
}

module.exports = { businessDayWindow, getDashboard };
