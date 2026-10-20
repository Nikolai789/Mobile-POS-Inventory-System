const { AppError } = require('../utils/errors');
const { inTransaction } = require('../db/transaction');
const { getDatabase, persistDatabase, rowsFromResult } = require('../database');
const { DAY_MS, businessMidnight, isBusinessDate, toSqlTimestamp } = require('../utils/businessTime');


/** @param {unknown} value @param {string} label */
function toCents(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new AppError(`${label} must be a non-negative amount`);
  }
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(value - cents / 100) > 0.00000001) {
    throw new AppError(`${label} must have at most two decimal places`);
  }
  return cents;
}

/** @param {unknown} items @returns {Map<number, number>} */
function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one sale item is required');
  }
  const quantities = new Map();
  for (const item of items) {
    if (!item || !Number.isSafeInteger(item.product_id) || item.product_id <= 0
      || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError('Each item needs a valid product_id and positive integer quantity');
    }
    const quantity = (quantities.get(item.product_id) || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new AppError('Item quantity is too large');
    quantities.set(item.product_id, quantity);
  }
  return quantities;
}

/** @param {number} id @returns {import('../../shared/contracts').Receipt} */
function getSale(id) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Invalid sale ID');
  const database = getDatabase();
  /** @type {import('../../shared/contracts').SaleSummary[]} */
  const saleRows = rowsFromResult(database.exec(
    'SELECT id, total_amount, cash_received, change_amount, created_at FROM sales WHERE id = ?', [id],
  ));
  const sale = saleRows[0];
  if (!sale) throw new AppError('Sale not found', 404);
  /** @type {Omit<import('../../shared/contracts').ReceiptItem, 'line_total'>[]} */
  const itemRows = rowsFromResult(database.exec(`
    SELECT sale_items.product_id, COALESCE(sale_items.product_name, products.name) AS name,
      sale_items.quantity, sale_items.unit_price
    FROM sale_items LEFT JOIN products ON products.id = sale_items.product_id
    WHERE sale_items.sale_id = ? ORDER BY sale_items.id
  `, [id]));
  const items = itemRows.map((item) => ({
    ...item,
    line_total: Math.round(item.unit_price * 100) * item.quantity / 100,
  }));
  return { ...sale, items };
}

/** @param {{ date?: unknown; sort?: unknown }} [filters] @returns {import('../../shared/contracts').SaleSummary[]} */
function listSales({ date, sort = 'newest' } = {}) {
  if (date !== undefined && !isBusinessDate(date)) {
    throw new AppError('date must be a valid calendar date in YYYY-MM-DD format');
  }
  if (sort !== 'newest' && sort !== 'oldest') {
    throw new AppError('sort must be newest or oldest');
  }
  const direction = sort === 'oldest' ? 'ASC' : 'DESC';
  const params = date === undefined ? [] : [
    toSqlTimestamp(businessMidnight(date)),
    toSqlTimestamp(businessMidnight(date) + DAY_MS),
  ];
  return rowsFromResult(getDatabase().exec(`
    SELECT id, total_amount, cash_received, change_amount, created_at
    FROM sales
    ${date === undefined ? '' : 'WHERE created_at >= ? AND created_at < ?'}
    ORDER BY created_at ${direction}, id ${direction}
  `, params));
}

/** @param {Record<string, unknown>} [input] @returns {{ receipt: import('../../shared/contracts').Receipt; created: boolean }} */
function createSale(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('A sale request is required');
  }
  const { items, cash_received, expected_total, client_transaction_id } = input;
  if (typeof client_transaction_id !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(client_transaction_id)) {
    throw new AppError('A valid client transaction ID is required');
  }
  const quantities = parseItems(items);
  const cashCents = toCents(cash_received, 'cash_received');
  const expectedCents = toCents(expected_total, 'expected_total');
  const database = getDatabase();
  /** @type {Pick<import('../../shared/contracts').SaleSummary, 'id' | 'total_amount' | 'cash_received'>[]} */
  const priorRows = rowsFromResult(database.exec(
    'SELECT id, total_amount, cash_received FROM sales WHERE client_transaction_id = ?',
    [client_transaction_id],
  ));
  const prior = priorRows[0];
  if (prior) {
    const receipt = getSale(prior.id);
    const sameItems = receipt.items.length === quantities.size && receipt.items.every(
      (item) => quantities.get(item.product_id) === item.quantity,
    );
    if (!sameItems || Math.round(Number(prior.cash_received) * 100) !== cashCents
      || Math.round(prior.total_amount * 100) !== expectedCents) {
      throw new AppError('Transaction ID was already used for a different sale', 409);
    }
    return { receipt, created: false };
  }

  const saleId = inTransaction(database, () => {
    let totalCents = 0;
    const saleItems = [];
    for (const [productId, quantity] of quantities) {
      /** @type {Pick<import('../../shared/contracts').Product, 'id' | 'name' | 'price' | 'stock_quantity'>[]} */
      const productRows = rowsFromResult(database.exec(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND active = 1',
        [productId],
      ));
      const product = productRows[0];
      if (!product || product.stock_quantity < quantity) {
        throw new AppError(`Product ${productId} is unavailable or has insufficient stock`, 409);
      }
      const unitCents = Math.round(product.price * 100);
      totalCents += unitCents * quantity;
      if (!Number.isSafeInteger(totalCents)) throw new AppError('Sale total is too large');
      saleItems.push({ productId, name: product.name, quantity, unitCents });
    }
    if (totalCents !== expectedCents) {
      throw new AppError('Product prices changed. Refresh the cart and confirm the new total.', 409);
    }
    if (cashCents < totalCents) throw new AppError('Cash received is less than the sale total');

    database.run(`
      INSERT INTO sales (total_amount, cash_received, change_amount, client_transaction_id)
      VALUES (?, ?, ?, ?)
    `, [totalCents / 100, cashCents / 100, (cashCents - totalCents) / 100, client_transaction_id]);
    const saleId = Number(database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0]);
    for (const item of saleItems) {
      database.run(`
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `, [saleId, item.productId, item.name, item.quantity, item.unitCents / 100]);
      database.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId]);
    }
    return saleId;
  });
  persistDatabase();
  return { receipt: getSale(saleId), created: true };
}

module.exports = { createSale, getSale, listSales };
