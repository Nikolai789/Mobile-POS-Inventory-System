const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

test('exact barcode lookup, UPC aliases, restore, and receipt snapshots', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-barcode-test-'));
  process.env.DATABASE_PATH = path.join(tempDirectory, 'test.sqlite');
  let server;
  try {
    const { initializeDatabase } = require('../database');
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
    const input = { name: 'Rice', barcode: '012345678901', price: 50.25, stock_quantity: 5 };
    const created = await request('POST', '', input);
    assert.equal(created.status, 201);
    const id = created.body.id;
    assert.equal((await request('GET', '/by-barcode?value=012345678901')).body.id, id);
    assert.equal((await request('GET', '/by-barcode?value=0012345678901')).body.id, id);
    const ean = products.createProduct({ name: 'Sugar', barcode: '0987654321098', price: 20, stock_quantity: 1 });
    assert.equal((await request('GET', '/by-barcode?value=987654321098')).body.id, ean.id);
    assert.equal((await request('POST', '', { ...input, barcode: '987654321098' })).status, 409);
    assert.equal((await request('GET', '/by-barcode?value=12345678901')).status, 404);
    assert.equal((await request('GET', '/by-barcode?value=')).status, 400);
    assert.equal((await request('GET', '/by-barcode?value=missing')).status, 404);
    assert.equal((await request('POST', '', { ...input, barcode: '0012345678901' })).status, 409);
    assert.equal((await request('POST', '', { ...input, barcode: 'OTHER', price: '' })).status, 400);
    assert.equal((await request('POST', '', { ...input, barcode: 'OTHER', stock_quantity: '' })).status, 400);

    const sale = sales.createSale({
      client_transaction_id: 'ae505219-7eca-467d-8026-49ef3d348faa',
      items: [{ product_id: id, quantity: 1 }],
      cash_received: 60,
      expected_total: 50.25,
    }).receipt;
    assert.equal(sale.items[0].name, 'Rice');
    assert.equal((await request('DELETE', `/${id}`)).status, 204);
    assert.equal((await request('GET', '/by-barcode?value=0012345678901')).body.active, 0);
    assert.equal((await request('GET', '/search?q=rice')).body.items.length, 0);
    const restoreInput = { ...input, name: 'Premium Grain', stock_quantity: 10, price: 55 };
    assert.equal((await request('PATCH', `/${id}/restore`, { ...restoreInput, stock_quantity: '' })).status, 400);
    assert.equal((await request('PATCH', `/${id}/restore`, { ...restoreInput, barcode: '987654321098' })).status, 409);
    assert.equal((await request('GET', '/by-barcode?value=012345678901')).body.active, 0);
    const restored = await request('PATCH', `/${id}/restore`, restoreInput);
    assert.equal(restored.status, 200);
    assert.equal(restored.body.active, 1);
    assert.equal(restored.body.stock_quantity, 10);
    assert.equal((await request('GET', '/search?q=premium')).body.items[0].id, id);
    assert.equal((await request('GET', '/search?q=rice')).body.items.length, 0);
    assert.equal((await request('PATCH', `/${id}/restore`, restoreInput)).status, 409);
    assert.equal(sales.getSale(sale.id).items[0].name, 'Rice');
    assert.equal(sales.getSale(sale.id).items[0].unit_price, 50.25);

    const other = products.createProduct({ name: 'Tea', barcode: 'TEA', price: 10, stock_quantity: 2 });
    assert.equal((await request('PUT', `/${other.id}`, { ...other, barcode: '0012345678901' })).status, 409);
    assert.equal((await request('GET', '/by-barcode?value=TEA')).body.id, other.id);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_PATH;
  }
});
