import { useState, useEffect } from 'react';
import SummaryCards from '../components/SummaryCards';
import PieChart from '../components/PieChart';
import SpendChart from '../components/SpendChart';
import CalendarSuggestions from '../components/CalendarSuggestions';
import { useDashboard } from '../hooks/useDashboard';
import { useBudgets } from '../hooks/useBudgets';

export default function DashboardPage() {
  const {
    summary,
    categoryBreakdown,
    spendOverTime,
    loading: dashLoading,
    fetchSummary,
    fetchCategoryBreakdown,
    fetchSpendOverTime,
  } = useDashboard();

  const { budgetStatuses, fetchBudgetStatuses } = useBudgets();

  const [breakdownPeriod, setBreakdownPeriod] = useState('month');
  const [spendRange, setSpendRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSummary(),
      fetchCategoryBreakdown('month'),
      fetchSpendOverTime('month'),
      fetchBudgetStatuses(),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBreakdownPeriodChange = async (period) => {
    setBreakdownPeriod(period);
    await fetchCategoryBreakdown(period);
  };

  const handleSpendRangeChange = async (range) => {
    setSpendRange(range);
    await fetchSpendOverTime(range);
  };

  // Budget alerts — show warnings/exceeded at top
  const alertBudgets = budgetStatuses.filter(
    (b) => b.alertLevel === 'warning' || b.alertLevel === 'exceeded'
  );

  return (
    <div className="space-y-6">
      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          {alertBudgets.map((b) => (
            <div
              key={b.id}
              className={`alert-banner ${
                b.alertLevel === 'exceeded' ? 'alert-danger' : 'alert-warning'
              }`}
            >
              <span>
                {b.alertLevel === 'exceeded' ? '🚨' : '⚠️'}
              </span>
              <span>
                <strong>{b.categoryName}</strong> budget{' '}
                {b.alertLevel === 'exceeded'
                  ? `exceeded by ₹${(b.spentAmount - b.budgetAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : `at ${b.percentage.toFixed(0)}% (₹${b.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} left)`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Suggestions (Only shows if connected & has suggestions) */}
      <CalendarSuggestions />

      {/* Summary cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: '4rem' }}>
        <PieChart
          breakdown={categoryBreakdown}
          period={breakdownPeriod}
          onPeriodChange={handleBreakdownPeriodChange}
          loading={loading || dashLoading}
        />
        <SpendChart
          data={spendOverTime}
          range={spendRange}
          onRangeChange={handleSpendRangeChange}
          loading={loading || dashLoading}
        />
      </div>
    </div>
  );
}
