const { test, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-history-test-'));
const testDatabasePath = path.join(tempDirectory, 'test.sqlite');
const previousDatabasePath = process.env.DATABASE_PATH;
process.env.DATABASE_PATH = testDatabasePath;
const { initializeDatabase, getDatabase, rowsFromResult } = require('../database');
const { listSales } = require('../services/saleService');
const { DAY_MS, businessMidnight, toSqlTimestamp } = require('../utils/businessTime');
let database;

beforeEach(async () => {
  await initializeDatabase();
  database = getDatabase();
});

afterEach(() => {
  database?.close();
  database = null;
  fs.rmSync(testDatabasePath, { force: true });
});

after(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
  if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousDatabasePath;
});

function addSale(createdAt) {
  database.run(`
    INSERT INTO sales (total_amount, cash_received, change_amount, created_at)
    VALUES (3.5, 5, 1.5, ?)
  `, [createdAt]);
  return rowsFromResult(database.exec('SELECT last_insert_rowid() AS id'))[0].id;
}

test('unfiltered history preserves its array shape and defaults to newest with deterministic ties', () => {
  const first = addSale('2026-10-18 04:00:00');
  const second = addSale('2026-10-19 04:00:00');
  const third = addSale('2026-10-19 04:00:00');
  assert.deepEqual(listSales().map((sale) => sale.id), [third, second, first]);
  assert.deepEqual(listSales({ sort: 'newest' }), listSales());
  assert.deepEqual(listSales({ sort: 'oldest' }).map((sale) => sale.id), [first, second, third]);
  assert.deepEqual(listSales()[0], {
    id: third, total_amount: 3.5, cash_received: 5, change_amount: 1.5,
    created_at: '2026-10-19 04:00:00',
  });
});

test('a selected day includes Philippine midnight and excludes the next midnight across calendar boundaries', () => {
  for (const date of ['2026-01-01', '2026-05-01', '2028-02-29']) {
    database.run('DELETE FROM sales');
    const midnight = businessMidnight(date);
    addSale(toSqlTimestamp(midnight - 1000));
    const first = addSale(toSqlTimestamp(midnight));
    const middle = addSale(toSqlTimestamp(midnight + DAY_MS / 2));
    const last = addSale(toSqlTimestamp(midnight + DAY_MS - 1000));
    addSale(toSqlTimestamp(midnight + DAY_MS));
    assert.deepEqual(listSales({ date }).map((sale) => sale.id), [last, middle, first], date);
    assert.deepEqual(listSales({ date, sort: 'oldest' }).map((sale) => sale.id), [first, middle, last], date);
  }
});

test('dates without receipts return an empty array and clearing the date retains sort order', () => {
  const first = addSale('2026-10-18 00:00:00');
  const second = addSale('2026-10-20 00:00:00');
  assert.deepEqual(listSales({ date: '2026-10-19' }), []);
  assert.deepEqual(listSales({ date: '2026-10-18', sort: 'oldest' }).map((sale) => sale.id), [first]);
  assert.deepEqual(listSales({ sort: 'oldest' }).map((sale) => sale.id), [first, second]);
  assert.deepEqual(listSales({ date: '0001-01-01' }), []);
  assert.deepEqual(listSales({ date: '9999-12-31' }), []);
});

test('service validation rejects malformed dates, impossible days, and unsupported sort values', () => {
  for (const date of [
    '', null, [], {}, 20261020, '2026-2-01', '2026-02-29', '2028-02-30', '2026-04-31',
    '2026-00-10', '2026-13-01', '2026-05-00', '0000-01-01', ' 2026-10-20',
    '2026-10-20T00:00:00Z', "2026-10-20' OR 1=1 --",
  ]) {
    assert.throws(() => listSales({ date }), { statusCode: 400 }, JSON.stringify(date));
  }
  for (const sort of ['', null, [], {}, 'ascending', 'DESC', 'newest; DROP TABLE sales']) {
    assert.throws(() => listSales({ sort }), { statusCode: 400 }, JSON.stringify(sort));
  }
});

test('history endpoint supports optional filters, rejects repeated parameters, and preserves receipt detail', async () => {
  const first = addSale('2028-02-28 16:00:00');
  const second = addSale('2028-02-29 15:59:59');
  const nextDay = addSale('2028-02-29 16:00:00');
  const app = express();
  app.use('/api/sales', require('../routes/saleRoutes'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/sales`;
    const unfiltered = await fetch(base);
    assert.equal(unfiltered.status, 200);
    assert.deepEqual((await unfiltered.json()).map((sale) => sale.id), [nextDay, second, first]);
    for (const [sort, expected] of [['oldest', [first, second]], ['newest', [second, first]]]) {
      const response = await fetch(`${base}?date=2028-02-29&sort=${sort}`);
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).map((sale) => sale.id), expected);
    }
    for (const query of [
      'date=', 'date=2026-02-29', 'date=2028-02-29&date=2028-03-01', 'date[value]=2028-02-29',
      'sort=', 'sort=ascending', 'sort=newest&sort=oldest', 'sort[value]=newest',
    ]) {
      const response = await fetch(`${base}?${query}`);
      assert.equal(response.status, 400, query);
      assert.equal(typeof (await response.json()).error, 'string');
    }
    const detail = await fetch(`${base}/${first}`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).id, first);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
