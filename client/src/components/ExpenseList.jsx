export default function ExpenseList({
  expenses,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="glass-card p-10 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">💸</span>
        <p className="text-base font-medium" style={{ color: 'var(--color-base-300)' }}>
          No expenses yet
        </p>
        <p className="text-sm" style={{ color: 'var(--color-base-400)' }}>
          Add your first expense to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto" style={{ width: '100%' }}>
        <table className="w-full text-left" style={{ width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Date', 'Category', 'Amount', 'Payment', 'Note', ''].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--color-base-400)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp, i) => (
              <tr
                key={exp.id}
                className="transition-colors duration-150 hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < expenses.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  animation: `slideUp 0.3s ease ${i * 0.03}s both`,
                }}
              >
                <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-base-200)' }}>
                  {new Date(exp.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-base-200)' }}>
                    <span>{exp.category?.icon || '📦'}</span>
                    {exp.category?.name || 'Unknown'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--color-base-50)' }}>
                  ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--color-base-300)',
                    }}
                  >
                    {exp.paymentMethod === 'cash'
                      ? '💵'
                      : exp.paymentMethod === 'card'
                      ? '💳'
                      : exp.paymentMethod === 'upi'
                      ? '📱'
                      : '📦'}{' '}
                    {exp.paymentMethod}
                  </span>
                </td>
                <td
                  className="px-5 py-4 text-sm max-w-[180px] truncate"
                  style={{ color: 'var(--color-base-400)' }}
                  title={exp.note || ''}
                >
                  {exp.note || '—'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(exp)}
                      className="btn btn-ghost btn-sm"
                      title="Edit"
                      aria-label={`Edit expense ${exp.id}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(exp.id)}
                      className="btn btn-ghost btn-sm"
                      title="Delete"
                      aria-label={`Delete expense ${exp.id}`}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-base-400)' }}>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-ghost btn-sm"
              style={pagination.page <= 1 ? { opacity: 0.3, cursor: 'default' } : {}}
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-ghost btn-sm"
              style={pagination.page >= pagination.totalPages ? { opacity: 0.3, cursor: 'default' } : {}}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
