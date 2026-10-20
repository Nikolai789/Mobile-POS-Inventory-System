const { sendError } = require('../utils/errors');
const productService = require('../services/productService');


/** @param {import('express').Request} req @param {import('express').Response} res */
function listProducts(req, res) {
  try { return res.json(productService.listProducts()); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function searchProducts(req, res) {
  try { return res.json(productService.searchProducts(req.query)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function lookupProducts(req, res) {
  try { return res.json(productService.lookupProducts(req.query.ids)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function getProductByBarcode(req, res) {
  try { return res.json(productService.getProductByBarcode(req.query.value)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function restoreProduct(req, res) {
  try { return res.json(productService.restoreProduct(Number(req.params.id), req.body)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function createProduct(req, res) {
  try { return res.status(201).json(productService.createProduct(req.body)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function updateProduct(req, res) {
  try { return res.json(productService.updateProduct(Number(req.params.id), req.body)); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function updateStock(req, res) {
  try {
    return res.json(productService.updateStock(Number(req.params.id), Number(req.body.stock_quantity)));
  } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function archiveProduct(req, res) {
  try { productService.archiveProduct(Number(req.params.id)); return res.status(204).send(); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function deleteArchivedProduct(req, res) {
  try { productService.deleteArchivedProduct(Number(req.params.id)); return res.status(204).send(); } catch (error) { return sendError(error, res, 'Unable to complete product request'); }
}

module.exports = {
  archiveProduct, createProduct, deleteArchivedProduct, getProductByBarcode, listProducts, lookupProducts,
  restoreProduct, searchProducts, updateProduct, updateStock,
};
