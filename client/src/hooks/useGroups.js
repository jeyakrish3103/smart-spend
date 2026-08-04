// =============================================================================
// useGroups Hook
// =============================================================================
// This hook encapsulates all API calls for Group Expenses.
// By keeping this logic here, our UI components stay clean and don't need
// to know how to talk to the backend directly.
//
// KEY PATTERNS:
// - We use our custom `api` client (which automatically adds the JWT token)
// - We return both state (groups, loading, error) and functions to mutate data.
// - `loadGroupData` fetches both the group details AND the computed balances
//   in parallel using Promise.all() for better performance.
// =============================================================================

import { useState, useCallback } from 'react';
import api from '../api/client';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all groups the user belongs to
  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/groups');
      setGroups(data.groups);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new group
  const createGroup = async (name) => {
    try {
      const data = await api.post('/groups', { name });
      // Prepend the new group to our local state so the UI updates instantly
      setGroups((prev) => [data.group, ...prev]);
      return data.group;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Delete a group
  const deleteGroup = async (groupId) => {
    try {
      await api.delete(`/groups/${groupId}`);
      setGroups((prev) => prev.filter(g => g.id !== groupId));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // -------------------------------------------------------------------------
  // Single Group Operations (used on the Group Detail page)
  // -------------------------------------------------------------------------

  // Fetch group details, expenses, and balances all at once
  const loadGroupData = useCallback(async (groupId) => {
    try {
      // Promise.all runs these requests simultaneously!
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/expenses`),
        api.get(`/groups/${groupId}/balances`),
      ]);

      return {
        group: groupRes.group,
        totalSpend: groupRes.totalSpend,
        expenses: expensesRes.expenses,
        balances: balancesRes.balances,
        transfers: balancesRes.transfers,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  }, []);

  // Add a member by email and optional name
  const addMember = async (groupId, { email, name }) => {
    try {
      const data = await api.post(`/groups/${groupId}/members`, { email, name });
      return data.member;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Remove a member by userId
  const removeMember = async (groupId, userId) => {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Add a shared expense
  const addExpense = async (groupId, expenseData) => {
    try {
      const data = await api.post(`/groups/${groupId}/expenses`, expenseData);
      return data.expense;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Update a shared expense
  const updateExpense = async (groupId, expenseId, expenseData) => {
    try {
      const data = await api.groups.updateExpense(groupId, expenseId, expenseData);
      return data.expense;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Delete a shared expense
  const deleteExpense = async (groupId, expenseId) => {
    try {
      await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // Record a settlement (mark debt as paid)
  const settleUp = async (groupId, fromUserId, toUserId, amount) => {
    try {
      const data = await api.post(`/groups/${groupId}/settle`, { fromUserId, toUserId, amount });
      return data.settlement;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    loadGroupData,
    addMember,
    removeMember,
    addExpense,
    updateExpense,
    deleteExpense,
    settleUp,
    deleteGroup,
  };
}
