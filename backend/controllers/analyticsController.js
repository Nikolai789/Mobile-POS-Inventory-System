const { sendError } = require('../utils/errors');
const { getAnalytics } = require('../services/analyticsService');

/** @param {import('express').Request} req @param {import('express').Response} res */
function getAnalyticsSummary(req, res) {
  try {
    return res.json(getAnalytics(req.query.period));
  } catch (error) {
    return sendError(error, res, 'Unable to load analytics', true);
  }
}

module.exports = { getAnalyticsSummary };
