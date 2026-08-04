const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Lightweight fetch wrapper for the SmartSpend API.
 * - Auto-attaches JWT from localStorage
 * - Returns parsed JSON or throws structured errors
 * - Handles 401 by clearing auth and redirecting to login
 */

// We export api so AuthContext can override this getter
let getTokenFn = async () => null;

function setTokenGetter(fn) {
  getTokenFn = fn;
}

async function getToken() {
  return await getTokenFn();
}

function clearToken() {
  // handled by Clerk
}

async function request(endpoint, options = {}) {
  const { body, method = 'GET', headers = {}, raw = false } = options;

  const token = await getToken();
  const config = {
    method,
    headers: {
      ...(body && !raw && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && !raw) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);

  // Handle 401
  if (res.status === 401) {
    throw new Error('Session expired or unauthorized.');
  }

  // For CSV/blob downloads, return the raw response
  if (raw) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res;
  }

  const data = await res.json();

  if (!res.ok) {
    // Express-validator returns { errors: [...] }
    // Our routes return { error: "..." }
    const message =
      data.errors?.map((e) => e.msg).join(', ') ||
      data.error ||
      'Something went wrong';
    throw new Error(message);
  }

  return data;
}

// Convenience methods
const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  download: (endpoint) => request(endpoint, { raw: true }),
  groups: {
    getAll: () => api.get('/groups'),
    getById: (id) => api.get(`/groups/${id}`),
    create: (data) => api.post('/groups', data),
    addMember: (id, data) => api.post(`/groups/${id}/members`, data),
    removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}`),
    addExpense: (id, data) => api.post(`/groups/${id}/expenses`, data),
    updateExpense: (id, expenseId, data) => api.put(`/groups/${id}/expenses/${expenseId}`, data),
    updateGroupExpense: (id, expenseId, data) => api.put(`/groups/${id}/expenses/${expenseId}`, data),
    deleteExpense: (id, expenseId) => api.delete(`/groups/${id}/expenses/${expenseId}`),
    getBalances: (id) => api.get(`/groups/${id}/balances`),
    settleUp: (id, data) => api.post(`/groups/${id}/settle`, data),
  },
  insights: {
    getSummary: () => api.get('/insights/summary'),
    getForecast: () => api.get('/insights/forecast'),
    getRecommendations: (data) => api.post('/insights/recommendations', data),
    checkImpulse: (data) => api.post('/insights/impulse', data),
  },
  getToken,
  setTokenGetter,
  clearToken,
};

export default api;
