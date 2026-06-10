// ============================================================
// API UTILITY - Communicates with Express backend
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const session = JSON.parse(localStorage.getItem('navkar_session') || '{}');
  return session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const api = {
  get: async (path, params = {}) => {
    const url = new URL(`${API_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const res = await fetch(url, { headers: { ...getAuthHeaders() } });
    return handleResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  put: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  upload: async (path, formData) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }, // No Content-Type for multipart
      body: formData
    });
    return handleResponse(res);
  },

  getDownloadUrl: (path) => `${API_URL}${path}`,

  // Direct backend URL (for redirect testing)
  getBackendUrl: (path) => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${base}${path}`;
  }
};

export default api;
