import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="text-center animate-fade-in max-w-md">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-pulse"><span className="text-3xl">📧</span></div>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Verifying your email...</h2>
            <p className="text-surface-400">Please wait while we verify your email address.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-success-light flex items-center justify-center mx-auto mb-6"><span className="text-3xl">✅</span></div>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Email Verified!</h2>
            <p className="text-surface-400 mb-6">Your account is now active. You can log in.</p>
            <Link to="/login" className="inline-block px-8 py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mx-auto mb-6"><span className="text-3xl">❌</span></div>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Verification Failed</h2>
            <p className="text-surface-400 mb-6">The link is invalid or has expired.</p>
            <Link to="/login" className="inline-block px-8 py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
