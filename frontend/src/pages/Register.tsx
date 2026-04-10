import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRole } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateFields() {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = t('register.error.firstname');
    if (!lastName.trim()) errors.lastName = t('register.error.lastname');
    if (!email.trim()) {
      errors.email = t('register.error.email.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('register.error.email.invalid');
    }
    if (!password) {
      errors.password = t('register.error.password.required');
    } else if (password.length < 14) {
      errors.password = t('register.error.password.length');
    }
    if (!confirmPassword) {
      errors.confirmPassword = t('register.error.confirm.required');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('register.error.match');
    }
    return errors;
  }

  const fieldErrors = validateFields();
  const hasErrors = Object.keys(fieldErrors).length > 0;

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function err(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (hasErrors) return;

    setLoading(true);
    try {
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => null);
        const msg = Array.isArray(data)
          ? data.map((e: { description: string }) => e.description).join(' ')
          : t('register.error.failed');
        setServerError(msg);
        return;
      }

      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        navigate('/login');
        return;
      }

      const { token } = await loginRes.json();
      login(token);
      navigate(getRole() === 'Admin' ? '/admin-dashboard' : '/donor-dashboard');
    } catch {
      setServerError(t('register.error.server'));
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
              {t('register.back')}
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
              {t('register.heading')}
            </h1>
            <p className="text-on-surface-variant mb-8">
              {t('register.subheading')}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    {t('register.firstname')}
                  </label>
                  <input
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); touch('firstName'); }}
                    onBlur={() => touch('firstName')}
                    className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${err('firstName') ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {err('firstName') && <p className="text-red-500 text-xs mt-1">{err('firstName')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                    {t('register.lastname')}
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); touch('lastName'); }}
                    onBlur={() => touch('lastName')}
                    className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${err('lastName') ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {err('lastName') && <p className="text-red-500 text-xs mt-1">{err('lastName')}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  {t('register.email')}
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); touch('email'); }}
                  onBlur={() => touch('email')}
                  className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${err('email') ? 'border-red-400' : 'border-slate-200'}`}
                />
                {err('email') && <p className="text-red-500 text-xs mt-1">{err('email')}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  {t('register.password')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); touch('password'); touch('confirmPassword'); }}
                  onBlur={() => touch('password')}
                  className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${err('password') ? 'border-red-400' : 'border-slate-200'}`}
                />
                {err('password') && <p className="text-red-500 text-xs mt-1">{err('password')}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  {t('register.confirm')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); touch('confirmPassword'); }}
                  onBlur={() => touch('confirmPassword')}
                  className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${err('confirmPassword') ? 'border-red-400' : 'border-slate-200'}`}
                />
                {err('confirmPassword') && <p className="text-red-500 text-xs mt-1">{err('confirmPassword')}</p>}
              </div>

              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="aurora-gradient text-white w-full py-3.5 rounded-[0.75rem] font-manrope font-bold shadow-[0_4px_16px_rgba(0,63,135,0.35)] hover:opacity-90 active:scale-[0.97] transition-all mt-2 disabled:opacity-60"
              >
                {loading ? t('register.creating') : t('register.submit')}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-on-surface-variant font-medium">{t('register.orwith')}</span>
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
              {t('register.hasaccount')}{' '}
              <Link to="/login" className="font-semibold text-primary hover:opacity-80 transition">
                {t('register.signin')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right branding panel */}
      <div className="hidden lg:flex lg:w-1/2 aurora-gradient flex-col p-12 relative overflow-hidden">
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
        <div className="relative z-10 flex-1 flex items-center">
          <div className="space-y-6">
            <h2 className="font-manrope font-bold text-4xl text-white leading-tight">
              {t('register.brand.heading')}
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              {t('register.brand.sub')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
