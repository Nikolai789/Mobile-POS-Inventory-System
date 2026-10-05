const saleService = require('../services/saleService');

function createSale(req, res) {
  try { return res.status(201).json(saleService.createSale(req.body.items)); } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { createSale };