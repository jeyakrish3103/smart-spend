import { useState, useCallback } from 'react';
import api from '../api/client';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const query = params.toString();
      const data = await api.get(`/expenses${query ? `?${query}` : ''}`);
      setExpenses(data.expenses);
      setPagination(data.pagination);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expenseData) => {
    const data = await api.post('/expenses', expenseData);
    return data.expense;
  }, []);

  const updateExpense = useCallback(async (id, expenseData) => {
    const data = await api.put(`/expenses/${id}`, expenseData);
    return data.expense;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await api.delete(`/expenses/${id}`);
  }, []);

  const extractReceipt = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return await api.post('/expenses/extract', formData);
  }, []);

  const exportCSV = useCallback(async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);

    const query = params.toString();
    const res = await api.download(`/expenses/export${query ? `?${query}` : ''}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    expenses,
    pagination,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    exportCSV,
    extractReceipt,
  };
}
