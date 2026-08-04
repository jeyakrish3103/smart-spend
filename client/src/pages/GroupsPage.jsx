// =============================================================================
// GroupsPage
// =============================================================================
// Displays a list of all groups the user is a member of.
// Allows creating new groups.
// =============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';

export default function GroupsPage() {
  const { groups, loading, error, loadGroups, createGroup } = useGroups();
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newGroupName.trim()) return;

    setAddLoading(true);
    try {
      await createGroup(newGroupName.trim());
      setIsAdding(false);
      setNewGroupName('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Actions */}
      <div className="flex justify-end mb-2">
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">
          + New Group
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="text-6xl mb-4">🏝️</div>
          <h3 className="text-xl font-bold text-white mb-2">No groups yet</h3>
          <p className="text-base-400 mb-6">Create a group to start splitting expenses.</p>
          <button onClick={() => setIsAdding(true)} className="btn btn-primary">
            Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="glass-card p-5 glass-card-hover flex flex-col gap-4"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white truncate pr-2">{group.name}</h3>
                <span className="text-2xl">🌍</span>
              </div>
              
              <div className="flex -space-x-2">
                {group.members.map((m, i) => (
                  <div
                    key={m.userId}
                    className="w-8 h-8 rounded-full bg-base-700 border-2 border-base-900 flex items-center justify-center text-xs font-bold text-white"
                    title={m.user.name}
                    style={{ zIndex: 10 - i }}
                  >
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {group._count.members > 5 && (
                  <div className="w-8 h-8 rounded-full bg-base-800 border-2 border-base-900 flex items-center justify-center text-[10px] font-bold text-base-400 z-0">
                    +{group._count.members - 5}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-auto">
                <span className="text-xs text-base-400">{group._count.expenses} expenses</span>
                <span className="text-xs font-medium text-accent-400">View balances →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isAdding && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAdding(false) }}>
          <div className="modal-content glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
            
            {addError && (
              <div className="alert-banner alert-danger mb-4">
                <span>⚠</span>
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="label">Group Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Goa Trip 2024"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className="btn btn-primary flex-1">
                  {addLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
