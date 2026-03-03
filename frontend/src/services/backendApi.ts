import { mockActivity, mockDigestConfig, mockSystemAlerts, mockTriggers } from './mockData';
import type {
  ActivityItem,
  AuditLog,
  DashboardStats,
  DigestConfig,
  Rule,
  RuleGroup,
  Subscription,
  SystemAlert,
  Team,
  Template,
  Trigger,
} from './models';
import { apiRequest, runtimeConfig } from './apiClient';

const toTeam = (raw: any): Team => ({
  id: raw.teamId,
  name: raw.name,
  description: raw.description ?? '',
  accessLevelEnabled: true,
  members: [],
  createdBy: raw.createdBy ?? 'unknown',
  createdAt: raw.createdAt ?? new Date().toISOString(),
  updatedAt: raw.updatedAt ?? new Date().toISOString(),
});

const toRule = (raw: any): Rule => ({
  id: raw.ruleId,
  name: raw.name,
  templateId: raw.templateBinding?.templateId ?? '',
  triggerType: raw.triggerType ?? 'Manual',
  category: 'Info',
  defaultSubscribeForTeams: false,
  isActive: raw.isActive ?? true,
  createdBy: raw.createdBy ?? 'unknown',
  updatedAt: raw.updatedAt ?? new Date().toISOString(),
});

const templateFromMeta = async (raw: any): Promise<Template> => {
  const versionsRes = await apiRequest<{ items: any[] }>(`/artifact/templates/${raw.templateId}/versions`);
  const sorted = (versionsRes.items ?? []).sort((a, b) => b.version - a.version);
  const targetVersion = raw.latestPublishedVersion || raw.latestVersion || sorted[0]?.version || 1;
  const detail = await apiRequest<any>(`/artifact/templates/${raw.templateId}/versions/${targetVersion}`);
  const content = String(detail.content ?? '');

  return {
    id: raw.templateId,
    teamId: raw.teamId,
    name: raw.name,
    category: 'Ops',
    isActive: raw.state === 'PUBLISHED',
    isTeamsAdaptiveCard: raw.channel === 'teams' || raw.channel === 'adaptive',
    useApprovalWorkflow: false,
    emailTemplate: raw.channel === 'email' ? content : '',
    teamsTemplate: raw.channel === 'teams' ? content : '',
    adaptiveCardJson: raw.channel === 'adaptive' ? content : '{\n  "type": "AdaptiveCard"\n}',
    workflowJson: raw.channel === 'actionable' ? content : '{\n  "steps": []\n}',
    placeholders: [],
    createdBy: raw.createdBy ?? 'unknown',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
};

const getAllTeams = async (): Promise<Team[]> => {
  const res = await apiRequest<{ items: any[] }>('/artifact/teams');
  return (res.items ?? []).map(toTeam);
};

const getAllRules = async (teams: Team[]): Promise<Rule[]> => {
  const all = await Promise.all(
    teams.map(async (team) => {
      const res = await apiRequest<{ items: any[] }>(`/artifact/teams/${team.id}/rules`, { teamId: team.id });
      return (res.items ?? []).map(toRule);
    }),
  );
  return all.flat();
};

const getAllRuleGroups = async (teams: Team[]): Promise<RuleGroup[]> => {
  const all = await Promise.all(
    teams.map(async (team) => {
      const res = await apiRequest<{ items: any[] }>(`/artifact/teams/${team.id}/rule-groups`, { teamId: team.id });
      return (res.items ?? []).map((item) => ({
        id: item.ruleGroupId,
        name: item.name,
        description: item.description ?? '',
        ruleIds: item.ruleIds ?? [],
        createdAt: item.createdAt ?? new Date().toISOString(),
      }));
    }),
  );
  return all.flat();
};

const getAllTemplates = async (teams: Team[]): Promise<Template[]> => {
  const metas = await Promise.all(
    teams.map(async (team) => {
      const res = await apiRequest<{ items: any[] }>(`/artifact/teams/${team.id}/templates`, { teamId: team.id });
      return res.items ?? [];
    }),
  );

  const flattened = metas.flat();
  return Promise.all(flattened.map(templateFromMeta));
};

const getAllSubscriptions = async (rules: Rule[]): Promise<Subscription[]> => {
  const all = await Promise.all(
    rules.map(async (rule) => {
      const res = await apiRequest<{ items: any[] }>(`/artifact/rules/${rule.id}/subscriptions`);
      return (res.items ?? []).map((item) => ({
        id: item.subscriptionId,
        scope: item.type,
        scopeId: item.type === 'Team' ? 'team-platform' : 'user',
        ruleId: rule.id,
        emails: item.targets ?? [],
        groupedEmails: !item.sendIndividualEmailsToSubscribers,
        isActive: true,
        createdAt: item.createdAt ?? new Date().toISOString(),
      })) as Subscription[];
    }),
  );
  return all.flat();
};

export const backendNaasApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const teams = await getAllTeams();
    const rules = await getAllRules(teams);
    return {
      totalTeams: teams.length,
      activeRules: rules.filter((r) => r.isActive).length,
      notificationsSent: 0,
      failedNotifications: 0,
    };
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    return mockActivity;
  },

  async getTeams(): Promise<Team[]> {
    return getAllTeams();
  },

  async createTeam(payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const teamId = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await apiRequest('/artifact/teams', {
      method: 'POST',
      body: JSON.stringify({
        teamId,
        name: payload.name,
        description: payload.description,
      }),
    });

    for (const member of payload.members) {
      await apiRequest(`/artifact/teams/${teamId}/members`, {
        method: 'POST',
        teamId,
        body: JSON.stringify({
          email: member.email,
          displayName: member.name,
          role:
            member.role === 'Admin'
              ? 'NotificationAdmin'
              : member.role === 'Manager'
                ? 'NotificationManager'
                : 'NotificationUser',
        }),
      });
    }

    return {
      ...payload,
      id: teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateTeam(payload: Team): Promise<Team> {
    await apiRequest(`/artifact/teams/${payload.id}`, {
      method: 'PATCH',
      teamId: payload.id,
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
      }),
    });

    for (const member of payload.members) {
      await apiRequest(`/artifact/teams/${payload.id}/members`, {
        method: 'POST',
        teamId: payload.id,
        body: JSON.stringify({
          email: member.email,
          displayName: member.name,
          role:
            member.role === 'Admin'
              ? 'NotificationAdmin'
              : member.role === 'Manager'
                ? 'NotificationManager'
                : 'NotificationUser',
        }),
      });
    }

    return { ...payload, updatedAt: new Date().toISOString() };
  },

  async deleteTeam(id: string): Promise<void> {
    await apiRequest(`/artifact/teams/${id}`, { method: 'DELETE', teamId: id });
  },

  async getTemplates(): Promise<Template[]> {
    const teams = await getAllTeams();
    return getAllTemplates(teams);
  },

  async updateTemplate(payload: Template): Promise<Template> {
    await apiRequest(`/artifact/templates/${payload.id}/versions`, {
      method: 'POST',
      teamId: payload.teamId,
      body: JSON.stringify({
        content:
          payload.emailTemplate ||
          payload.teamsTemplate ||
          payload.adaptiveCardJson ||
          payload.workflowJson ||
          '',
        contentType: payload.adaptiveCardJson || payload.workflowJson ? 'application/json' : 'text/markdown',
      }),
    });

    const versions = await apiRequest<{ items: any[] }>(`/artifact/templates/${payload.id}/versions`, {
      teamId: payload.teamId,
    });
    const latest = [...(versions.items ?? [])].sort((a, b) => b.version - a.version)[0];
    if (payload.isActive && latest?.version) {
      await apiRequest(`/artifact/templates/${payload.id}/versions/${latest.version}/publish`, {
        method: 'POST',
        teamId: payload.teamId,
      });
    }

    return { ...payload, updatedAt: new Date().toISOString() };
  },

  async getRules(): Promise<Rule[]> {
    const teams = await getAllTeams();
    return getAllRules(teams);
  },

  async createRule(payload: Omit<Rule, 'id' | 'updatedAt'>): Promise<Rule> {
    const teamId = runtimeConfig.defaultTeamId;
    const ruleId = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await apiRequest(`/artifact/teams/${teamId}/rules`, {
      method: 'POST',
      teamId,
      body: JSON.stringify({
        ruleId,
        name: payload.name,
        isActive: payload.isActive,
        triggerType: payload.triggerType,
        templateBinding: payload.templateId
          ? {
              templateId: payload.templateId,
              version: 'latest-published',
            }
          : undefined,
      }),
    });

    return {
      ...payload,
      id: ruleId,
      updatedAt: new Date().toISOString(),
    };
  },

  async updateRule(payload: Rule): Promise<Rule> {
    await apiRequest(`/artifact/rules/${payload.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: payload.name,
        isActive: payload.isActive,
        triggerType: payload.triggerType,
      }),
    });

    if (payload.templateId) {
      await apiRequest(`/artifact/rules/${payload.id}/bind-template`, {
        method: 'POST',
        body: JSON.stringify({
          templateId: payload.templateId,
          version: 'latest-published',
        }),
      });
    }

    return { ...payload, updatedAt: new Date().toISOString() };
  },

  async deleteRule(id: string): Promise<void> {
    await apiRequest(`/artifact/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
  },

  async getRuleGroups(): Promise<RuleGroup[]> {
    const teams = await getAllTeams();
    return getAllRuleGroups(teams);
  },

  async getTriggers(): Promise<Trigger[]> {
    return mockTriggers;
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const teams = await getAllTeams();
    const rules = await getAllRules(teams);
    return getAllSubscriptions(rules);
  },

  async createSubscription(payload: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const subscriptionId = `sub-${Math.random().toString(36).slice(2, 8)}`;
    await apiRequest(`/artifact/rules/${payload.ruleId}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId,
        type: payload.scope,
        targets: payload.emails,
        channel: 'email',
        sendIndividualEmailsToSubscribers: !payload.groupedEmails,
      }),
    });

    return {
      ...payload,
      id: subscriptionId,
      createdAt: new Date().toISOString(),
    };
  },

  async updateSubscription(payload: Subscription): Promise<Subscription> {
    await apiRequest(`/artifact/subscriptions/${payload.id}`, { method: 'DELETE' });
    await apiRequest(`/artifact/rules/${payload.ruleId}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId: payload.id,
        type: payload.scope,
        targets: payload.emails,
        channel: 'email',
        sendIndividualEmailsToSubscribers: !payload.groupedEmails,
      }),
    });

    return payload;
  },

  async getSystemAlerts(): Promise<SystemAlert[]> {
    return mockSystemAlerts;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return [];
  },

  async getDigestConfig(): Promise<DigestConfig> {
    return mockDigestConfig;
  },

  async updateDigestConfig(payload: DigestConfig): Promise<DigestConfig> {
    return payload;
  },
};
