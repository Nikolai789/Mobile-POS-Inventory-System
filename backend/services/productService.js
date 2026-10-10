const { getDatabase, persistDatabase, rowsFromResult } = require('../database');
const { nameTokens, replaceNameTokens } = require('./productSearchTokens');

const productFields = 'id, name, barcode, price, stock_quantity';

function productRows(query, params = []) {
  return rowsFromResult(getDatabase().exec(query, params));
}

function productError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function inTransaction(database, operation) {
  database.run('BEGIN TRANSACTION');
  try {
    const result = operation();
    database.run('COMMIT');
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
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

function searchProducts(input = {}) {
  const q = typeof input.q === 'string' ? input.q.trim() : '';
  const limit = input.limit == null ? 30 : Number(input.limit);
  const offset = input.offset == null ? 0 : Number(input.offset);
  const inStock = input.in_stock == null ? '0' : input.in_stock;
  if (q.length > 120 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50
    || !Number.isSafeInteger(offset) || offset < 0 || !['0', '1'].includes(inStock)) {
    throw productError('Invalid product search parameters');
  }

  const conditions = ['p.active = 1'];
  const params = [];
  let from = inStock === '1' && !q
    ? 'products p INDEXED BY products_instock_name_idx' : 'products p';
  if (inStock === '1') conditions.push('p.stock_quantity > 0');
  if (q) {
    const terms = nameTokens(q);
    const nameCandidates = terms.length ? `
      SELECT product_id AS id FROM product_search_tokens WHERE token LIKE ?
      ${terms.slice(1).map(() => `AND product_id IN (
        SELECT product_id FROM product_search_tokens WHERE token LIKE ?
      )`).join(' ')}
      UNION
    ` : '';
    // CROSS JOIN keeps indexed matches ahead of the product lookup in SQLite's plan.
    from = `(${nameCandidates}
      SELECT id FROM products WHERE barcode LIKE ? ESCAPE '!'
    ) matches CROSS JOIN products p ON p.id = matches.id`;
    params.push(...terms.map((term) => `${term}%`));
    params.push(`${q.replace(/[!%_]/g, (character) => `!${character}`)}%`);
  }
  const rows = productRows(`
    SELECT ${productFields.split(', ').map((field) => `p.${field}`).join(', ')}
    FROM ${from} WHERE ${conditions.join(' AND ')}
    ORDER BY p.name COLLATE NOCASE, p.id LIMIT ? OFFSET ?
  `, [...params, limit + 1, offset]);
  return {
    items: rows.slice(0, limit),
    next_offset: rows.length > limit ? offset + limit : null,
  };
}

function lookupProducts(idsInput) {
  if (typeof idsInput !== 'string' || !idsInput.trim()) return [];
  const ids = [...new Set(idsInput.split(',').map((id) => Number(id)))];
  if (ids.length > 100 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw productError('Invalid product IDs');
  }
  return productRows(`
    SELECT ${productFields} FROM products WHERE active = 1
      AND id IN (${ids.map(() => '?').join(', ')}) ORDER BY name COLLATE NOCASE, id
  `, ids);
}

function createProduct(input) {
  const product = validateProduct(input);
  const database = getDatabase();
  let productId;
  try {
    productId = inTransaction(database, () => {
      database.run(
        'INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, ?, ?)',
        [product.name, product.barcode, product.price, product.stockQuantity],
      );
      const id = database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
      replaceNameTokens(database, id, product.name);
      return id;
    });
  } catch (error) {
    error.statusCode = error.message.includes('UNIQUE') ? 409 : 400;
    throw error;
  }
  persistDatabase();
  return getProduct(productId);
}

function updateProduct(id, input) {
  const product = validateProduct(input);
  const database = getDatabase();
  const existing = getProduct(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  try {
    inTransaction(database, () => {
      database.run(
        'UPDATE products SET name = ?, barcode = ?, price = ?, stock_quantity = ? WHERE id = ? AND active = 1',
        [product.name, product.barcode, product.price, product.stockQuantity, id],
      );
      if (existing.name !== product.name) replaceNameTokens(database, id, product.name);
    });
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
  inTransaction(database, () => {
    database.run('UPDATE products SET active = 0 WHERE id = ? AND active = 1', [id]);
    if (database.getRowsModified() === 0) throw productError('Product not found', 404);
    database.run('DELETE FROM product_search_tokens WHERE product_id = ?', [id]);
  });
  persistDatabase();
}

module.exports = {
  archiveProduct, createProduct, listProducts, lookupProducts, searchProducts, updateProduct, updateStock,
};
