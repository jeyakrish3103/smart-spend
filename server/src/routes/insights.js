const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const aiService = require('../services/ai.service');

const router = express.Router();
const prisma = new PrismaClient();

// All insights routes require authentication
router.use(auth);

// Helper to get start and end of current month
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, now };
}

// =============================================================================
// GET /api/insights/summary
// Generates a monthly summary based on current month's expenses.
// =============================================================================
router.get('/summary', async (req, res) => {
  try {
    const { start, end } = getCurrentMonthRange();

    // Fetch expenses for the current month
    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: start, lte: end },
      },
      include: { category: true },
    });

    if (expenses.length === 0) {
      return res.json({ summary: "You haven't tracked any expenses this month yet. Start logging to get AI insights!" });
    }

    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Group by category
    const categoryTotals = {};
    expenses.forEach((exp) => {
      const catName = exp.category ? exp.category.name : 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(exp.amount);
    });

    const categoryBreakdown = Object.keys(categoryTotals)
      .map((name) => ({ name, amount: categoryTotals[name] }))
      .sort((a, b) => b.amount - a.amount);

    // Call Gemini
    const summary = await aiService.generateSummary({ totalSpent, categoryBreakdown });

    res.json({ summary });
  } catch (error) {
    console.error('Insight summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

// =============================================================================
// GET /api/insights/forecast
// Projects month-end spending based on current daily burn rate.
// =============================================================================
router.get('/forecast', async (req, res) => {
  try {
    const { start, end, now } = getCurrentMonthRange();
    
    // Total spent this month
    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: start, lte: end },
      },
    });

    const currentSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Get total budgets for this month
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
    });
    
    const overallBudget = budgets.find(b => b.categoryId === null);
    const totalBudget = overallBudget 
      ? Number(overallBudget.amount) 
      : budgets.reduce((sum, b) => sum + Number(b.amount), 0);

    if (totalBudget === 0) {
      return res.json({ forecast: "You don't have any budgets set up. Set a budget to get a spending forecast!" });
    }

    if (expenses.length === 0) {
      return res.json({ forecast: "You haven't spent anything yet this month. You're perfectly on track!" });
    }

    // Calculate burn rate
    const daysPassed = now.getDate();
    const daysInMonth = end.getDate();
    
    const burnRate = Math.round(currentSpent / daysPassed);
    const projectedTotal = Math.round(burnRate * daysInMonth);

    const forecast = await aiService.generateForecast({
      currentSpent,
      burnRate,
      projectedTotal,
      totalBudget
    });

    res.json({ forecast });
  } catch (error) {
    console.error('Insight forecast error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate forecast' });
  }
});

// =============================================================================
// POST /api/insights/recommendations
// Suggests budget cuts based on priorities and a savings goal.
// =============================================================================
router.post('/recommendations', [
  body('priorities').trim().notEmpty().withMessage('Priorities are required'),
  body('savingsGoal').isFloat({ min: 1 }).withMessage('Savings goal must be greater than 0'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { priorities, savingsGoal } = req.body;

    // We'll look at the last 90 days to get a historical average
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: ninetyDaysAgo },
      },
      include: { category: true },
    });

    if (expenses.length === 0) {
      return res.json({ recommendations: "I don't have enough spending history to make a recommendation yet. Keep tracking your expenses!" });
    }

    // Group by category over the 3 months (divide total by 3 for a monthly average)
    const categoryTotals = {};
    expenses.forEach((exp) => {
      const catName = exp.category ? exp.category.name : 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(exp.amount);
    });

    const historicalAverages = Object.keys(categoryTotals)
      .map((name) => ({ name, average: Math.round(categoryTotals[name] / 3) }))
      .sort((a, b) => b.average - a.average);

    const recommendations = await aiService.generateRecommendations(priorities, parseFloat(savingsGoal), historicalAverages);

    res.json({ recommendations });
  } catch (error) {
    console.error('Insight recommendations error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

// =============================================================================
// POST /api/insights/impulse
// Gives a verdict on a potential impulse purchase.
// =============================================================================
router.post('/impulse', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('priorities').trim().notEmpty().withMessage('Priorities are required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, priorities } = req.body;
    const { start, end, now } = getCurrentMonthRange();

    // Get current month spending
    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: start, lte: end },
      },
    });

    const currentSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Get budgets
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
    });
    
    const overallBudget = budgets.find(b => b.categoryId === null);
    const totalBudget = overallBudget 
      ? Number(overallBudget.amount) 
      : budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const remainingBudget = Math.max(0, totalBudget - currentSpent);

    // Calculate burn rate
    const daysPassed = Math.max(1, now.getDate());
    const burnRate = Math.round(currentSpent / daysPassed);

    const verdict = await aiService.generateImpulseVerdict(
      parseFloat(amount),
      category,
      priorities,
      remainingBudget,
      burnRate
    );

    res.json({ verdict });
  } catch (error) {
    console.error('Insight impulse error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate impulse verdict' });
  }
});

// ---------------------------------------------------------------------------
// EXPERIMENTAL: We can add more specific insights endpoints here later.
// ---------------------------------------------------------------------------

module.exports = router;
