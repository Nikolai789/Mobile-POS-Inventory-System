const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

test('dashboard reports Philippine day sales, latest sale, and active low stock', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-dashboard-test-'));
  process.env.DATABASE_PATH = path.join(tempDirectory, 'test.sqlite');
  let server;
  try {
    const { getDatabase, initializeDatabase } = require('../database');
    const products = require('../services/productService');
    const { businessDayWindow, getDashboard } = require('../services/dashboardService');
    await initializeDatabase();

    const now = new Date('2026-10-13T12:00:00.000Z');
    assert.deepEqual(businessDayWindow(now), {
      date: '2026-10-13', start: '2026-10-12 16:00:00', end: '2026-10-13 16:00:00',
    });
    const empty = getDashboard(now);
    assert.deepEqual(empty.today, { total_sales: 0, transaction_count: 0 });
    assert.equal(empty.latest_sale, null);
    assert.deepEqual(empty.low_stock, { count: 0, items: [] });

    for (const [name, stock] of [
      ['Zero B', 0], ['Zero A', 0], ['One', 1], ['Two', 2],
      ['Three', 3], ['Four', 4], ['Five', 5], ['Six', 6],
    ]) products.createProduct({ name, barcode: name, price: 1, stock_quantity: stock });
    const archived = products.createProduct({ name: 'Archived', barcode: 'ARCHIVED', price: 1, stock_quantity: 0 });
    products.archiveProduct(archived.id);

    const database = getDatabase();
    for (const [amount, createdAt] of [
      [0.01, '2026-10-12 15:59:59'],
      [0.1, '2026-10-12 16:00:00'],
      [0.2, '2026-10-13 15:59:59'],
      [9.99, '2026-10-13 16:00:00'],
    ]) database.run('INSERT INTO sales (total_amount, created_at) VALUES (?, ?)', [amount, createdAt]);

    const summary = getDashboard(now);
    assert.equal(summary.business_date, '2026-10-13');
    assert.equal(summary.time_zone, 'Asia/Manila');
    assert.deepEqual(summary.today, { total_sales: 0.3, transaction_count: 2 });
    assert.equal(summary.latest_sale.id, 4);
    assert.equal(summary.latest_sale.total_amount, 9.99);
    assert.equal(summary.low_stock.count, 7);
    assert.deepEqual(summary.low_stock.items.map((item) => [item.name, item.stock_quantity]), [
      ['Zero A', 0], ['Zero B', 0], ['One', 1], ['Two', 2], ['Three', 3],
    ]);
    assert.deepEqual(getDashboard(new Date('2026-10-12T15:59:59.000Z')).today,
      { total_sales: 0.01, transaction_count: 1 });
    assert.deepEqual(getDashboard(new Date('2026-10-13T16:00:00.000Z')).today,
      { total_sales: 9.99, transaction_count: 1 });

    const app = express();
    app.use('/api/dashboard', require('../routes/dashboardRoutes'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dashboard`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.business_date, businessDayWindow().date);
    assert.equal(body.low_stock.count, 7);
    assert.equal(body.latest_sale.id, 4);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_PATH;
  }
});
