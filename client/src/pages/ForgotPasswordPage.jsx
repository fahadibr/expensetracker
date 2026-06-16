import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900">{sent ? 'Check your email' : 'Forgot password?'}</h2>
          <p className="text-surface-400 mt-1">{sent ? 'We sent a reset link to your email' : 'Enter your email to reset your password'}</p>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg disabled:opacity-50 cursor-pointer">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-surface-500 mb-6">If an account exists with <strong>{email}</strong>, you'll receive a reset link shortly.</p>
          </div>
        )}
        <p className="text-center mt-8 text-sm text-surface-400">
          <Link to="/login" className="text-primary-600 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
