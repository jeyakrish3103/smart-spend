const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// POST /api/auth/sync
// Called by the frontend after a successful Clerk login.
// Ensures the user exists in our local SQLite database.
// ---------------------------------------------------------------------------
router.post('/sync', auth, async (req, res) => {
  try {
    const { id } = req.user; // from auth middleware
    const { email, name } = req.body; // passed from frontend

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      // First time logging in with Clerk, create the user record
      user = await prisma.user.create({
        data: {
          id, // Use Clerk's ID as our DB ID
          email,
          name: name || 'User', // Fallback if name is missing
          passwordHash: 'clerk_auth', // Placeholder since password isn't needed
        }
      });
    }

    res.json({ message: 'User synced successfully', user });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Server error during sync' });
  }
});

module.exports = router;
