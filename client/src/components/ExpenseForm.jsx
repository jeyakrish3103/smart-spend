import { useState, useEffect } from 'react';
import CategoryPicker from './CategoryPicker';

export default function ExpenseForm({ categories, onSubmit, onClose, initialData, loading }) {
  const [form, setForm] = useState({
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'cash',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.amount?.toString() || '',
        categoryId: initialData.categoryId || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        note: initialData.note || '',
        paymentMethod: initialData.paymentMethod || 'cash',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    if (!form.categoryId) {
      setError('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(form.amount),
        categoryId: form.categoryId,
        date: form.date,
        note: form.note || undefined,
        paymentMethod: form.paymentMethod,
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
      <div className="modal-content glass-card p-6" id="expense-form-modal">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}
          >
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="alert-banner alert-danger mb-4">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label className="label" htmlFor="expense-amount">Amount (₹)</label>
            <input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <CategoryPicker
              categories={categories}
              value={form.categoryId}
              onChange={(val) => setForm({ ...form, categoryId: val })}
              loading={loading}
            />
          </div>

          {/* Date */}
          <div>
            <label className="label" htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="label" htmlFor="expense-payment">Payment Method</label>
            <select
              id="expense-payment"
              className="input"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="label" htmlFor="expense-note">Note (optional)</label>
            <input
              id="expense-note"
              type="text"
              className="input"
              placeholder="Lunch at the canteen..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
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
              id="expense-submit-button"
            >
              {submitting ? (
                <span className="spinner" style={{ width: 18, height: 18 }}></span>
              ) : initialData ? (
                'Update'
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
