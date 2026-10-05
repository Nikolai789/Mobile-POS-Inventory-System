const { getDatabase, persistDatabase, rowsFromResult } = require('../database');

const productFields = 'id, name, barcode, price, stock_quantity';

function productRows(query, params = []) {
  return rowsFromResult(getDatabase().exec(query, params));
}

function validateProduct(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const barcode = typeof input.barcode === 'string' ? input.barcode.trim() : '';
  const price = Number(input.price);
  const stockQuantity = Number(input.stock_quantity);
  if (!name || !barcode || !Number.isFinite(price) || price < 0
    || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    const error = new Error('name, barcode, non-negative price, and stock_quantity are required');
    error.statusCode = 400;
    throw error;
  }
  return { name, barcode, price, stockQuantity };
}

function getProduct(id, includeInactive = false) {
  const activeFilter = includeInactive ? '' : ' AND active = 1';
  return productRows(`SELECT ${productFields} FROM products WHERE id = ?${activeFilter}`, [id])[0];
}

function listProducts() {
  return productRows(`SELECT ${productFields} FROM products WHERE active = 1 ORDER BY name`);
}

function createProduct(input) {
  const product = validateProduct(input);
  const database = getDatabase();
  try {
    database.run(
      'INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, ?, ?)',
      [product.name, product.barcode, product.price, product.stockQuantity],
    );
  } catch (error) {
    error.statusCode = error.message.includes('UNIQUE') ? 409 : 400;
    throw error;
  }
  const productId = database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
  persistDatabase();
  return getProduct(productId);
}

function updateProduct(id, input) {
  const product = validateProduct(input);
  const database = getDatabase();
  if (!getProduct(id)) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  try {
    database.run(
      'UPDATE products SET name = ?, barcode = ?, price = ?, stock_quantity = ? WHERE id = ? AND active = 1',
      [product.name, product.barcode, product.price, product.stockQuantity, id],
    );
  } catch (error) {
    error.statusCode = error.message.includes('UNIQUE') ? 409 : 400;
    throw error;
  }
  persistDatabase();
  return getProduct(id);
}

function updateStock(id, stockQuantity) {
  const existingProduct = getProduct(id);
  if (!existingProduct) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return updateProduct(id, { ...existingProduct, stock_quantity: stockQuantity });
}

function archiveProduct(id) {
  const database = getDatabase();
  database.run('UPDATE products SET active = 0 WHERE id = ? AND active = 1', [id]);
  if (database.getRowsModified() === 0) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  persistDatabase();
}

module.exports = { archiveProduct, createProduct, listProducts, updateProduct, updateStock };