import { useState, useEffect } from 'react';
import BudgetCard from '../components/BudgetCard';
import BudgetForm from '../components/BudgetForm';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';

export default function BudgetsPage() {
  const {
    budgetStatuses,
    loading,
    fetchBudgetStatuses,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();

  const { categories, fetchCategories } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    fetchBudgetStatuses();
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (data) => {
    await createBudget(data);
    await fetchBudgetStatuses();
  };

  const handleUpdate = async (data) => {
    await updateBudget(editingBudget.id, data);
    await fetchBudgetStatuses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    await deleteBudget(id);
    await fetchBudgetStatuses();
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  // Group by alert level for visual hierarchy
  const exceeded = budgetStatuses.filter((b) => b.alertLevel === 'exceeded');
  const warning = budgetStatuses.filter((b) => b.alertLevel === 'warning');
  const ok = budgetStatuses.filter((b) => b.alertLevel === 'ok');

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => { setEditingBudget(null); setShowForm(true); }}
          className="btn btn-primary btn-sm"
          id="add-budget-button"
        >
          ＋ Set Budget
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : budgetStatuses.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-3">
          <span className="text-5xl">🎯</span>
          <p className="text-lg font-medium" style={{ color: 'var(--color-base-200)' }}>
            No budgets set yet
          </p>
          <p className="text-sm text-center max-w-md" style={{ color: 'var(--color-base-400)' }}>
            Set spending limits for categories or overall to track your progress and receive alerts when you're nearing your limit.
          </p>
          <button
            onClick={() => { setEditingBudget(null); setShowForm(true); }}
            className="btn btn-primary mt-2"
          >
            Set Your First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exceeded budgets */}
          {exceeded.length > 0 && (
            <section>
              <h2
                className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-rose-400)' }}
              >
                🔴 Over Budget ({exceeded.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exceeded.map((b) => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Warning budgets */}
          {warning.length > 0 && (
            <section>
              <h2
                className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-amber-400)' }}
              >
                🟡 Nearing Limit ({warning.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warning.map((b) => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* OK budgets */}
          {ok.length > 0 && (
            <section>
              <h2
                className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-accent-400)' }}
              >
                🟢 On Track ({ok.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ok.map((b) => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Budget form modal */}
      {showForm && (
        <BudgetForm
          categories={categories}
          onSubmit={editingBudget ? handleUpdate : handleCreate}
          onClose={handleCloseForm}
          initialData={editingBudget}
        />
      )}
    </div>
  );
}
