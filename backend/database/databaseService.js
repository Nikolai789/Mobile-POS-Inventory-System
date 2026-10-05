import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'pos.db';

let databasePromise;

async function initializeDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  return database;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
}