import { getDatabase } from '../database/databaseService';

export async function getProducts() {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT id, name, barcode, price, stock_quantity FROM products ORDER BY name ASC'
  );
}

export async function getProductById(productId) {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT id, name, barcode, price, stock_quantity FROM products WHERE id = ?',
    productId
  );
}

export async function getProductByBarcode(barcode) {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT id, name, barcode, price, stock_quantity FROM products WHERE barcode = ?',
    barcode
  );
}

export async function createProduct({ name, barcode, price, stockQuantity }) {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, ?, ?)',
    name,
    barcode,
    price,
    stockQuantity
  );

  return getProductById(result.lastInsertRowId);
}

export async function updateProduct(productId, { name, barcode, price, stockQuantity }) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE products SET name = ?, barcode = ?, price = ?, stock_quantity = ? WHERE id = ?',
    name,
    barcode,
    price,
    stockQuantity,
    productId
  );

  return getProductById(productId);
}

export async function deleteProduct(productId) {
  const database = await getDatabase();
  const result = await database.runAsync('DELETE FROM products WHERE id = ?', productId);
  return result.changes > 0;
}