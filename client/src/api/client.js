import axios from 'axios';

// When running as Capacitor app, use the deployed server URL
// When running in browser, use relative /api path (proxied by nginx/vite)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
const API_BASE = isCapacitor
  ? (import.meta.env.VITE_API_URL || 'https://expensetrack.onrender.com') + '/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
