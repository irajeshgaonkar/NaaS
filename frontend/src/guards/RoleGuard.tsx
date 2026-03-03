import { ReactNode } from 'react';
import { Alert } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../services/models';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallbackMessage?: string;
}

export const RoleGuard = ({ allowedRoles, children, fallbackMessage }: RoleGuardProps) => {
  const role = useAuthStore((state) => state.user.role);

  if (!allowedRoles.includes(role)) {
    return <Alert severity="info">{fallbackMessage ?? 'Read-only access for your role.'}</Alert>;
  }

  return <>{children}</>;
};
