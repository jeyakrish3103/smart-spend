// =============================================================================
// Group Routes — /api/groups
// =============================================================================
// This file handles ALL group-related HTTP endpoints:
//   - Group CRUD (create, list, get detail)
//   - Member management (add, remove)
//   - Group expenses (add with splits, list, delete)
//   - Balances (net settlement computation)
//   - Settle-up (record payments)
//
// ARCHITECTURE PATTERN: "Fat route, thin service"
// The route handler does auth + validation + DB queries.
// Complex business logic (settlement algorithm) lives in the service layer.
//
// KEY CONCEPTS:
// - req.params.id  → URL parameter (e.g. /groups/abc123 → id = "abc123")
// - req.user.id    → Set by the auth middleware (JWT-decoded user)
// - Prisma include  → Eager loading related data (like SQL JOINs)
// - express-validator → Validates request body before processing
// =============================================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { computeSettlements } = require('../services/settlement.service');

const router = express.Router();
const prisma = new PrismaClient();

// All group routes require authentication
router.use(auth);

// ---------------------------------------------------------------------------
// HELPER: Get or create a special category for group expenses.
// ---------------------------------------------------------------------------
async function getOrCreateGroupCategory(userId, group) {
  let cat = await prisma.category.findFirst({
    where: { userId, name: `Group: ${group.name}` }
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: { userId, name: `Group: ${group.name}`, icon: '👥' }
    });
  }
  return cat;
}

// ---------------------------------------------------------------------------
// HELPER: Check if the current user is a member of a group.
// We'll call this in many endpoints — DRY (Don't Repeat Yourself).
// ---------------------------------------------------------------------------
async function requireMembership(groupId, userId) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership !== null;
}

// =============================================================================
// GROUP CRUD
// =============================================================================

// POST /api/groups — Create a new group
// The creator is automatically added as a member.
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Group name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;

      // Prisma "create" with nested "create" — this runs in a single
      // database transaction. If either fails, both are rolled back.
      const group = await prisma.group.create({
        data: {
          name,
          createdBy: req.user.id,
          members: {
            create: { userId: req.user.id }, // auto-add creator as member
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { members: true, expenses: true } },
        },
      });

      res.status(201).json({ group });
    } catch (err) {
      console.error('Create group error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// GET /api/groups — List groups the current user belongs to
router.get('/', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: req.user.id } }, // "some" = at least one member matches
      },
      include: {
        _count: { select: { members: true, expenses: true } },
        members: {
          include: { user: { select: { id: true, name: true } } },
          take: 5, // Only show first 5 member avatars
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ groups });
  } catch (err) {
    console.error('List groups error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/groups/:id — Group detail (members, expense count, total)
router.get('/:id', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { expenses: true } },
      },
    });

    if (!group) return res.status(404).json({ error: 'Group not found.' });

    // Compute total group spend
    const totalSpend = await prisma.groupExpense.aggregate({
      where: { groupId: req.params.id },
      _sum: { amount: true },
    });

    res.json({
      group,
      totalSpend: totalSpend._sum.amount || 0,
    });
  } catch (err) {
    console.error('Get group error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/groups/:id — Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    await prisma.group.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Group deleted successfully.' });
  } catch (err) {
    console.error('Delete group error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// =============================================================================
// MEMBER MANAGEMENT
// =============================================================================

// POST /api/groups/:id/members — Add a member by email (and optionally name)
router.post(
  '/:id/members',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isMember = await requireMembership(req.params.id, req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

      const { email, name } = req.body;

      // Find user by email
      let userToAdd = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });

      // If user doesn't exist, create a dummy user if a name was provided
      if (!userToAdd) {
        if (!name || name.trim() === '') {
          return res.status(404).json({ error: 'User not found. Please provide their Name to invite them.' });
        }
        
        // Create a dummy user
        // We use a random password hash since they haven't actually signed up yet.
        userToAdd = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email,
            passwordHash: 'dummy_hash_' + Math.random().toString(36).substring(7),
          },
          select: { id: true, name: true, email: true }
        });
      }

      // Check if already a member
      const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: req.params.id, userId: userToAdd.id } },
      });
      if (existing) {
        return res.status(409).json({ error: 'User is already a member of this group.' });
      }

      await prisma.groupMember.create({
        data: { groupId: req.params.id, userId: userToAdd.id },
      });

      // Send notification to the added user
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      const adder = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true },
      });

      await prisma.notification.create({
        data: {
          userId: userToAdd.id,
          type: 'added_to_group',
          message: `${adder.name} added you to "${group.name}"`,
          data: JSON.stringify({ groupId: req.params.id }),
        },
      });

      res.status(201).json({ member: userToAdd });
    } catch (err) {
      console.error('Add member error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// DELETE /api/groups/:id/members/:userId — Remove a member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    // Can't remove yourself if you're the only member
    const memberCount = await prisma.groupMember.count({
      where: { groupId: req.params.id },
    });
    if (memberCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last member.' });
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: req.params.id, userId: req.params.userId } },
    });

    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// =============================================================================
// GROUP EXPENSES
// =============================================================================

// POST /api/groups/:id/expenses — Add a group expense with splits
//
// The request body contains:
//   { amount, description, splitMethod, splits: [{ userId, amount/percentage }] }
//
// For "equal" splits, the `splits` array just lists participant userIds.
// For "custom", each split has an exact `amount`.
// For "percentage", each split has a `percentage` (must sum to 100).
router.post(
  '/:id/expenses',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('splitMethod').isIn(['equal', 'custom', 'percentage']).withMessage('Invalid split method'),
    body('splits').isArray({ min: 1 }).withMessage('At least one split participant required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isMember = await requireMembership(req.params.id, req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

      const { amount, description, splitMethod, splits, date } = req.body;
      const totalAmount = parseFloat(amount);

      // ---------------------
      // COMPUTE SPLIT AMOUNTS
      // ---------------------
      // This is where the three split methods diverge:
      let splitData = [];

      if (splitMethod === 'equal') {
        // Equal: divide evenly. Handle rounding by giving the remainder to the first person.
        // e.g. ₹100 ÷ 3 = ₹33.33 + ₹33.33 + ₹33.34
        const perPerson = Math.floor((totalAmount / splits.length) * 100) / 100;
        const remainder = Math.round((totalAmount - perPerson * splits.length) * 100) / 100;

        splitData = splits.map((s, i) => ({
          userId: s.userId,
          amountOwed: i === 0 ? perPerson + remainder : perPerson,
        }));
      } else if (splitMethod === 'custom') {
        // Custom: validate that amounts sum to total
        const customTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        if (Math.abs(customTotal - totalAmount) > 0.02) {
          return res.status(400).json({ error: `Split amounts (₹${customTotal}) don't add up to total (₹${totalAmount}).` });
        }
        splitData = splits.map((s) => ({
          userId: s.userId,
          amountOwed: parseFloat(s.amount),
        }));
      } else if (splitMethod === 'percentage') {
        // Percentage: validate that percentages sum to 100
        const totalPct = splits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
        if (Math.abs(totalPct - 100) > 0.5) {
          return res.status(400).json({ error: `Percentages sum to ${totalPct}%, must equal 100%.` });
        }
        splitData = splits.map((s) => ({
          userId: s.userId,
          amountOwed: Math.round((totalAmount * parseFloat(s.percentage)) / 100 * 100) / 100,
        }));
      }

      // Create the expense + all splits in a single transaction
      const expense = await prisma.groupExpense.create({
        data: {
          groupId: req.params.id,
          paidByUserId: req.user.id,
          amount: totalAmount,
          description,
          splitMethod,
          date: date ? new Date(date) : new Date(),
          splits: {
            create: splitData,
          },
        },
        include: {
          splits: { include: { user: { select: { id: true, name: true } } } },
          paidBy: { select: { id: true, name: true } },
        },
      });

      const group = await prisma.group.findUnique({ where: { id: req.params.id } });

      // Automatically sync to personal expenses
      for (const split of expense.splits) {
        if (Number(split.amountOwed) > 0) {
          const cat = await getOrCreateGroupCategory(split.userId, group);
          await prisma.expense.create({
            data: {
              userId: split.userId,
              amount: split.amountOwed,
              categoryId: cat.id,
              date: expense.date,
              note: expense.description,
              paymentMethod: expense.paidByUserId === split.userId ? 'Paid by you' : 'Group Split',
              groupExpenseSplitId: split.id
            }
          });
        }
      }

      // Notify all group members (except the person who added the expense)
      const members = await prisma.groupMember.findMany({
        where: { groupId: req.params.id, userId: { not: req.user.id } },
      });
      const payer = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true },
      });

      // Create notifications in parallel (Promise.all)
      await Promise.all(
        members.map((m) =>
          prisma.notification.create({
            data: {
              userId: m.userId,
              type: 'group_expense_added',
              message: `${payer.name} added ₹${totalAmount} for "${description}" in "${group.name}"`,
              data: JSON.stringify({ groupId: req.params.id, expenseId: expense.id }),
            },
          })
        )
      );

      res.status(201).json({ expense });
    } catch (err) {
      console.error('Add group expense error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// PUT /api/groups/:id/expenses/:expenseId — Update a group expense with splits
router.put(
  '/:id/expenses/:expenseId',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('splitMethod').isIn(['equal', 'custom', 'percentage']).withMessage('Invalid split method'),
    body('splits').isArray({ min: 1 }).withMessage('At least one split participant required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isMember = await requireMembership(req.params.id, req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

      const { amount, description, splitMethod, splits, date } = req.body;
      const totalAmount = parseFloat(amount);

      let splitData = [];

      if (splitMethod === 'equal') {
        const perPerson = Math.floor((totalAmount / splits.length) * 100) / 100;
        const remainder = Math.round((totalAmount - perPerson * splits.length) * 100) / 100;

        splitData = splits.map((s, i) => ({
          userId: s.userId,
          amountOwed: i === 0 ? perPerson + remainder : perPerson,
        }));
      } else if (splitMethod === 'custom') {
        const customTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        if (Math.abs(customTotal - totalAmount) > 0.02) {
          return res.status(400).json({ error: `Split amounts (₹${customTotal}) don't add up to total (₹${totalAmount}).` });
        }
        splitData = splits.map((s) => ({
          userId: s.userId,
          amountOwed: parseFloat(s.amount),
        }));
      } else if (splitMethod === 'percentage') {
        const totalPct = splits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
        if (Math.abs(totalPct - 100) > 0.5) {
          return res.status(400).json({ error: `Percentages sum to ${totalPct}%, must equal 100%.` });
        }
        splitData = splits.map((s) => ({
          userId: s.userId,
          amountOwed: Math.round((totalAmount * parseFloat(s.percentage)) / 100 * 100) / 100,
        }));
      }

      // Update the expense + recreate all splits in a single transaction
      const expense = await prisma.groupExpense.update({
        where: { id: req.params.expenseId },
        data: {
          amount: totalAmount,
          description,
          splitMethod,
          date: date ? new Date(date) : undefined,
          splits: {
            deleteMany: {},
            create: splitData,
          },
        },
        include: {
          splits: { include: { user: { select: { id: true, name: true } } } },
          paidBy: { select: { id: true, name: true } },
        },
      });

      const group = await prisma.group.findUnique({ where: { id: req.params.id } });

      // Automatically sync to personal expenses (old ones were cascade-deleted)
      for (const split of expense.splits) {
        if (Number(split.amountOwed) > 0) {
          const cat = await getOrCreateGroupCategory(split.userId, group);
          await prisma.expense.create({
            data: {
              userId: split.userId,
              amount: split.amountOwed,
              categoryId: cat.id,
              date: expense.date,
              note: expense.description,
              paymentMethod: expense.paidByUserId === split.userId ? 'Paid by you' : 'Group Split',
              groupExpenseSplitId: split.id
            }
          });
        }
      }

      res.json({ expense });
    } catch (err) {
      console.error('Update group expense error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// GET /api/groups/:id/expenses — List group expenses
router.get('/:id/expenses', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    const expenses = await prisma.groupExpense.findMany({
      where: { groupId: req.params.id },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ expenses });
  } catch (err) {
    console.error('List group expenses error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/groups/:id/expenses/:expenseId — Delete a group expense
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    await prisma.groupExpense.delete({
      where: { id: req.params.expenseId },
    });

    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error('Delete group expense error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// =============================================================================
// BALANCES & SETTLEMENTS
// =============================================================================

// GET /api/groups/:id/balances — Computed net balances + optimized transfers
router.get('/:id/balances', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    // Fetch all expenses with splits and all settlements
    const [expenses, settlements, membersRaw] = await Promise.all([
      prisma.groupExpense.findMany({
        where: { groupId: req.params.id },
        include: { splits: true },
      }),
      prisma.settlement.findMany({
        where: { groupId: req.params.id },
      }),
      prisma.groupMember.findMany({
        where: { groupId: req.params.id },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    const members = membersRaw.map((m) => ({ userId: m.user.id, userName: m.user.name }));

    // Call the pure settlement algorithm
    const result = computeSettlements(expenses, settlements, members);

    res.json(result);
  } catch (err) {
    console.error('Get balances error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/groups/:id/settle — Record a settlement (mark debt as paid)
router.post(
  '/:id/settle',
  [
    body('fromUserId').notEmpty().withMessage('Payer user ID is required'),
    body('toUserId').notEmpty().withMessage('Recipient user ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isMember = await requireMembership(req.params.id, req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

      const { fromUserId, toUserId, amount } = req.body;

      // Security: You can only record a settlement if you are either paying or receiving
      if (req.user.id !== fromUserId && req.user.id !== toUserId) {
        return res.status(403).json({ error: 'You can only record payments you are involved in.' });
      }

      const settlement = await prisma.settlement.create({
        data: {
          groupId: req.params.id,
          fromUserId,
          toUserId,
          amount: parseFloat(amount),
        },
      });

      // Notify the recipient
      const payer = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true },
      });
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });

      await prisma.notification.create({
        data: {
          userId: toUserId,
          type: 'settled_up',
          message: `${payer.name} settled ₹${parseFloat(amount).toFixed(2)} with you in "${group.name}"`,
          data: JSON.stringify({ groupId: req.params.id, settlementId: settlement.id }),
        },
      });

      res.status(201).json({ settlement });
    } catch (err) {
      console.error('Settle error:', err.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// GET /api/groups/:id/settlements — Settlement history
router.get('/:id/settlements', async (req, res) => {
  try {
    const isMember = await requireMembership(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group.' });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ settlements });
  } catch (err) {
    console.error('List settlements error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
