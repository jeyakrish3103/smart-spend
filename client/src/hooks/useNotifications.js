// =============================================================================
// useNotifications Hook (with Polling)
// =============================================================================
// Handles fetching notifications and keeping the unread count up to date.
//
// KEY PATTERNS:
// - `useEffect` is used to set up a polling interval (setInterval) that runs
//   every 30 seconds to check for new notifications in the background.
// - It cleans up the interval (`clearInterval`) when the component unmounts
//   to prevent memory leaks.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Only poll if we have a logged-in user

  // Fetch the count of unread notifications (fast, lightweight query)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch notification count', err);
    }
  }, [user]);

  // Fetch the actual list of notifications (full details)
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Optimistically update the UI locally without waiting for another fetch
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  // Set up background polling
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Fetch immediately on mount
    fetchUnreadCount();

    // Then poll every 30 seconds (30000 ms)
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    // Cleanup function: runs when the component using this hook unmounts
    return () => clearInterval(intervalId);
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshCount: fetchUnreadCount,
  };
}
