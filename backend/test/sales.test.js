const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const initSqlJs = require('sql.js');
const express = require('express');

test('cash sale API preserves receipts, stock, retries, and legacy data', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-sales-test-'));
  process.env.DATABASE_PATH = path.join(tempDirectory, 'test.sqlite');
  let server;
  try {
    const SQL = await initSqlJs();
    const legacyDatabase = new SQL.Database();
    legacyDatabase.run(`
      CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, barcode TEXT, price REAL, stock_quantity INTEGER, active INTEGER DEFAULT 1);
      CREATE TABLE sales (id INTEGER PRIMARY KEY, total_amount REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE sale_items (id INTEGER PRIMARY KEY, sale_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);
      INSERT INTO products VALUES (1, 'Old Name', 'OLD', 2.5, 1, 1);
      INSERT INTO sales (id, total_amount) VALUES (1, 2.5);
      INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price) VALUES (1, 1, 1, 1, 2.5);
    `);
    fs.writeFileSync(process.env.DATABASE_PATH, Buffer.from(legacyDatabase.export()));
    legacyDatabase.close();

    const { initializeDatabase } = require('../database');
    const products = require('../services/productService');
    const sales = require('../services/saleService');
    await initializeDatabase();
    assert.equal(sales.getSale(1).items[0].name, 'Old Name');
    assert.equal(sales.getSale(1).cash_received, null);

    const coffee = products.createProduct({ name: 'Coffee', barcode: 'COFFEE', price: 1.25, stock_quantity: 5 });
    const tea = products.createProduct({ name: 'Tea', barcode: 'TEA', price: 2.1, stock_quantity: 2 });
    assert.ok(coffee, JSON.stringify(products.listProducts()));
    assert.ok(tea, JSON.stringify(products.listProducts()));
    const app = express();
    app.use(express.json());
    app.use('/api/sales', require('../routes/saleRoutes'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/sales`;
    const request = async (method, suffix = '', body) => {
      const response = await fetch(`${baseUrl}${suffix}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, body: await response.json() };
    };
    const payload = {
      client_transaction_id: 'df394239-a426-4265-9f13-aae049400001',
      items: [{ product_id: coffee.id, quantity: 2 }, { product_id: tea.id, quantity: 1 }],
      expected_total: 4.6,
      cash_received: 5,
    };
    const created = await request('POST', '', payload);
    assert.equal(created.status, 201);
    assert.equal(created.body.total_amount, 4.6);
    assert.equal(created.body.cash_received, 5);
    assert.equal(created.body.change_amount, 0.4);
    assert.deepEqual(created.body.items.map((item) => [item.name, item.quantity, item.unit_price, item.line_total]), [
      ['Coffee', 2, 1.25, 2.5], ['Tea', 1, 2.1, 2.1],
    ]);
    assert.equal(products.listProducts().find((item) => item.id === coffee.id).stock_quantity, 3);
    assert.equal(products.listProducts().find((item) => item.id === tea.id).stock_quantity, 1);

    const retry = await request('POST', '', payload);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.id, created.body.id);
    assert.equal(products.listProducts().find((item) => item.id === coffee.id).stock_quantity, 3);
    assert.equal((await request('POST', '', { ...payload, cash_received: 10 })).status, 409);
    assert.equal((await request('POST', '', {
      ...payload, client_transaction_id: 'df394239-a426-4265-9f13-aae049400002',
      items: [{ product_id: coffee.id, quantity: 0 }],
    })).status, 400);
    assert.equal((await request('POST', '', {
      ...payload, client_transaction_id: 'df394239-a426-4265-9f13-aae049400003', cash_received: 4,
    })).status, 400);
    assert.equal((await request('POST', '', {
      ...payload, client_transaction_id: 'df394239-a426-4265-9f13-aae049400006', cash_received: 5.001,
    })).status, 400);
    assert.equal((await request('POST', '', {
      ...payload, client_transaction_id: 'df394239-a426-4265-9f13-aae049400004',
      items: [{ product_id: tea.id, quantity: 2 }], expected_total: 4.2,
    })).status, 409);

    products.updateProduct(coffee.id, { ...coffee, name: 'Renamed Coffee', price: 1.5, stock_quantity: 3 });
    assert.equal((await request('POST', '', {
      ...payload, client_transaction_id: 'df394239-a426-4265-9f13-aae049400005',
      items: [{ product_id: coffee.id, quantity: 1 }], expected_total: 1.25,
    })).status, 409);
    products.archiveProduct(coffee.id);
    const history = await request('GET');
    assert.equal(history.status, 200);
    assert.equal(history.body[0].id, created.body.id);
    const detail = await request('GET', `/${created.body.id}`);
    assert.equal(detail.body.items[0].name, 'Coffee');
    assert.equal((await request('GET', '/999999')).status, 404);
    assert.equal(sales.getSale(1).items[0].name, 'Old Name');
    await initializeDatabase();
    assert.equal(sales.getSale(created.body.id).items[0].name, 'Coffee');
    assert.equal((await request('POST', '', payload)).body.id, created.body.id);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_PATH;
  }
});
