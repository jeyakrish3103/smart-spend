// =============================================================================
// useCalendar Hook
// =============================================================================
// Encapsulates logic for Google Calendar integration

import { useState, useCallback } from 'react';
import api from '../api/client';

export function useCalendar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Check if calendar is connected
  const checkStatus = useCallback(async () => {
    try {
      const data = await api.get('/calendar/status');
      setIsConnected(data.connected);
      return data.connected;
    } catch (err) {
      console.error('Failed to check calendar status', err);
      return false;
    }
  }, []);

  // Get Auth URL to redirect user to Google
  const connectCalendar = async () => {
    setLoading(true);
    try {
      const data = await api.get('/calendar/auth-url');
      // Redirect user to Google OAuth screen
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Disconnect Calendar
  const disconnectCalendar = async () => {
    setLoading(true);
    try {
      await api.delete('/calendar/disconnect');
      setIsConnected(false);
      setSuggestions([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions
  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/calendar/suggestions');
      setSuggestions(data.suggestions || []);
      setError(null);
    } catch (err) {
      // Don't throw loudly for expired tokens, just set error state
      setError(err.message);
      if (err.message.includes('expired') || err.message.includes('reconnect')) {
        setIsConnected(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a suggestion from UI after logging it
  const removeSuggestion = (eventId) => {
    setSuggestions(prev => prev.filter(s => s.eventId !== eventId));
  };

  return {
    loading,
    error,
    isConnected,
    suggestions,
    checkStatus,
    connectCalendar,
    disconnectCalendar,
    loadSuggestions,
    removeSuggestion,
  };
}
