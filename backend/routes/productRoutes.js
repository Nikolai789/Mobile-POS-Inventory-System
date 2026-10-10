const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();
router.get('/search', productController.searchProducts);
router.get('/lookup', productController.lookupProducts);
router.get('/', productController.listProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/stock', productController.updateStock);
router.delete('/:id', productController.archiveProduct);

module.exports = router;
