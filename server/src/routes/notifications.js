// =============================================================================
// Notification Routes — /api/notifications
// =============================================================================
// Handles reading and managing in-app notifications.
// Notifications are CREATED by other parts of the app (group routes create them
// when expenses are added, members are invited, etc.).
// This file only handles READING and UPDATING them.
//
// DELIVERY PATTERN: Polling
// The frontend calls GET /unread-count every 30 seconds to check for new
// notifications. This is the simplest notification pattern. Alternatives:
//   - WebSockets (push, real-time, more complex)
//   - Server-Sent Events (push, simpler than WebSockets)
//   - Firebase Cloud Messaging (push notifications to mobile)
// We can add any of these later without changing the data model.
// =============================================================================

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/notifications — List user's notifications (newest first)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ notifications });
  } catch (err) {
    console.error('List notifications error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/notifications/unread-count — Badge count for the bell icon
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/notifications/:id/read — Mark one notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/notifications/read-all — Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ message: 'All marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
