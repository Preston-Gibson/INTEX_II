import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Invalid email or password.');
        return;
      }
      const { token } = await res.json();
      login(token);
      navigate('/donor-dashboard');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left form panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to home
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="text-2xl font-manrope font-bold text-primary">
              Lucera
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,63,135,0.1)] p-10">
            <h1 className="font-manrope font-bold text-3xl text-primary mb-2">
              Welcome back
            </h1>
            <p className="text-on-surface-variant mb-8">
              Sign in to your Lucera account
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-on-surface-variant">
                    Password
                  </label>
                  <a href="#" className="text-sm font-semibold text-primary hover:opacity-80 transition">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-container-low border border-slate-200 rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="aurora-gradient text-white w-full py-3.5 rounded-[0.75rem] font-manrope font-bold shadow-[0_4px_16px_rgba(0,63,135,0.35)] hover:opacity-90 active:scale-[0.97] transition-all mt-2 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-on-surface-variant font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* OAuth buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`${API_URL}/api/auth/external-login?provider=Google`}
                  className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </a>
                <a
                  href={`${API_URL}/api/auth/external-login?provider=Microsoft`}
                  className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  Microsoft
                </a>
              </div>
            </form>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:opacity-80 transition">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right branding panel */}
      <div className="hidden lg:flex lg:w-1/2 aurora-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Dot-grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-manrope font-bold text-white tracking-tight">
            Lucera
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-base">favorite</span>
            Transforming lives together
          </div>
          <h2 className="font-manrope font-bold text-4xl text-white leading-tight">
            Empowering families.<br />Building futures.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            Your work makes a measurable difference. Sign in to track impact, manage cases, and connect with the community.
          </p>
        </div>

        {/* Quote card */}
        <div className="relative z-10 bg-white/15 backdrop-blur-sm rounded-[1.25rem] p-6 border border-white/20">
          <p className="text-white/90 italic text-sm leading-relaxed">
            "Lucera has helped us reach families we never could have before. Every data point represents a life changed."
          </p>
          <p className="text-white/60 text-xs mt-3 font-semibold">— Field Case Manager</p>
        </div>
      </div>
    </div>
  );
}
