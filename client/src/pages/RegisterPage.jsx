import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Check your email to verify your account!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 
    text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 
    focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Create account</h2>
          <p className="text-surface-400 mt-1">Start managing your finances</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-surface-600 mb-1.5">Full Name</label>
            <input id="reg-name" type="text" value={form.name} onChange={e => update('name', e.target.value)} required className={inputCls} placeholder="Fahad Ahmed" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-surface-600 mb-1.5">Email</label>
            <input id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required className={inputCls} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="reg-pass" className="block text-sm font-medium text-surface-600 mb-1.5">Password</label>
            <input id="reg-pass" type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} className={inputCls} placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-surface-600 mb-1.5">Confirm Password</label>
            <input id="reg-confirm" type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} required className={inputCls} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200 cursor-pointer">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-8 text-sm text-surface-400">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
