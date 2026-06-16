import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = params.get('token');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Invalid Reset Link</h2>
          <Link to="/forgot-password" className="text-primary-600 font-medium">Request a new one</Link>
        </div>
      </div>
    );
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Set new password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="New password" className={inputCls} />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Confirm password" className={inputCls} />
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg disabled:opacity-50 cursor-pointer">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
