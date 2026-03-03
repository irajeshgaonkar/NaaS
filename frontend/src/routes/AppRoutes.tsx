import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CircularProgress, Stack } from '@mui/material';
import { AppLayout } from '../layout/AppLayout';
import { ProtectedRoute } from '../guards/ProtectedRoute';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const TeamsPage = lazy(() => import('../features/teams/TeamsPage'));
const TemplatesPage = lazy(() => import('../features/templates/TemplatesPage'));
const RulesPage = lazy(() => import('../features/rules/RulesPage'));
const RuleGroupsPage = lazy(() => import('../features/rules/RuleGroupsPage'));
const TriggersPage = lazy(() => import('../features/rules/TriggersPage'));
const SubscriptionsPage = lazy(() => import('../features/subscriptions/SubscriptionsPage'));
const SystemAlertsPage = lazy(() => import('../features/system-alerts/SystemAlertsPage'));
const DigestConfigurationPage = lazy(() => import('../features/digest/DigestConfigurationPage'));
const AuditLogsPage = lazy(() => import('../features/audit/AuditLogsPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('../features/not-found/NotFoundPage'));

const LoadingScreen = () => (
  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
    <CircularProgress size={28} />
  </Stack>
);

export const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/rule-groups" element={<RuleGroupsPage />} />
        <Route
          path="/triggers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <TriggersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route
          path="/system-alerts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <SystemAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/digest-configuration"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <DigestConfigurationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);
