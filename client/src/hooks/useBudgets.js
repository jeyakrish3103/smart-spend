import { useState, useCallback } from 'react';
import api from '../api/client';

export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [budgetStatuses, setBudgetStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/budgets');
      setBudgets(data.budgets);
      return data.budgets;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBudgetStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/budgets/status');
      setBudgetStatuses(data.budgets);
      return data.budgets;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (budgetData) => {
    const data = await api.post('/budgets', budgetData);
    return data.budget;
  }, []);

  const updateBudget = useCallback(async (id, budgetData) => {
    const data = await api.put(`/budgets/${id}`, budgetData);
    return data.budget;
  }, []);

  const deleteBudget = useCallback(async (id) => {
    await api.delete(`/budgets/${id}`);
  }, []);

  return {
    budgets,
    budgetStatuses,
    loading,
    error,
    fetchBudgets,
    fetchBudgetStatuses,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
