// =============================================================================
// SettleUpForm Component
// =============================================================================
// A simple form to confirm that money has changed hands.
// Pre-fills with the suggested transfer amount.
// =============================================================================

import { useState } from 'react';

export default function SettleUpForm({ transfer, onConfirm, onCancel, currentUserId }) {
  const [amount, setAmount] = useState(transfer.amount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iAmPaying = transfer.from === currentUserId;
  const otherName = iAmPaying ? transfer.toName : transfer.fromName;
  const toUserId = iAmPaying ? transfer.to : transfer.from; // If I'm receiving, the other person pays me, but in reality our API expects "toUserId" to be who receives. Wait, if I'm receiving, the other person is paying ME. If I record it, the API expects me to send it?
  
  // Actually, our API takes `toUserId` and records `fromUserId = req.user.id`.
  // So a user can only record payments THEY made to someone else. 
  // Let's enforce that in the UI — you can only click "Settle" on debts YOU owe.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return setError('Invalid amount');

    setLoading(true);
    try {
      await onConfirm(transfer.from, transfer.to, numAmt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <div className="text-4xl mb-3">💸</div>
        <h3 className="text-lg font-bold text-white">Settle up with {transfer.toName}</h3>
        <p className="text-sm text-base-400 mt-1">Record a payment you made.</p>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="label">Amount Paid (₹)</label>
        <input
          type="number"
          step="0.01"
          className="input text-xl py-3 text-center"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Saving...' : 'Confirm Payment'}
        </button>
      </div>
    </form>
  );
}
