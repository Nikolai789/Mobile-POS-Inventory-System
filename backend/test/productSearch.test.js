const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const initSqlJs = require('sql.js');
const express = require('express');

test('product search migrates, pages, filters, and follows product changes', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-search-test-'));
  process.env.DATABASE_PATH = path.join(tempDirectory, 'test.sqlite');
  let server;
  try {
    const SQL = await initSqlJs();
    const legacy = new SQL.Database();
    legacy.run(`
      CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, barcode TEXT, price REAL, stock_quantity INTEGER);
      CREATE TABLE sales (id INTEGER PRIMARY KEY, total_amount REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE sale_items (id INTEGER PRIMARY KEY, sale_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);
      INSERT INTO products VALUES (1, 'Whole Milk', 'MILK-001', 75, 4);
      INSERT INTO products VALUES (2, 'Almond Milk', 'AM-002', 95, 0);
      INSERT INTO products VALUES (3, 'Milkshake', 'MS-003', 120, 2);
    `);
    fs.writeFileSync(process.env.DATABASE_PATH, Buffer.from(legacy.export()));
    legacy.close();

    const { initializeDatabase, getDatabase, persistDatabase } = require('../database');
    const products = require('../services/productService');
    await initializeDatabase();
    const app = express();
    app.use(express.json());
    app.use('/api/products', require('../routes/productRoutes'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/products`;
    const get = async (pathName) => {
      const response = await fetch(`${base}${pathName}`);
      return { status: response.status, body: await response.json() };
    };

    assert.deepEqual((await get('/search?q=mi')).body.items.map((item) => item.id), [2, 3, 1]);
    assert.deepEqual((await get('/search?q=whole%20mi')).body.items.map((item) => item.id), [1]);
    assert.deepEqual((await get('/search?q=hole')).body.items, []);
    assert.deepEqual((await get('/search?q=milk-0')).body.items.map((item) => item.id), [1]);
    assert.deepEqual((await get('/search?q=MiLk&in_stock=1')).body.items.map((item) => item.id), [3, 1]);
    assert.equal((await get('/')).body.length, 3);
    assert.equal((await get('/search?limit=0')).status, 400);
    assert.equal((await get('/search?in_stock=yes')).status, 400);

    const renamed = products.updateProduct(1, { name: 'Oat Drink', barcode: 'OAT-001', price: 80, stock_quantity: 3 });
    assert.equal((await get('/search?q=whole')).body.items.length, 0);
    assert.deepEqual((await get('/search?q=drink')).body.items.map((item) => item.id), [1]);
    assert.deepEqual((await get('/search?q=oat-')).body.items.map((item) => item.id), [1]);
    assert.deepEqual((await get('/lookup?ids=1,2')).body.map((item) => item.id), [2, 1]);
    const fresh = products.createProduct({ name: 'Fresh Bread', barcode: 'BREAD', price: 40, stock_quantity: 8 });
    assert.deepEqual((await get('/search?q=bread')).body.items.map((item) => item.id), [fresh.id]);
    products.updateStock(fresh.id, 0);
    assert.equal((await get('/search?q=bread&in_stock=1')).body.items.length, 0);
    assert.equal((await get('/search?q=bread')).body.items.length, 1);
    products.archiveProduct(renamed.id);
    assert.equal((await get('/search?q=drink')).body.items.length, 0);
    assert.equal((await get('/lookup?ids=1,2')).body.length, 1);
    assert.deepEqual((await get('/search?q=drink&status=archived')).body.items.map((item) => item.id), [renamed.id]);
    assert.deepEqual((await get('/search?q=oat-&status=archived')).body.items.map((item) => item.id), [renamed.id]);
    assert.equal((await get('/search?status=archived&in_stock=1')).status, 400);
    assert.equal((await get('/search?status=deleted')).status, 400);
    products.archiveProduct(fresh.id);
    const archivedFirst = (await get('/search?status=archived&limit=1')).body;
    const archivedSecond = (await get(`/search?status=archived&limit=1&offset=${archivedFirst.next_offset}`)).body;
    assert.deepEqual([archivedFirst.items.length, archivedSecond.items.length, archivedSecond.next_offset], [1, 1, null]);
    assert.deepEqual(new Set([archivedFirst.items[0].id, archivedSecond.items[0].id]),
      new Set([renamed.id, fresh.id]));
    products.restoreProduct(renamed.id, { ...renamed, stock_quantity: 7 });
    assert.deepEqual((await get('/search?q=drink')).body.items.map((item) => item.id), [renamed.id]);
    assert.equal((await get('/search?q=drink&status=archived')).body.items.length, 0);
    products.archiveProduct(renamed.id);
    getDatabase().run('DELETE FROM product_search_tokens WHERE product_id = ?', [renamed.id]);
    persistDatabase();
    await initializeDatabase();
    assert.deepEqual((await get('/search?q=drink&status=archived')).body.items.map((item) => item.id), [renamed.id]);
    assert.equal((await get('/lookup?ids=1,abc')).status, 400);

    getDatabase().run('BEGIN TRANSACTION');
    for (let number = 0; number < 65; number += 1) {
      getDatabase().run('INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, 1, 1)',
        [`Paged Item ${String(number).padStart(2, '0')}`, `PAGE-${number}`]);
    }
    getDatabase().run('COMMIT');
    persistDatabase();
    await initializeDatabase();
    const first = (await get('/search?q=paged&limit=30')).body;
    const second = (await get(`/search?q=paged&limit=30&offset=${first.next_offset}`)).body;
    const third = (await get(`/search?q=paged&limit=30&offset=${second.next_offset}`)).body;
    assert.deepEqual([first.items.length, second.items.length, third.items.length], [30, 30, 5]);
    assert.equal(third.next_offset, null);
    assert.equal(new Set([...first.items, ...second.items, ...third.items].map((item) => item.id)).size, 65);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_PATH;
  }
});
