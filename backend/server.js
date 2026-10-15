const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);

initializeDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => {
    console.log(`POS API listening on http://0.0.0.0:${port}`);
  }))
  .catch((error) => {
    console.error('Unable to initialize database', error);
    process.exitCode = 1;
  });

module.exports = app;
