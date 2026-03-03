import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { naasApi } from '../services/dataApi';
import { DigestConfig, Rule, Subscription, Team, Template } from '../services/models';

const keys = {
  dashboardStats: ['dashboard-stats'] as const,
  activity: ['activity'] as const,
  teams: ['teams'] as const,
  templates: ['templates'] as const,
  rules: ['rules'] as const,
  ruleGroups: ['rule-groups'] as const,
  triggers: ['triggers'] as const,
  subscriptions: ['subscriptions'] as const,
  systemAlerts: ['system-alerts'] as const,
  auditLogs: ['audit-logs'] as const,
  digestConfig: ['digest-config'] as const,
};

export const useDashboardStats = () => useQuery({ queryKey: keys.dashboardStats, queryFn: naasApi.getDashboardStats });
export const useRecentActivity = () => useQuery({ queryKey: keys.activity, queryFn: naasApi.getRecentActivity });
export const useTeams = () => useQuery({ queryKey: keys.teams, queryFn: naasApi.getTeams });
export const useTemplates = () => useQuery({ queryKey: keys.templates, queryFn: naasApi.getTemplates });
export const useRules = () => useQuery({ queryKey: keys.rules, queryFn: naasApi.getRules });
export const useRuleGroups = () => useQuery({ queryKey: keys.ruleGroups, queryFn: naasApi.getRuleGroups });
export const useTriggers = () => useQuery({ queryKey: keys.triggers, queryFn: naasApi.getTriggers });
export const useSubscriptions = () => useQuery({ queryKey: keys.subscriptions, queryFn: naasApi.getSubscriptions });
export const useSystemAlerts = () => useQuery({ queryKey: keys.systemAlerts, queryFn: naasApi.getSystemAlerts });
export const useAuditLogs = () => useQuery({ queryKey: keys.auditLogs, queryFn: naasApi.getAuditLogs });
export const useDigestConfig = () => useQuery({ queryKey: keys.digestConfig, queryFn: naasApi.getDigestConfig });

export const useTeamMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.teams }),
      queryClient.invalidateQueries({ queryKey: keys.dashboardStats }),
      queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
    ]);
  };

  return {
    createTeam: useMutation({
      mutationFn: (payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => naasApi.createTeam(payload),
      onSuccess: invalidate,
    }),
    updateTeam: useMutation({
      mutationFn: (payload: Team) => naasApi.updateTeam(payload),
      onSuccess: invalidate,
    }),
    deleteTeam: useMutation({
      mutationFn: (id: string) => naasApi.deleteTeam(id),
      onSuccess: invalidate,
    }),
  };
};

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();
  return {
    updateTemplate: useMutation({
      mutationFn: (payload: Template) => naasApi.updateTemplate(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.templates }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
  };
};

export const useRuleMutations = () => {
  const queryClient = useQueryClient();
  return {
    createRule: useMutation({
      mutationFn: (payload: Omit<Rule, 'id' | 'updatedAt'>) => naasApi.createRule(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.rules }),
          queryClient.invalidateQueries({ queryKey: keys.dashboardStats }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
    updateRule: useMutation({
      mutationFn: (payload: Rule) => naasApi.updateRule(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.rules }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
    deleteRule: useMutation({
      mutationFn: (id: string) => naasApi.deleteRule(id),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.rules }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
  };
};

export const useSubscriptionMutations = () => {
  const queryClient = useQueryClient();
  return {
    createSubscription: useMutation({
      mutationFn: (payload: Omit<Subscription, 'id' | 'createdAt'>) => naasApi.createSubscription(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.subscriptions }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
    updateSubscription: useMutation({
      mutationFn: (payload: Subscription) => naasApi.updateSubscription(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.subscriptions }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
  };
};

export const useDigestMutations = () => {
  const queryClient = useQueryClient();
  return {
    updateDigestConfig: useMutation({
      mutationFn: (payload: DigestConfig) => naasApi.updateDigestConfig(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: keys.digestConfig }),
          queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
        ]);
      },
    }),
  };
};
