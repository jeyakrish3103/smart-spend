import { useState, useEffect } from 'react';
import CategoryPicker from './CategoryPicker';

export default function BudgetForm({ categories, onSubmit, onClose, initialData }) {
  const [form, setForm] = useState({
    amount: '',
    period: 'monthly',
    categoryId: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.budgetAmount?.toString() || initialData.amount?.toString() || '',
        period: initialData.period || 'monthly',
        categoryId: initialData.categoryId || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Budget amount must be a positive number');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(form.amount),
        period: form.period,
        categoryId: form.categoryId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-card p-6" id="budget-form-modal">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}
          >
            {initialData ? 'Edit Budget' : 'Set Budget'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="alert-banner alert-danger mb-4">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label className="label" htmlFor="budget-amount">Budget Limit (₹)</label>
            <input
              id="budget-amount"
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              placeholder="5000.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              autoFocus
            />
          </div>

          {/* Period */}
          <div>
            <label className="label" htmlFor="budget-period">Period</label>
            <select
              id="budget-period"
              className="input"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Category (optional — null = overall) */}
          <div>
            <label className="label">Category (leave empty for overall budget)</label>
            <CategoryPicker
              categories={categories}
              value={form.categoryId}
              onChange={(val) => setForm({ ...form, categoryId: val })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={submitting}
              id="budget-submit-button"
            >
              {submitting ? (
                <span className="spinner" style={{ width: 18, height: 18 }}></span>
              ) : initialData ? (
                'Update'
              ) : (
                'Set Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
