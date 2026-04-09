import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getRole } from '../utils/auth';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Donor' | ('Admin' | 'Donor')[];
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole) {
    const role = getRole();
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !allowed.includes(role as 'Admin' | 'Donor')) {
      return <Navigate to={role === 'Admin' ? '/admin-dashboard' : '/donor-dashboard'} replace />;
    }
  }

  return <>{children}</>;
}
