import { useState, useCallback } from 'react';
import api from '../api/client';

export function useInsights() {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingImpulse, setLoadingImpulse] = useState(false);
  const [error, setError] = useState(null);

  const getSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await api.insights.getSummary();
      setError(null);
      return data.summary;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const getForecast = useCallback(async () => {
    setLoadingForecast(true);
    try {
      const data = await api.insights.getForecast();
      setError(null);
      return data.forecast;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  const getRecommendations = useCallback(async (priorities, savingsGoal) => {
    setLoadingRecommendations(true);
    try {
      const data = await api.insights.getRecommendations({ priorities, savingsGoal });
      setError(null);
      return data.recommendations;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const checkImpulse = useCallback(async (amount, category, priorities) => {
    setLoadingImpulse(true);
    try {
      const data = await api.insights.checkImpulse({ amount, category, priorities });
      setError(null);
      return data.verdict;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingImpulse(false);
    }
  }, []);

  return {
    loadingSummary,
    loadingForecast,
    loadingRecommendations,
    loadingImpulse,
    error,
    getSummary,
    getForecast,
    getRecommendations,
    checkImpulse,
  };
}
