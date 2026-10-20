const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('importing the server neither starts a listener nor creates a database', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-import-'));
  const databasePath = path.join(directory, 'untouched.sqlite');
  try {
    const result = spawnSync(process.execPath, ['-e', "const app = require('./server'); if (typeof app.listen !== 'function') process.exit(1);"], {
      cwd: path.join(__dirname, '..'), env: { ...process.env, DATABASE_PATH: databasePath }, timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr.toString());
    assert.equal(fs.existsSync(databasePath), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('the application mounts health, product, sale, dashboard and analytics routes', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-app-'));
  const previousPath = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = path.join(directory, 'test.sqlite');
  const { initializeDatabase, getDatabase } = require('../database');
  const { createApp } = require('../app');
  let server;
  try {
    await initializeDatabase();
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    for (const endpoint of ['/health', '/products/search', '/sales', '/dashboard', '/analytics']) {
      const response = await fetch(`${base}${endpoint}`);
      assert.equal(response.status, 200, endpoint);
      await response.json();
    }
    const missing = await fetch(`${base}/sales/999999`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'Sale not found' });
    getDatabase().run('DROP TABLE sales');
    const failed = await fetch(`${base}/analytics`);
    assert.equal(failed.status, 500);
    assert.deepEqual(await failed.json(), { error: 'Unable to load analytics' });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    getDatabase().close();
    fs.rmSync(directory, { recursive: true, force: true });
    if (previousPath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previousPath;
  }
});
