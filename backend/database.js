const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

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
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL CHECK (total_amount >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL CHECK (unit_price >= 0)
    );
  `);
  persistDatabase();
  return database;
}

function getDatabase() {
  if (!database) throw new Error('Database has not been initialized');
  return database;
}

module.exports = { getDatabase, initializeDatabase, persistDatabase, rowsFromResult };