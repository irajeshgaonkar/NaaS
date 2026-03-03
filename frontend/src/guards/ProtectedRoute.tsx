import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../services/models';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: JSX.Element;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const role = useAuthStore((state) => state.user.role);
  const location = useLocation();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
};
