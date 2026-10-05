import { getDatabase } from '../database/databaseService';

export async function createSale(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('A sale must contain at least one item.');
  }

  const database = await getDatabase();
  const saleItems = items.map(({ productId, quantity }) => ({
    productId,
    quantity,
  }));
  let saleId;
  let totalAmount = 0;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const products = [];

    for (const item of saleItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Sale quantities must be positive whole numbers.');
      }

      const product = await transaction.getFirstAsync(
        'SELECT id, price, stock_quantity FROM products WHERE id = ?',
        item.productId
      );

      if (!product) {
        throw new Error(`Product ${item.productId} was not found.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}.`);
      }

      totalAmount += product.price * item.quantity;
      products.push({ ...item, unitPrice: product.price });
    }

    const saleResult = await transaction.runAsync(
      'INSERT INTO sales (total_amount, created_at) VALUES (?, ?)',
      totalAmount,
      new Date().toISOString()
    );
    saleId = saleResult.lastInsertRowId;

    for (const item of products) {
      await transaction.runAsync(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        saleId,
        item.productId,
        item.quantity,
        item.unitPrice
      );
      await transaction.runAsync(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        item.quantity,
        item.productId
      );
    }
  });

  return getSaleById(saleId);
}

export async function getSaleById(saleId) {
  const database = await getDatabase();
  const sale = await database.getFirstAsync(
    'SELECT id, total_amount, created_at FROM sales WHERE id = ?',
    saleId
  );

  if (!sale) {
    return null;
  }

  const items = await database.getAllAsync(
    `SELECT sale_items.id, sale_items.product_id, products.name,
            sale_items.quantity, sale_items.unit_price
     FROM sale_items
     INNER JOIN products ON products.id = sale_items.product_id
     WHERE sale_items.sale_id = ?
     ORDER BY sale_items.id ASC`,
    saleId
  );

  return { ...sale, items };
}

export async function getSales() {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT id, total_amount, created_at FROM sales ORDER BY created_at DESC'
  );
}