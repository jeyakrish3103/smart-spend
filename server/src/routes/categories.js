const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories — list default + user's custom categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },        // default/global categories
          { userId: req.user.id }, // user's custom categories
        ],
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    console.error('List categories error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/categories — create custom category
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('icon').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, icon } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          icon: icon || '📦',
          userId: req.user.id,
        },
      });

      res.status(201).json({ category });
    } catch (err) {
      console.error('Create category error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// PUT /api/categories/:id — edit custom category (only user's own)
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('icon').optional().trim(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category || category.userId !== req.user.id) {
        return res.status(404).json({ error: 'Category not found or not editable.' });
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          ...(req.body.name && { name: req.body.name }),
          ...(req.body.icon && { icon: req.body.icon }),
        },
      });

      res.json({ category: updated });
    } catch (err) {
      console.error('Update category error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// DELETE /api/categories/:id — delete custom category (only user's own)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== req.user.id) {
      return res.status(404).json({ error: 'Category not found or not deletable.' });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
