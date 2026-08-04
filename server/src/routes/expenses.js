const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/expenses — list with filters (date range, category, pagination)
router.get('/', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      categoryId,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const where = { userId: req.user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: { select: { name: true, icon: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('List expenses error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/expenses — create expense
router.post(
  '/',
  auth,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().withMessage('Date must be valid ISO format'),
    body('note').optional().trim(),
    body('paymentMethod').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, categoryId, date, note, paymentMethod } = req.body;

      const expense = await prisma.expense.create({
        data: {
          userId: req.user.id,
          amount,
          categoryId,
          date: date ? new Date(date) : new Date(),
          note: note || null,
          paymentMethod: paymentMethod || 'cash',
        },
        include: { category: { select: { name: true, icon: true } } },
      });

      res.status(201).json({ expense });
    } catch (err) {
      console.error('Create expense error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// PUT /api/expenses/:id — update expense
router.put(
  '/:id',
  auth,
  [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('categoryId').optional().notEmpty(),
    body('date').optional().isISO8601(),
    body('note').optional().trim(),
    body('paymentMethod').optional().trim(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await prisma.expense.findUnique({ where: { id } });
      if (!expense || expense.userId !== req.user.id) {
        return res.status(404).json({ error: 'Expense not found.' });
      }

      const { amount, categoryId, date, note, paymentMethod } = req.body;

      const updated = await prisma.expense.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(categoryId && { categoryId }),
          ...(date && { date: new Date(date) }),
          ...(note !== undefined && { note }),
          ...(paymentMethod && { paymentMethod }),
        },
        include: { category: { select: { name: true, icon: true } } },
      });

      res.json({ expense: updated });
    } catch (err) {
      console.error('Update expense error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// DELETE /api/expenses/:id — delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.userId !== req.user.id) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error('Delete expense error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/expenses/export — CSV download
router.get('/export', auth, async (req, res) => {
  try {
    const { startDate, endDate, categoryId } = req.query;

    const where = { userId: req.user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    // Build CSV manually — no extra dependency needed
    const headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Note'];
    const rows = expenses.map((e) => [
      new Date(e.date).toISOString().split('T')[0],
      `"${e.category.name}"`,
      e.amount.toString(),
      `"${e.paymentMethod}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export expenses error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
