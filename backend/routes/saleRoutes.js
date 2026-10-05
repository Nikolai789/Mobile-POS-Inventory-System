const express = require('express');
const saleController = require('../controllers/saleController');

const router = express.Router();
router.post('/', saleController.createSale);

module.exports = router;