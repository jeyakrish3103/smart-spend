const express = require('express');
const auth = require('../middleware/auth');
const {
  getSummary,
  getCategoryBreakdown,
  getSpendOverTime,
} = require('../services/dashboard.service');

const router = express.Router();

// GET /api/dashboard/summary — total spend this week / this month
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await getSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/dashboard/category-breakdown — spend by category (pie chart)
router.get('/category-breakdown', auth, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const breakdown = await getCategoryBreakdown(req.user.id, period);
    res.json({ breakdown });
  } catch (err) {
    console.error('Category breakdown error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/dashboard/spend-over-time — daily aggregated spend (line chart)
router.get('/spend-over-time', auth, async (req, res) => {
  try {
    const range = req.query.range || 'month';
    const data = await getSpendOverTime(req.user.id, range);
    res.json({ data });
  } catch (err) {
    console.error('Spend over time error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
