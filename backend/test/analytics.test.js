const { test, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-analytics-test-'));
const testDatabasePath = path.join(tempDirectory, 'test.sqlite');
const previousDatabasePath = process.env.DATABASE_PATH;
process.env.DATABASE_PATH = testDatabasePath;
const { initializeDatabase, getDatabase, rowsFromResult, persistDatabase } = require('../database');
const { getAnalytics } = require('../services/analyticsService');

const NOW = new Date('2026-01-01T04:00:00.000Z');
let database;
let nextBarcode;

beforeEach(async () => {
  process.env.DATABASE_PATH = testDatabasePath;
  await initializeDatabase();
  database = getDatabase();
  nextBarcode = 1;
});

afterEach(() => {
  if (database) database.close();
  database = null;
  fs.rmSync(testDatabasePath, { force: true });
});

after(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
  if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousDatabasePath;
});

function product(name, price = 0.1) {
  database.run('INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, ?, 100)',
    [name, `ANALYTICS-${nextBarcode++}`, price]);
  return rowsFromResult(database.exec('SELECT last_insert_rowid() AS id'))[0].id;
}

function sale(createdAt, items) {
  const totalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  database.run('INSERT INTO sales (total_amount, created_at) VALUES (?, ?)', [totalCents / 100, createdAt]);
  const id = rowsFromResult(database.exec('SELECT last_insert_rowid() AS id'))[0].id;
  for (const item of items) {
    database.run(`
      INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `, [id, item.productId, item.name || 'Receipt name', item.quantity, item.price]);
  }
  return id;
}

function assertConsistent(result) {
  const totalCents = result.sales_trend.points.reduce((sum, point) => sum + Math.round(point.total_sales * 100), 0);
  const receipts = result.sales_trend.points.reduce((sum, point) => sum + point.transaction_count, 0);
  assert.equal(totalCents, Math.round(result.summary.total_sales * 100));
  assert.equal(receipts, result.summary.transaction_count);
}

test('empty analytics returns zero summaries and complete zero-sale intervals', async () => {
  for (const [period, count] of [['today', 24], ['7d', 7], ['30d', 30], ['all', 1]]) {
    const result = getAnalytics(period, NOW);
    assert.deepEqual(result.summary, {
      total_sales: 0, transaction_count: 0, units_sold: 0, average_sale_value: 0,
    });
    assert.deepEqual(result.top_products, []);
    assert.equal(result.sales_trend.points.length, count);
    assert.equal(result.time_zone, 'Asia/Manila');
    assert.equal(result.generated_at, NOW.toISOString());
    assertConsistent(result);
  }
  assert.equal(getAnalytics(undefined, NOW).period, '7d');
});

test('period boundaries are inclusive at Philippine midnight and exclusive at the next midnight', async () => {
  const id = product('Boundary product');
  const item = { productId: id, quantity: 1, price: 0.1 };
  for (const period of ['today', '7d', '30d']) {
    database.run('DELETE FROM sale_items; DELETE FROM sales;');
    const range = getAnalytics(period, NOW).range;
    const start = Date.parse(range.start_at);
    const sqlTime = (value) => new Date(value).toISOString().slice(0, 19).replace('T', ' ');
    sale(sqlTime(start - 1000), [item]);
    sale(sqlTime(start), [item]);
    sale('2026-01-01 15:59:59', [item]);
    sale('2026-01-01 16:00:00', [item]);
    const result = getAnalytics(period, NOW);
    assert.equal(result.summary.transaction_count, 2, period);
    assert.equal(result.summary.total_sales, 0.2, period);
    assert.equal(result.range.end_date, '2026-01-01');
    assert.equal(result.range.end_at, '2026-01-01T16:00:00Z');
    assertConsistent(result);
  }
  assert.equal(getAnalytics('7d', NOW).range.start_date, '2025-12-26');
  assert.equal(getAnalytics('30d', NOW).range.start_date, '2025-12-03');
  assert.equal(getAnalytics('today', new Date('2026-01-01T16:00:00Z')).summary.transaction_count, 1);
});

test('multi-item receipts count once and monetary aggregation rounds in cents', async () => {
  const coffee = product('Coffee');
  const tea = product('Tea', 0.2);
  sale('2026-01-01 01:00:00', [
    { productId: coffee, quantity: 3, price: 0.1 },
    { productId: tea, quantity: 1, price: 0.2 },
  ]);
  sale('2026-01-01 02:00:00', [{ productId: coffee, quantity: 2, price: 0.1 }]);
  const result = getAnalytics('today', NOW);
  assert.deepEqual(result.summary, {
    total_sales: 0.7, transaction_count: 2, units_sold: 6, average_sale_value: 0.35,
  });
  assert.deepEqual(result.top_products, [
    { product_id: coffee, name: 'Coffee', units_sold: 5, total_sales: 0.5 },
    { product_id: tea, name: 'Tea', units_sold: 1, total_sales: 0.2 },
  ]);
  assertConsistent(result);
});

test('product renames, price changes, and archiving preserve historical units and revenue', async () => {
  const id = product('Original name');
  sale('2025-12-28 00:00:00', [{ productId: id, name: 'Original name', quantity: 2, price: 0.1 }]);
  sale('2026-01-01 00:00:00', [{ productId: id, name: 'New name', quantity: 1, price: 0.3 }]);
  database.run('UPDATE products SET name = ?, price = 999, active = 0 WHERE id = ?', ['Current name', id]);
  const result = getAnalytics('7d', NOW);
  assert.deepEqual(result.top_products, [
    { product_id: id, name: 'Current name', units_sold: 3, total_sales: 0.5 },
  ]);
  assert.equal(result.summary.total_sales, 0.5);
  assert.equal(result.summary.average_sale_value, 0.25);
  assertConsistent(result);
});

test('rankings use units, then case-insensitive name and product ID, and return at most ten products', async () => {
  const ids = [];
  for (const name of ['same', 'Same', 'alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet']) {
    const id = product(name);
    ids.push(id);
    sale('2026-01-01 00:00:00', [{ productId: id, quantity: 1, price: 0.1 }]);
  }
  const winner = product('Winner');
  sale('2026-01-01 00:00:00', [{ productId: winner, quantity: 3, price: 0.1 }]);
  product('Unsold');
  const result = getAnalytics('today', NOW);
  assert.equal(result.top_products.length, 10);
  assert.equal(result.top_products[0].product_id, winner);
  assert.equal(result.top_products[1].name, 'alpha');
  // A narrower fixture verifies that identical names retain a stable product-ID tie break.
  database.run('DELETE FROM sale_items WHERE product_id NOT IN (?, ?)', ids.slice(0, 2));
  assert.deepEqual(getAnalytics('today', NOW).top_products.map((item) => item.product_id), ids.slice(0, 2));
  assert.equal(result.summary.units_sold, 15);
  assertConsistent(result);
});

test('hourly and daily buckets use Philippine dates, including leap days and year transitions', async () => {
  const id = product('Calendar product');
  const item = { productId: id, quantity: 1, price: 0.1 };
  sale('2025-12-31 16:00:00', [item]);
  sale('2026-01-01 15:59:59', [item]);
  const today = getAnalytics('today', NOW);
  assert.deepEqual(today.sales_trend.points[0], {
    bucket: '2026-01-01T00:00:00+08:00', total_sales: 0.1, transaction_count: 1,
  });
  assert.equal(today.sales_trend.points[23].total_sales, 0.1);
  assert.equal(today.sales_trend.points[1].total_sales, 0);
  const week = getAnalytics('7d', NOW);
  assert.deepEqual(week.sales_trend.points.map((point) => point.bucket), [
    '2025-12-26', '2025-12-27', '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01',
  ]);
  sale('2028-02-29 04:00:00', [item]);
  const leapMonth = getAnalytics('30d', new Date('2028-03-01T04:00:00Z'));
  assert.equal(leapMonth.range.start_date, '2028-02-01');
  assert.equal(leapMonth.sales_trend.points.length, 30);
  assert.equal(leapMonth.sales_trend.points[28].bucket, '2028-02-29');
  assert.equal(leapMonth.sales_trend.points[28].total_sales, 0.1);
  [today, week, leapMonth].forEach(assertConsistent);
});

test('all-time monthly trend fills gaps and excludes sales beyond the current business day', async () => {
  const id = product('Monthly product');
  const item = { productId: id, quantity: 1, price: 0.1 };
  sale('2025-12-15 00:00:00', [item]);
  sale('2026-03-01 00:00:00', [item]);
  sale('2026-03-01 16:00:00', [item]);
  const result = getAnalytics('all', new Date('2026-03-01T04:00:00Z'));
  assert.equal(result.range.start_date, '2025-12-15');
  assert.equal(result.sales_trend.granularity, 'month');
  assert.deepEqual(result.sales_trend.points, [
    { bucket: '2025-12', total_sales: 0.1, transaction_count: 1 },
    { bucket: '2026-01', total_sales: 0, transaction_count: 0 },
    { bucket: '2026-02', total_sales: 0, transaction_count: 0 },
    { bucket: '2026-03', total_sales: 0.1, transaction_count: 1 },
  ]);
  assertConsistent(result);
});

test('analytics endpoint defaults to seven days and rejects invalid or repeated period parameters', async () => {
  const app = express();
  app.use('/api/analytics', require('../routes/analyticsRoutes'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/analytics`;
    const response = await fetch(base);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.period, '7d');
    assert.equal(body.time_zone, 'Asia/Manila');
    assert.equal(body.sales_trend.points.length, 7);
    for (const query of ['period=', 'period=year', 'period=7d&period=30d', 'period[x]=today']) {
      const invalid = await fetch(`${base}?${query}`);
      assert.equal(invalid.status, 400, query);
      assert.match((await invalid.json()).error, /period must be/);
    }
    for (const period of ['today', '7d', '30d', 'all']) {
      const valid = await fetch(`${base}?period=${period}`);
      assert.equal(valid.status, 200);
      assert.equal((await valid.json()).period, period);
    }
    database.run('DROP TABLE sales');
    const failed = await fetch(base);
    assert.equal(failed.status, 500);
    assert.deepEqual(await failed.json(), { error: 'Unable to load analytics' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('database initialization creates the analytics index idempotently', async () => {
  persistDatabase();
  database.close();
  database = null;
  await initializeDatabase();
  database = getDatabase();
  assert.deepEqual(rowsFromResult(database.exec("PRAGMA index_info('sale_items_sale_product_idx')"))
    .map((column) => column.name), ['sale_id', 'product_id']);
});

test('legacy missing catalog entries use receipt names and average sales round to a cent', () => {
  const id = product('Old catalog name');
  sale('2026-01-01 00:00:00', [{ productId: id, name: 'Recorded name', quantity: 1, price: 0.01 }]);
  sale('2026-01-01 01:00:00', [{ productId: id, name: 'Recorded name', quantity: 1, price: 0 }]);
  // Simulate legacy data without a matching catalog entry; normal product deletion forbids this.
  database.run('PRAGMA foreign_keys = OFF');
  database.run('DELETE FROM products WHERE id = ?', [id]);
  const result = getAnalytics('today', NOW);
  assert.deepEqual(result.top_products, [
    { product_id: id, name: 'Recorded name', units_sold: 2, total_sales: 0.01 },
  ]);
  assert.equal(result.summary.average_sale_value, 0.01);
  assertConsistent(result);
});
