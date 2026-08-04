const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get the start-of-week (Monday) and start-of-month for a given date.
 */
function getPeriodBounds(date = new Date()) {
  const now = new Date(date);

  // Start of week (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { startOfWeek, startOfMonth, now };
}

/**
 * Dashboard summary: total spend this week and this month.
 */
async function getSummary(userId) {
  const { startOfWeek, startOfMonth, now } = getPeriodBounds();

  const [weeklySpend, monthlySpend, expenseCountAgg] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.count({
      where: { userId, date: { gte: startOfMonth } },
    }),
  ]);

  const monthTotal = Number(monthlySpend._sum.amount || 0);
  const weekTotal = Number(weeklySpend._sum.amount || 0);
  const expenseCount = expenseCountAgg || 0;
  
  // Calculate average per day for the current month
  const daysInMonthSoFar = now.getDate();
  const avgPerDay = monthTotal / (daysInMonthSoFar || 1);

  return {
    weekTotal,
    monthTotal,
    avgPerDay,
    expenseCount,
  };
}

/**
 * Category breakdown: spend grouped by category (for pie chart).
 */
async function getCategoryBreakdown(userId, period = 'month') {
  const { startOfWeek, startOfMonth } = getPeriodBounds();
  const startDate = period === 'week' ? startOfWeek : startOfMonth;

  const breakdown = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { userId, date: { gte: startDate } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Enrich with category names
  const categoryIds = breakdown.map((b) => b.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true },
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return breakdown.map((b) => ({
    categoryId: b.categoryId,
    categoryName: categoryMap[b.categoryId]?.name || 'Unknown',
    categoryIcon: categoryMap[b.categoryId]?.icon || '📦',
    total: Number(b._sum.amount),
  }));
}

/**
 * Spend over time: daily aggregated spend for charts.
 * Supports 'week' (last 7 days), 'month' (last 30 days), 'quarter' (last 90 days).
 */
async function getSpendOverTime(userId, range = 'month') {
  const daysMap = { week: 7, month: 30, quarter: 90 };
  const days = daysMap[range] || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: startDate } },
    select: { date: true, amount: true },
    orderBy: { date: 'asc' },
  });

  // Group by day
  const dailyMap = {};
  let endLimit = new Date();
  endLimit.setHours(0, 0, 0, 0);

  for (const exp of expenses) {
    const d = new Date(exp.date);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dailyMap[day] = (dailyMap[day] || 0) + Number(exp.amount);
    
    // Check if this expense is in the future relative to endLimit
    const expDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (expDateOnly > endLimit) {
      endLimit = expDateOnly;
    }
  }

  // Fill in missing days with 0
  const result = [];
  const current = new Date(startDate);
  // Ensure we go up to endLimit
  endLimit.setHours(23, 59, 59, 999);

  while (current <= endLimit) {
    const dayStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    result.push({ date: dayStr, amount: dailyMap[dayStr] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Budget status: for each budget, compute current spend vs limit and alert level.
 */
async function getBudgetStatus(userId) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: { select: { name: true, icon: true } } },
  });

  const { startOfWeek, startOfMonth } = getPeriodBounds();

  const statuses = await Promise.all(
    budgets.map(async (budget) => {
      const startDate =
        budget.period === 'weekly'
          ? startOfWeek
          : budget.period === 'monthly'
          ? startOfMonth
          : new Date(budget.startDate);

      const where = {
        userId,
        date: { gte: startDate },
      };

      if (budget.categoryId) {
        where.categoryId = budget.categoryId;
      }

      const spent = await prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      });

      const spentAmount = Number(spent._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      let alertLevel = 'ok'; // green
      if (percentage >= 100) alertLevel = 'exceeded'; // red
      else if (percentage >= 80) alertLevel = 'warning'; // yellow/orange

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name || 'Overall',
        categoryIcon: budget.category?.icon || '💰',
        budgetAmount,
        spentAmount,
        remaining: Math.max(budgetAmount - spentAmount, 0),
        percentage: Math.round(percentage * 100) / 100,
        period: budget.period,
        alertLevel,
      };
    })
  );

  return statuses;
}

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getSpendOverTime,
  getBudgetStatus,
  getPeriodBounds,
};
