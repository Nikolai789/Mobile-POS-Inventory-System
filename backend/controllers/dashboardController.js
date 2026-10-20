const { sendError } = require('../utils/errors');
const { getDashboard } = require('../services/dashboardService');

/** @param {import('express').Request} _req @param {import('express').Response} res */
function getDashboardSummary(_req, res) {
  try { return res.json(getDashboard()); } catch (error) {
    return sendError(error, res, 'Unable to load dashboard');
  }
}

module.exports = { getDashboardSummary };
