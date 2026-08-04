// =============================================================================
// SmartSpend — Server Entry Point
// =============================================================================
// This is the main file that starts the Express server.
// It "mounts" route files at URL prefixes:
//   /api/auth         → login, register, profile
//   /api/categories   → expense categories
//   /api/expenses     → personal expenses CRUD
//   /api/budgets      → budget management
//   /api/dashboard    → dashboard analytics
//   /api/groups       → [Phase 2] group expenses, members, balances, settlements
//   /api/notifications → [Phase 2] in-app notification management
//
// MIDDLEWARE ORDER MATTERS:
//   1. cors()          → Allows browser requests from different ports
//   2. express.json()  → Parses JSON request bodies (req.body)
//   3. Route handlers  → Your actual endpoints
//   4. Error handler   → Catches unhandled errors (safety net)
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Phase 1 routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const dashboardRoutes = require('./routes/dashboard');

// Phase 2 routes
const groupRoutes = require('./routes/groups');
const notificationRoutes = require('./routes/notifications');

// Phase 3 routes
const insightRoutes = require('./routes/insights');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`SmartSpend API running on http://localhost:${PORT}`);
});

module.exports = app;
