const express = require('express');
const { getAnalyticsSummary } = require('../controllers/analyticsController');

const router = express.Router();
router.get('/', getAnalyticsSummary);

module.exports = router;
