// =============================================================================
// GroupExpenseForm Component
// =============================================================================
// Form for adding a shared expense. Handles the 3 split methods:
// equal, custom (exact amounts), and percentage.
//
// KEY PATTERNS:
// - Dynamic Form State: We maintain a `splits` array in state. When the user
//   types in a custom amount or percentage for a specific member, we update
//   just that item in the array.
// - Derived State: We calculate the `splitTotal` on the fly (for custom/pct)
//   to show the user if they've hit the exact total or 100%.
// =============================================================================

import { useState, useEffect } from 'react';

export default function GroupExpenseForm({ members, onSubmit, onCancel, initialData }) {
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [splitMethod, setSplitMethod] = useState(initialData?.splitMethod || 'equal');
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  // State for tracking custom/percentage splits per member
  const [splits, setSplits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize splits when members array or initialData changes
  useEffect(() => {
    setSplits(members.map(m => {
      const userId = m.userId || (m.user && m.user.id);
      
      let initAmount = '';
      let initPercentage = '';

      if (initialData && initialData.splits) {
        const existingSplit = initialData.splits.find(s => s.userId === userId);
        if (existingSplit) {
          if (initialData.splitMethod === 'custom') {
            initAmount = existingSplit.amountOwed;
          } else if (initialData.splitMethod === 'percentage' && initialData.amount > 0) {
            initPercentage = (existingSplit.amountOwed / initialData.amount) * 100;
          }
        }
      }

      return {
        userId,
        name: m.user ? m.user.name : 'Unknown',
        amount: initAmount,
        percentage: initPercentage,
        included: initialData ? !!existingSplit : true
      };
    }));
  }, [members, initialData]);

  const handleSplitChange = (userId, field, value) => {
    setSplits(prev => prev.map(s => 
      s.userId === userId ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return setError('Please enter a valid amount.');
    }

    // Prepare the payload for the backend
    const payload = {
      amount: totalAmount,
      description,
      splitMethod,
      date,
      splits: []
    };

    if (splitMethod === 'equal') {
      // For equal, we just need to send the list of userIds involved
      const includedSplits = splits.filter(s => s.included);
      if (includedSplits.length === 0) return setError('At least one member must be included.');
      payload.splits = includedSplits.map(s => ({ userId: s.userId }));
    } else if (splitMethod === 'custom') {
      const includedSplits = splits.filter(s => s.included);
      const sum = includedSplits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(sum - totalAmount) > 0.02) {
        return setError(`Split amounts sum to ₹${sum.toFixed(2)}, but total is ₹${totalAmount.toFixed(2)}.`);
      }
      payload.splits = includedSplits
        .map(s => ({ userId: s.userId, amount: parseFloat(s.amount) || 0 }))
        .filter(s => s.amount > 0);
    } else if (splitMethod === 'percentage') {
      const includedSplits = splits.filter(s => s.included);
      const sum = includedSplits.reduce((acc, s) => acc + (parseFloat(s.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.1) {
        return setError(`Percentages sum to ${sum.toFixed(1)}%, but must be exactly 100%.`);
      }
      payload.splits = includedSplits
        .map(s => ({ userId: s.userId, percentage: parseFloat(s.percentage) || 0 }))
        .filter(s => s.percentage > 0);
    }

    setLoading(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate running totals for UI feedback
  const customTotal = splits.filter(s => s.included).reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
  const pctTotal = splits.filter(s => s.included).reduce((acc, s) => acc + (parseFloat(s.percentage) || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Description</label>
          <input
            type="text"
            className="input"
            placeholder="Dinner at Taj, Cab to airport..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Total Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">How to split?</label>
        <div className="flex gap-2">
          {['equal', 'custom', 'percentage'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSplitMethod(method)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${
                splitMethod === method 
                  ? 'bg-accent-500/15 border-accent-500/30 text-accent-400' 
                  : 'bg-white/5 border-white/10 text-base-300 hover:bg-white/10'
              }`}
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Split Details Section */}
      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
        <h4 className="text-sm font-medium text-white mb-4">Split Details</h4>
        
        {splitMethod === 'equal' ? (
          <>
            <p className="text-sm text-base-400 text-center py-4">
              Total will be split equally among {splits.filter(s => s.included).length} included members.
              <br/>
              (₹{splits.filter(s => s.included).length ? (parseFloat(amount || 0) / splits.filter(s => s.included).length).toFixed(2) : '0.00'} each)
            </p>
            <div className="flex flex-col gap-3">
              {splits.map((split) => (
                <div key={split.userId} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={split.included} 
                    onChange={(e) => handleSplitChange(split.userId, 'included', e.target.checked)}
                    className="w-4 h-4 rounded bg-black/20 border-white/20 text-accent-500 focus:ring-accent-500/50"
                  />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-teal-500 flex items-center justify-center text-xs font-bold shrink-0 opacity-80">
                    {split.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 truncate text-sm ${split.included ? 'text-white' : 'text-base-500 line-through'}`}>{split.name}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {splits.map((split) => (
              <div key={split.userId} className={`flex items-center gap-3 ${!split.included ? 'opacity-50' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={split.included} 
                  onChange={(e) => handleSplitChange(split.userId, 'included', e.target.checked)}
                  className="w-4 h-4 rounded bg-black/20 border-white/20 text-accent-500 focus:ring-accent-500/50"
                />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-teal-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {split.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate text-sm text-white">{split.name}</div>
                <div className="w-32 shrink-0 relative">
                  {splitMethod === 'custom' ? (
                    <>
                      <span className="absolute left-3 top-2.5 text-base-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input pl-7 text-right"
                        value={split.amount !== undefined ? split.amount : ''}
                        onChange={(e) => handleSplitChange(split.userId, 'amount', e.target.value)}
                        placeholder="0.00"
                        disabled={!split.included}
                      />
                    </>
                  ) : (
                    <>
                      <span className="absolute right-3 top-2.5 text-base-400">%</span>
                      <input
                        type="number"
                        step="0.1"
                        className="input pr-7 text-right"
                        value={split.percentage !== undefined ? split.percentage : ''}
                        onChange={(e) => handleSplitChange(split.userId, 'percentage', e.target.value)}
                        placeholder="0"
                        disabled={!split.included}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Running Total Feedback */}
            <div className={`mt-2 pt-3 border-t border-white/10 flex justify-between text-sm ${
              (splitMethod === 'custom' && Math.abs(customTotal - (parseFloat(amount)||0)) < 0.01) ||
              (splitMethod === 'percentage' && Math.abs(pctTotal - 100) < 0.1)
                ? 'text-accent-400' : 'text-rose-400'
            }`}>
              <span>Total:</span>
              <span>
                {splitMethod === 'custom' ? `₹${customTotal.toFixed(2)} / ₹${parseFloat(amount||0).toFixed(2)}` : `${pctTotal.toFixed(1)}% / 100%`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Saving...' : (initialData ? 'Update Expense' : 'Add Expense')}
        </button>
      </div>
    </form>
  );
}
