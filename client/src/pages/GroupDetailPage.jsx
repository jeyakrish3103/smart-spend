// =============================================================================
// GroupDetailPage
// =============================================================================
// The central hub for a specific group. 
// This is a "Smart Component" — it fetches data using our custom hook and
// passes it down to "Dumb Components" like BalanceView and GroupExpenseForm.
//
// KEY PATTERNS:
// - `useParams` from react-router gets the `:id` from the URL.
// - Multiple modals (add member, add expense, settle up) are managed
//   with separate state variables.
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import GroupExpenseForm from '../components/GroupExpenseForm';
import BalanceView from '../components/BalanceView';
import SettleUpForm from '../components/SettleUpForm';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { 
    loadGroupData, addMember, removeMember, 
    addExpense, updateExpense, deleteExpense, settleUp, deleteGroup 
  } = useGroups();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'member', 'expense', 'settle'
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [settleTransfer, setSettleTransfer] = useState(null); // Which transfer we're settling
  const [editingExpense, setEditingExpense] = useState(null); // The expense being edited

  // Fetch all group data
  const refreshData = useCallback(async () => {
    try {
      const result = await loadGroupData(id);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, loadGroupData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle adding a member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    try {
      await addMember(id, { email: newMemberEmail.trim(), name: newMemberName.trim() });
      setActiveModal(null);
      setNewMemberEmail('');
      setNewMemberName('');
      refreshData();
    } catch (err) {
      alert(err.message); // Simple alert for now, could use toast
    }
  };

  // Handle adding an expense
  const handleAddExpense = async (expenseData) => {
    await addExpense(id, expenseData);
    setActiveModal(null);
    refreshData();
  };

  // Handle updating an expense
  const handleUpdateExpense = async (expenseData) => {
    await updateExpense(id, editingExpense.id, expenseData);
    setActiveModal(null);
    setEditingExpense(null);
    refreshData();
  };

  // Handle settling up
  const handleSettleUp = async (fromUserId, toUserId, amount) => {
    await settleUp(id, fromUserId, toUserId, amount);
    setActiveModal(null);
    setSettleTransfer(null);
    refreshData();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-10">
        <p className="text-rose-400 mb-4">{error || 'Group not found'}</p>
        <Link to="/groups" className="btn btn-secondary">← Back to Groups</Link>
      </div>
    );
  }

  const { group, totalSpend, expenses, balances, transfers } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/groups" className="text-base-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <h2 className="text-2xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {group.name}
            </h2>
          </div>
          <p className="text-sm text-base-400">
            Total group spend: <span className="text-white font-medium">₹{parseFloat(totalSpend || 0).toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <button 
            onClick={async () => {
              if (confirm('Are you sure you want to delete this group? This action cannot be undone and will delete all expenses and balances.')) {
                await deleteGroup(id);
                window.location.href = '/groups';
              }
            }}
            className="btn flex-1 md:flex-none border border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
          >
            Delete Group
          </button>
          <button onClick={() => setActiveModal('member')} className="btn btn-secondary flex-1 md:flex-none">
            + Member
          </button>
          <button onClick={() => setActiveModal('expense')} className="btn btn-primary flex-1 md:flex-none">
            + Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Balances & Members */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-5">
            <BalanceView 
              balances={balances} 
              transfers={transfers} 
              currentUserId={user.id}
              onSettleClick={(t) => { setSettleTransfer(t); setActiveModal('settle'); }}
            />
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Members ({group.members.length})</h3>
            <div className="flex flex-col gap-3">
              {group.members.map((m) => (
                <div key={m.userId} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-xs font-bold text-white">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{m.userId === user.id ? 'You' : m.user.name}</span>
                  </div>
                  {m.userId !== user.id && (
                    <button 
                      onClick={async () => {
                        if (confirm(`Remove ${m.user.name}?`)) {
                          await removeMember(id, m.userId);
                          refreshData();
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Expense History */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 min-h-[500px]">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Expense History</h3>
            
            {expenses.length === 0 ? (
              <div className="text-center p-10 text-sm text-base-400">
                No expenses logged yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-center group/expense">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm text-white font-medium truncate">{exp.description}</span>
                      <span className="text-xs text-base-400 mt-1 truncate">
                        Paid by <strong className="text-base-200">{exp.paidBy.id === user.id ? 'You' : exp.paidBy.name}</strong> • 
                        {' '}{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-sm font-bold text-white">₹{parseFloat(exp.amount).toFixed(2)}</span>
                        <span className="block text-[10px] text-base-500 uppercase tracking-wide mt-0.5">{exp.splitMethod} split</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingExpense(exp);
                            setActiveModal('expense');
                          }}
                          className="text-xs text-base-400 hover:text-white opacity-0 group-hover/expense:opacity-100 transition-opacity"
                          title="Edit expense"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Delete this expense?')) {
                              await deleteExpense(id, exp.id);
                              refreshData();
                            }
                          }}
                          className="text-xs text-rose-400 opacity-0 group-hover/expense:opacity-100 transition-opacity"
                          title="Delete expense"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- MODALS --- */}
      
      {/* Add Member Modal */}
      {activeModal === 'member' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null) }}>
          <div className="modal-content glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Add Member</h3>
            <form onSubmit={handleAddMember} className="flex flex-col gap-4">
              <div>
                <label className="label">User's Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="friend@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Name (Optional, if they haven't signed up yet)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {activeModal === 'expense' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setActiveModal(null); setEditingExpense(null); } }}>
          <div className="modal-content glass-card p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingExpense ? 'Edit Group Expense' : 'Add Group Expense'}
            </h3>
            <GroupExpenseForm 
              members={group.members}
              initialData={editingExpense}
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              onCancel={() => { setActiveModal(null); setEditingExpense(null); }}
            />
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {activeModal === 'settle' && settleTransfer && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null) }}>
          <div className="modal-content glass-card p-6">
            <SettleUpForm 
              transfer={settleTransfer}
              currentUserId={user.id}
              onConfirm={handleSettleUp}
              onCancel={() => { setActiveModal(null); setSettleTransfer(null); }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
