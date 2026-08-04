const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { getBudgetStatus } = require('../services/dashboard.service');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/budgets — list user's budgets
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      include: { category: { select: { name: true, icon: true } } },
      orderBy: { startDate: 'desc' },
    });

    res.json({ budgets });
  } catch (err) {
    console.error('List budgets error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/budgets — create budget
router.post(
  '/',
  auth,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Budget amount must be a positive number'),
    body('period')
      .isIn(['weekly', 'monthly', 'custom'])
      .withMessage('Period must be weekly, monthly, or custom'),
    body('categoryId').optional({ nullable: true }),
    body('startDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, period, categoryId, startDate } = req.body;

      // Validate total category budgets vs overall budget cap
      const allBudgets = await prisma.budget.findMany({ where: { userId: req.user.id } });
      let overallBudget = allBudgets.find(b => b.categoryId === null);
      let categorySum = allBudgets.filter(b => b.categoryId !== null).reduce((sum, b) => sum + Number(b.amount), 0);

      if (!categoryId) { 
        if (Number(amount) < categorySum) {
           return res.status(400).json({ error: `Overall budget cannot be less than the sum of existing category budgets (₹${categorySum}).` });
        }
      } else { 
        categorySum += Number(amount);
        if (overallBudget && categorySum > Number(overallBudget.amount)) {
           return res.status(400).json({ error: `Total category budgets (₹${categorySum}) cannot exceed your overall budget cap (₹${Number(overallBudget.amount)}).` });
        }
      }

      const budget = await prisma.budget.create({
        data: {
          userId: req.user.id,
          amount,
          period,
          categoryId: categoryId || null,
          startDate: startDate ? new Date(startDate) : new Date(),
        },
        include: { category: { select: { name: true, icon: true } } },
      });

      res.status(201).json({ budget });
    } catch (err) {
      console.error('Create budget error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// PUT /api/budgets/:id — update budget
router.put(
  '/:id',
  auth,
  [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('period').optional().isIn(['weekly', 'monthly', 'custom']),
    body('categoryId').optional({ nullable: true }),
    body('startDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const budget = await prisma.budget.findUnique({ where: { id } });
      if (!budget || budget.userId !== req.user.id) {
        return res.status(404).json({ error: 'Budget not found.' });
      }

      const { amount, period, categoryId, startDate } = req.body;

      const allBudgets = await prisma.budget.findMany({ where: { userId: req.user.id } });
      
      // Compute future state to validate against the cap
      const futureBudgets = allBudgets.map(b => {
        if (b.id === id) {
           return {
             ...b,
             amount: amount !== undefined ? amount : b.amount,
             categoryId: categoryId !== undefined ? (categoryId || null) : b.categoryId
           };
        }
        return b;
      });

      const overallBudget = futureBudgets.find(b => b.categoryId === null);
      const categorySum = futureBudgets.filter(b => b.categoryId !== null).reduce((sum, b) => sum + Number(b.amount), 0);

      if (overallBudget && categorySum > Number(overallBudget.amount)) {
          return res.status(400).json({ error: `Total category budgets (₹${categorySum}) cannot exceed your overall budget cap (₹${Number(overallBudget.amount)}).` });
      }

      const updated = await prisma.budget.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(period && { period }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(startDate && { startDate: new Date(startDate) }),
        },
        include: { category: { select: { name: true, icon: true } } },
      });

      res.json({ budget: updated });
    } catch (err) {
      console.error('Update budget error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// DELETE /api/budgets/:id — delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== req.user.id) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });

    res.json({ message: 'Budget deleted.' });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/budgets/status — budget vs. actual spend (for alerts)
router.get('/status', auth, async (req, res) => {
  try {
    const statuses = await getBudgetStatus(req.user.id);
    res.json({ budgets: statuses });
  } catch (err) {
    console.error('Budget status error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
