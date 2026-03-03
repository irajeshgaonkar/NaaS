import { useAuthStore } from '../store/authStore';
import type { UserRole } from './models';

const apiMode = (import.meta.env.VITE_API_MODE as string | undefined)?.toLowerCase() ?? 'mock';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const defaultTeamId = (import.meta.env.VITE_DEFAULT_TEAM_ID as string | undefined) ?? 'team-platform';

const roleMap: Record<UserRole, string> = {
  admin: 'NotificationAdmin',
  manager: 'NotificationManager',
  user: 'NotificationUser',
};

const teamScopes = ['team-platform', 'team-security', 'team-finops'];

const getAuthHeaderValue = () => {
  const { user } = useAuthStore.getState();
  const backendRole = roleMap[user.role];
  return `Bearer ${user.email}|${backendRole}|${teamScopes.join(',')}`;
};

export const runtimeConfig = {
  apiMode,
  apiBaseUrl,
  defaultTeamId,
  useBackend: apiMode === 'backend' && !!apiBaseUrl,
};

export const apiRequest = async <T>(path: string, init?: RequestInit & { teamId?: string }): Promise<T> => {
  if (!runtimeConfig.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeaderValue(),
      'x-team-id': init?.teamId ?? runtimeConfig.defaultTeamId,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }

  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
};
