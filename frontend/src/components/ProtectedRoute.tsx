import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getRole } from '../utils/auth';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Donor';
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && getRole() !== requiredRole) {
    // Logged in but wrong role — send to their own dashboard
    const role = getRole();
    return <Navigate to={role === 'Admin' ? '/admin-dashboard' : '/donor-dashboard'} replace />;
  }

  return <>{children}</>;
}
