import { useState, useCallback } from 'react';
import api from '../api/client';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/categories');
      setCategories(data.categories);
      return data.categories;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData) => {
    const data = await api.post('/categories', categoryData);
    return data.category;
  }, []);

  const updateCategory = useCallback(async (id, categoryData) => {
    const data = await api.put(`/categories/${id}`, categoryData);
    return data.category;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await api.delete(`/categories/${id}`);
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
