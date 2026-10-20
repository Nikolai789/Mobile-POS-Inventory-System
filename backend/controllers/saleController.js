const { sendError } = require('../utils/errors');
const saleService = require('../services/saleService');


/** @param {import('express').Request} req @param {import('express').Response} res */
function createSale(req, res) {
  try {
    const { receipt, created } = saleService.createSale(req.body);
    return res.status(created ? 201 : 200).json(receipt);
  } catch (error) { return sendError(error, res, 'Unable to complete sale request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function listSales(req, res) {
  try { return res.json(saleService.listSales(req.query)); } catch (error) { return sendError(error, res, 'Unable to complete sale request'); }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
function getSale(req, res) {
  try { return res.json(saleService.getSale(Number(req.params.id))); } catch (error) {
    return sendError(error, res, 'Unable to complete sale request');
  }
}

module.exports = { createSale, getSale, listSales };
