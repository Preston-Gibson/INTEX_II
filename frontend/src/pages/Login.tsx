import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
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
      setToken(token);
      navigate('/donor-dashboard');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
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
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="aurora-gradient text-white w-full py-3.5 rounded-[0.75rem] font-manrope font-bold shadow-[0_4px_16px_rgba(0,63,135,0.35)] hover:opacity-90 active:scale-[0.97] transition-all mt-2 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
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
    </div>
  );
}
