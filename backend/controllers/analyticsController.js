const { getAnalytics } = require('../services/analyticsService');

function getAnalyticsSummary(req, res) {
  try {
    return res.json(getAnalytics(req.query.period));
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      error: status === 400 ? error.message : 'Unable to load analytics',
    });
  }
}

module.exports = { getAnalyticsSummary };
