const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { replaceNameTokens } = require('./services/productSearchTokens');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'pos.sqlite');
let database;

function persistDatabase() {
  const data = database.export();
  fs.writeFileSync(databasePath, Buffer.from(data));
}

function rowsFromResult(result) {
  if (!result.length) return [];
  return result[0].values.map((values) =>
    Object.fromEntries(values.map((value, index) => [result[0].columns[index], value])),
  );
}

function hasColumn(tableName, columnName) {
  return rowsFromResult(database.exec(`PRAGMA table_info(${tableName})`))
    .some((column) => column.name === columnName);
}

async function initializeDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file),
  });

  database = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();

  database.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      price REAL NOT NULL CHECK (price >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL CHECK (total_amount >= 0),
      cash_received REAL CHECK (cash_received >= 0),
      change_amount REAL CHECK (change_amount >= 0),
      client_transaction_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL CHECK (unit_price >= 0)
    );

    CREATE TABLE IF NOT EXISTS product_search_tokens (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      token TEXT NOT NULL COLLATE NOCASE,
      PRIMARY KEY (product_id, token)
    );

  `);
  if (!hasColumn('products', 'active')) {
    database.run('ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  }
  for (const [table, column, definition] of [
    ['sales', 'cash_received', 'REAL'],
    ['sales', 'change_amount', 'REAL'],
    ['sales', 'client_transaction_id', 'TEXT'],
    ['sale_items', 'product_name', 'TEXT'],
  ]) {
    if (!hasColumn(table, column)) database.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
  database.run(`
    UPDATE sale_items SET product_name = (
      SELECT name FROM products WHERE products.id = sale_items.product_id
    ) WHERE product_name IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS sales_client_transaction_id_idx
      ON sales(client_transaction_id);
    CREATE INDEX IF NOT EXISTS product_search_tokens_token_idx
      ON product_search_tokens(token, product_id);
    CREATE INDEX IF NOT EXISTS products_active_name_idx
      ON products(active, name COLLATE NOCASE, id);
    CREATE INDEX IF NOT EXISTS products_instock_name_idx
      ON products(name COLLATE NOCASE, id) WHERE active = 1 AND stock_quantity > 0;
    CREATE INDEX IF NOT EXISTS products_barcode_nocase_idx
      ON products(barcode COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS products_dashboard_low_stock_idx
      ON products(stock_quantity, name COLLATE NOCASE, id) WHERE active = 1;
    CREATE INDEX IF NOT EXISTS sales_dashboard_created_at_idx
      ON sales(created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS sale_items_product_id_idx
      ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS sale_items_sale_product_idx
      ON sale_items(sale_id, product_id);
  `);
  const missingTokens = rowsFromResult(database.exec(`
    SELECT p.id, p.name FROM products p
    WHERE NOT EXISTS (SELECT 1 FROM product_search_tokens t WHERE t.product_id = p.id)
  `));
  if (missingTokens.length) {
    database.run('BEGIN TRANSACTION');
    try {
      for (const product of missingTokens) replaceNameTokens(database, product.id, product.name);
      database.run('COMMIT');
    } catch (error) {
      database.run('ROLLBACK');
      throw error;
    }
  }
  persistDatabase();
  return database;
}

function getDatabase() {
  if (!database) throw new Error('Database has not been initialized');
  return database;
}

module.exports = { getDatabase, initializeDatabase, persistDatabase, rowsFromResult };
