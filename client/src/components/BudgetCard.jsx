export default function BudgetCard({ budget, onEdit, onDelete }) {
  const percentage = Math.min(budget.percentage, 100);
  const progressClass =
    budget.alertLevel === 'exceeded'
      ? 'progress-exceeded'
      : budget.alertLevel === 'warning'
      ? 'progress-warning'
      : 'progress-ok';
  const badgeClass =
    budget.alertLevel === 'exceeded'
      ? 'badge-exceeded'
      : budget.alertLevel === 'warning'
      ? 'badge-warning'
      : 'badge-ok';

  return (
    <div className="glass-card glass-card-hover p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{budget.categoryIcon}</span>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-base-100)' }}>
              {budget.categoryName}
            </h4>
            <span className="text-xs capitalize" style={{ color: 'var(--color-base-400)' }}>
              {budget.period}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${badgeClass}`}>
            {budget.alertLevel === 'exceeded'
              ? '🔴 Over budget'
              : budget.alertLevel === 'warning'
              ? '🟡 Nearing limit'
              : '🟢 On track'}
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}>
          ₹{budget.spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-base-400)' }}>
          of ₹{budget.budgetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-3">
        <div
          className={`progress-fill ${progressClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-base-400)' }}>
          {budget.alertLevel === 'exceeded'
            ? `₹${(budget.spentAmount - budget.budgetAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} over`
            : `₹${budget.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(budget)} className="btn btn-ghost btn-sm" title="Edit">
            ✏️
          </button>
          <button onClick={() => onDelete(budget.id)} className="btn btn-ghost btn-sm" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
