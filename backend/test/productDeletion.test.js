const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

test('permanent deletion is limited to archived products with no sales', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-delete-test-'));
  process.env.DATABASE_PATH = path.join(tempDirectory, 'test.sqlite');
  let server;
  try {
    const { getDatabase, initializeDatabase, rowsFromResult } = require('../database');
    const products = require('../services/productService');
    const sales = require('../services/saleService');
    await initializeDatabase();

    const app = express();
    app.use(express.json());
    app.use('/api/products', require('../routes/productRoutes'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/products`;
    const request = async (method, suffix, body) => {
      const response = await fetch(`${base}${suffix}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body == null ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json().catch(() => ({})) };
    };

    const unused = products.createProduct({ name: 'Unused Item', barcode: 'UNUSED', price: 12, stock_quantity: 2 });
    const sold = products.createProduct({ name: 'Sold Item', barcode: 'SOLD', price: 20, stock_quantity: 3 });
    assert.equal((await request('DELETE', `/${unused.id}/permanent`)).status, 409);
    const receipt = sales.createSale({
      client_transaction_id: '6e58929d-5905-47c0-8f1a-dedb6f477bbf',
      items: [{ product_id: sold.id, quantity: 1 }],
      cash_received: 20,
      expected_total: 20,
    }).receipt;
    products.archiveProduct(unused.id);
    products.archiveProduct(sold.id);

    const archived = (await request('GET', '/search?status=archived')).body.items;
    assert.equal(archived.find((product) => product.id === unused.id).can_delete, 1);
    assert.equal(archived.find((product) => product.id === sold.id).can_delete, 0);
    const blocked = await request('DELETE', `/${sold.id}/permanent`);
    assert.equal(blocked.status, 409);
    assert.match(blocked.body.error, /past sales/);
    assert.equal((await request('GET', '/by-barcode?value=SOLD')).body.id, sold.id);
    assert.deepEqual(sales.getSale(receipt.id), receipt);

    assert.equal((await request('DELETE', `/${unused.id}/permanent`)).status, 204);
    assert.equal((await request('GET', '/search?q=unused&status=archived')).body.items.length, 0);
    assert.equal((await request('GET', '/by-barcode?value=UNUSED')).status, 404);
    assert.equal(rowsFromResult(getDatabase().exec(
      'SELECT token FROM product_search_tokens WHERE product_id = ?', [unused.id],
    )).length, 0);
    assert.equal((await request('POST', '', {
      name: 'Replacement Item', barcode: 'UNUSED', price: 13, stock_quantity: 1,
    })).status, 201);
    assert.equal((await request('DELETE', `/${unused.id}/permanent`)).status, 404);
    assert.equal((await request('DELETE', '/-1/permanent')).status, 400);
    assert.deepEqual(sales.getSale(receipt.id), receipt);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_PATH;
  }
});
