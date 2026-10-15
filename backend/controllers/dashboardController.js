const { getDashboard } = require('../services/dashboardService');

function getDashboardSummary(_req, res) {
  try { return res.json(getDashboard()); } catch (_error) {
    return res.status(500).json({ error: 'Unable to load dashboard' });
  }
}

module.exports = { getDashboardSummary };
