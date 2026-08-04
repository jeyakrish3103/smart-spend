import { useState, useEffect, useCallback } from 'react';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import { useExpenses } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';

export default function ExpensesPage() {
  const {
    expenses,
    pagination,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    exportCSV,
  } = useExpenses();

  const { categories, fetchCategories, loading: catLoading } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    page: 1,
  });

  const loadExpenses = useCallback(() => {
    fetchExpenses(filters);
  }, [fetchExpenses, filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (data) => {
    await createExpense(data);
    loadExpenses();
  };

  const handleUpdate = async (data) => {
    await updateExpense(editingExpense.id, data);
    loadExpenses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteExpense(id);
    loadExpenses();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCSV(filters);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex justify-end mb-2">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary btn-sm"
            disabled={exporting}
            id="export-csv-button"
          >
            {exporting ? (
              <span className="spinner" style={{ width: 14, height: 14 }}></span>
            ) : (
              '📥'
            )}{' '}
            Export CSV
          </button>
          <button
            onClick={() => { setEditingExpense(null); setShowForm(true); }}
            className="btn btn-primary btn-sm"
            id="add-expense-button"
          >
            ＋ Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4" style={{ marginTop: '2rem', marginBottom: '2rem', width: '100%' }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="label" htmlFor="filter-start-date">From</label>
            <input
              id="filter-start-date"
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label" htmlFor="filter-end-date">To</label>
            <input
              id="filter-end-date"
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label" htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              className="input"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          {(filters.startDate || filters.endDate || filters.categoryId) && (
            <button
              onClick={() =>
                setFilters({ startDate: '', endDate: '', categoryId: '', page: 1 })
              }
              className="btn btn-ghost btn-sm"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Expense list */}
      <ExpenseList
        expenses={expenses}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Expense form modal */}
      {showForm && (
        <ExpenseForm
          categories={categories}
          onSubmit={editingExpense ? handleUpdate : handleCreate}
          onClose={handleCloseForm}
          initialData={editingExpense}
          loading={catLoading}
        />
      )}
    </div>
  );
}
