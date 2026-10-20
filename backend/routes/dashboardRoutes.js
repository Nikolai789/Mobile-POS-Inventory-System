const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');

const router = express.Router();
router.get('/', getDashboardSummary);

module.exports = router;
