import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    if (res.data.token) localStorage.setItem('auth_token', res.data.token);
    return res.data;
  }

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
