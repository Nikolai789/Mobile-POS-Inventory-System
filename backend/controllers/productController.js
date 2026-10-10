const productService = require('../services/productService');

function handleError(error, res) {
  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Unable to complete product request',
  });
}

function listProducts(req, res) {
  try { return res.json(productService.listProducts()); } catch (error) { return handleError(error, res); }
}

function searchProducts(req, res) {
  try { return res.json(productService.searchProducts(req.query)); } catch (error) { return handleError(error, res); }
}

function lookupProducts(req, res) {
  try { return res.json(productService.lookupProducts(req.query.ids)); } catch (error) { return handleError(error, res); }
}

function getProductByBarcode(req, res) {
  try { return res.json(productService.getProductByBarcode(req.query.value)); } catch (error) { return handleError(error, res); }
}

function restoreProduct(req, res) {
  try { return res.json(productService.restoreProduct(Number(req.params.id), req.body)); } catch (error) { return handleError(error, res); }
}

function createProduct(req, res) {
  try { return res.status(201).json(productService.createProduct(req.body)); } catch (error) { return handleError(error, res); }
}

function updateProduct(req, res) {
  try { return res.json(productService.updateProduct(Number(req.params.id), req.body)); } catch (error) { return handleError(error, res); }
}

function updateStock(req, res) {
  try {
    return res.json(productService.updateStock(Number(req.params.id), Number(req.body.stock_quantity)));
  } catch (error) { return handleError(error, res); }
}

function archiveProduct(req, res) {
  try { productService.archiveProduct(Number(req.params.id)); return res.status(204).send(); } catch (error) { return handleError(error, res); }
}

module.exports = {
  archiveProduct, createProduct, getProductByBarcode, listProducts, lookupProducts,
  restoreProduct, searchProducts, updateProduct, updateStock,
};
