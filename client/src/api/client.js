import axios from 'axios';

// When running as Capacitor app, use the deployed server URL
// When running in browser, use relative /api path (proxied by nginx/vite)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
const API_BASE = isCapacitor
  ? 'https://expensetrack-kz55.onrender.com/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: !isCapacitor, // cookies only work in browser, not Capacitor
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token for Capacitor (cookies don't work cross-origin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
