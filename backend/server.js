const express = require('express');
const cors = require('cors');
const {
  getDatabase,
  initializeDatabase,
  persistDatabase,
  rowsFromResult,
} = require('./database');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/products', (req, res) => {
  const products = rowsFromResult(getDatabase().exec(
    'SELECT id, name, barcode, price, stock_quantity FROM products ORDER BY name',
  ));
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, barcode, price, stock_quantity: stockQuantity } = req.body;
  const numericPrice = Number(price);
  const numericStock = Number(stockQuantity);
  if (!name || !barcode || !Number.isFinite(numericPrice) || numericPrice < 0
    || !Number.isInteger(numericStock) || numericStock < 0) {
    return res.status(400).json({ error: 'name, barcode, non-negative price, and stock_quantity are required' });
  }

  try {
    const database = getDatabase();
    database.run(
      'INSERT INTO products (name, barcode, price, stock_quantity) VALUES (?, ?, ?, ?)',
      [name.trim(), barcode.trim(), numericPrice, numericStock],
    );
    persistDatabase();
    const productId = database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    return res.status(201).json(rowsFromResult(database.exec(
      'SELECT id, name, barcode, price, stock_quantity FROM products WHERE id = ?', [productId],
    ))[0]);
  } catch (error) {
    return res.status(409).json({ error: 'A product with that barcode already exists' });
  }
});

app.patch('/api/products/:id/stock', (req, res) => {
  const stockQuantity = Number(req.body.stock_quantity);
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ error: 'stock_quantity must be a non-negative integer' });
  }

  const database = getDatabase();
  database.run('UPDATE products SET stock_quantity = ? WHERE id = ?', [stockQuantity, productId]);
  if (database.getRowsModified() === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }
  persistDatabase();
  return res.json(rowsFromResult(database.exec(
    'SELECT id, name, barcode, price, stock_quantity FROM products WHERE id = ?',
    [productId],
  ))[0]);
});

app.post('/api/sales', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'At least one sale item is required' });

  const database = getDatabase();
  try {
    database.run('BEGIN TRANSACTION');
    let totalAmount = 0;
    const saleItems = [];
    const requestedQuantities = new Map();

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Each item needs a valid product_id and positive integer quantity');
      }

      requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
    }

    for (const [productId, quantity] of requestedQuantities) {
      const productRows = rowsFromResult(database.exec(
        'SELECT id, price, stock_quantity FROM products WHERE id = ?', [productId],
      ));
      const product = productRows[0];
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
      database.run(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId],
      );
    }
    database.run('COMMIT');
    persistDatabase();
    return res.status(201).json({ id: saleId, total_amount: totalAmount, items: saleItems });
  } catch (error) {
    database.run('ROLLBACK');
    return res.status(400).json({ error: error.message });
  }
});

initializeDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => {
    console.log(`POS API listewwwning on http://0.0.0.0:${port}`);
    console.log('working?');  
}))
  .catch((error) => {
    console.error('Unable to initialize database', error);
    process.exitCode = 1;
  });

module.exports = app;