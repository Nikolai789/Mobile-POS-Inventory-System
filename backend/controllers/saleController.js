const saleService = require('../services/saleService');

function handleError(error, res) {
  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Unable to complete sale request',
  });
}

function createSale(req, res) {
  try {
    const { receipt, created } = saleService.createSale(req.body);
    return res.status(created ? 201 : 200).json(receipt);
  } catch (error) { return handleError(error, res); }
}

function listSales(req, res) {
  try { return res.json(saleService.listSales(req.query)); } catch (error) { return handleError(error, res); }
}

function getSale(req, res) {
  try { return res.json(saleService.getSale(Number(req.params.id))); } catch (error) {
    return handleError(error, res);
  }
}

module.exports = { createSale, getSale, listSales };
