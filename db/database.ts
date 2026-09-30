import type { SQLiteDatabase } from "expo-sqlite";

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        price REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0
      );
    `);
    currentVersion = 1;
  }

  if (currentVersion !== DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}

export async function getProducts(db: SQLiteDatabase) {
  return db.getAllAsync<Product>(
    "SELECT id, name, sku, price, stock FROM products ORDER BY name COLLATE NOCASE",
  );
}

export async function addProduct(
  db: SQLiteDatabase,
  product: Omit<Product, "id">,
) {
  await db.runAsync(
    "INSERT INTO products (name, sku, price, stock) VALUES (?, ?, ?, ?)",
    product.name,
    product.sku,
    product.price,
    product.stock,
  );
}

export async function updateProduct(db: SQLiteDatabase, product: Product) {
  await db.runAsync(
    "UPDATE products SET name = ?, sku = ?, price = ?, stock = ? WHERE id = ?",
    product.name,
    product.sku,
    product.price,
    product.stock,
    product.id,
  );
}

export async function deleteProduct(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM products WHERE id = ?", id);
}
