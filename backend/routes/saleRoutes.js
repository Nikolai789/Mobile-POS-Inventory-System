const express = require('express');
const saleController = require('../controllers/saleController');

const router = express.Router();
router.get('/', saleController.listSales);
router.get('/:id', saleController.getSale);
router.post('/', saleController.createSale);

module.exports = router;
