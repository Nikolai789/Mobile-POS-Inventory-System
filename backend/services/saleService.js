const { getDatabase, persistDatabase, rowsFromResult } = require('../database');

function createSale(items) {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error('At least one sale item is required');
    error.statusCode = 400;
    throw error;
  }

  const database = getDatabase();
  try {
    database.run('BEGIN TRANSACTION');
    const requestedQuantities = new Map();
    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Each item needs a valid product_id and positive integer quantity');
      }
      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
    }

    let totalAmount = 0;
    const saleItems = [];
    for (const [productId, quantity] of requestedQuantities) {
      const product = rowsFromResult(database.exec(
        'SELECT id, price, stock_quantity FROM products WHERE id = ? AND active = 1', [productId],
      ))[0];
      if (!product) throw new Error(`Product ${productId} not found`);
      if (product.stock_quantity < quantity) throw new Error(`Insufficient stock for product ${productId}`);
      totalAmount += product.price * quantity;
      saleItems.push({ productId, quantity, unitPrice: product.price });
    }

    database.run('INSERT INTO sales (total_amount) VALUES (?)', [totalAmount]);
    const saleId = database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    for (const item of saleItems) {
      database.run(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [saleId, item.productId, item.quantity, item.unitPrice],
      );
      database.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.productId]);
    }
    database.run('COMMIT');
    persistDatabase();
    return { id: saleId, total_amount: totalAmount, items: saleItems };
  } catch (error) {
    database.run('ROLLBACK');
    error.statusCode = 400;
    throw error;
  }
}

module.exports = { createSale };