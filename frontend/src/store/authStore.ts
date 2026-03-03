import { create } from 'zustand';
import { CurrentUser, UserRole } from '../services/models';

interface AuthState {
  user: CurrentUser;
  setRole: (role: UserRole) => void;
}

const defaultUser: CurrentUser = {
  id: 'u-demo',
  name: 'Demo Operator',
  email: 'demo@naas.dev',
  role: 'admin',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: defaultUser,
  setRole: (role) => set((state) => ({ user: { ...state.user, role } })),
}));
