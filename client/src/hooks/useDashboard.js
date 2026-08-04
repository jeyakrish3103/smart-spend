import { useState, useCallback } from 'react';
import api from '../api/client';

export function useDashboard() {
  const [summary, setSummary] = useState({ weeklySpend: 0, monthlySpend: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [spendOverTime, setSpendOverTime] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.get('/dashboard/summary');
      setSummary(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchCategoryBreakdown = useCallback(async (period = 'month') => {
    try {
      const data = await api.get(`/dashboard/category-breakdown?period=${period}`);
      setCategoryBreakdown(data.breakdown);
      return data.breakdown;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchSpendOverTime = useCallback(async (range = 'month') => {
    try {
      const data = await api.get(`/dashboard/spend-over-time?range=${range}`);
      setSpendOverTime(data.data);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchAll = useCallback(async (breakdownPeriod = 'month', spendRange = 'month') => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSummary(),
        fetchCategoryBreakdown(breakdownPeriod),
        fetchSpendOverTime(spendRange),
      ]);
    } catch (err) {
      // individual errors already handled
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, fetchCategoryBreakdown, fetchSpendOverTime]);

  return {
    summary,
    categoryBreakdown,
    spendOverTime,
    loading,
    error,
    fetchSummary,
    fetchCategoryBreakdown,
    fetchSpendOverTime,
    fetchAll,
  };
}
