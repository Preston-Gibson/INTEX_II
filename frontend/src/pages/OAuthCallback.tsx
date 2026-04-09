import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRole } from '../utils/auth';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      login(token);
      navigate(getRole() === 'Admin' ? '/admin-dashboard' : '/donor-dashboard', { replace: true });
    } else {
      navigate(`/login?error=${error ?? 'oauth_failed'}`, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-on-surface-variant text-sm">Signing you in…</p>
    </div>
  );
}
