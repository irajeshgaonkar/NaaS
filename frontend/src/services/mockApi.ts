import {
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
import {
  mockActivity,
  mockAuditLogs,
  mockDigestConfig,
  mockRuleGroups,
  mockRules,
  mockSubscriptions,
  mockSystemAlerts,
  mockTeams,
  mockTemplates,
  mockTriggers,
} from './mockData';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

let teams = [...mockTeams];
let templates = [...mockTemplates];
let rules = [...mockRules];
let subscriptions = [...mockSubscriptions];
let digestConfig: DigestConfig = { ...mockDigestConfig };
let auditLogs = [...mockAuditLogs];

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const addAudit = (action: string, resourceType: string, resourceName: string, actor = 'System') => {
  auditLogs = [
    {
      id: createId('audit'),
      actor,
      action,
      resourceType,
      resourceName,
      timestamp: new Date().toISOString(),
    },
    ...auditLogs,
  ];
};

export const naasApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay();
    return {
      totalTeams: teams.length,
      activeRules: rules.filter((rule) => rule.isActive).length,
      notificationsSent: 18472,
      failedNotifications: 219,
    };
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    await delay();
    return [...mockActivity];
  },

  async getTeams(): Promise<Team[]> {
    await delay();
    return [...teams];
  },

  async createTeam(payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    await delay();
    const team: Team = {
      ...payload,
      id: createId('team'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    teams = [team, ...teams];
    addAudit('Created Team', 'Team', team.name, payload.createdBy);
    return team;
  },

  async updateTeam(payload: Team): Promise<Team> {
    await delay();
    const updated: Team = { ...payload, updatedAt: new Date().toISOString() };
    teams = teams.map((team) => (team.id === payload.id ? updated : team));
    addAudit('Updated Team', 'Team', updated.name, updated.createdBy);
    return updated;
  },

  async deleteTeam(id: string): Promise<void> {
    await delay();
    const team = teams.find((item) => item.id === id);
    teams = teams.filter((item) => item.id !== id);
    if (team) addAudit('Deleted Team', 'Team', team.name);
  },

  async getTemplates(): Promise<Template[]> {
    await delay();
    return [...templates];
  },

  async updateTemplate(payload: Template): Promise<Template> {
    await delay();
    const updated: Template = { ...payload, updatedAt: new Date().toISOString() };
    templates = templates.map((template) => (template.id === payload.id ? updated : template));
    addAudit('Updated Template', 'Template', updated.name, updated.createdBy);
    return updated;
  },

  async getRules(): Promise<Rule[]> {
    await delay();
    return [...rules];
  },

  async createRule(payload: Omit<Rule, 'id' | 'updatedAt'>): Promise<Rule> {
    await delay();
    const rule: Rule = {
      ...payload,
      id: createId('rule'),
      updatedAt: new Date().toISOString(),
    };
    rules = [rule, ...rules];
    addAudit('Created Rule', 'Rule', rule.name, rule.createdBy);
    return rule;
  },

  async updateRule(payload: Rule): Promise<Rule> {
    await delay();
    const updated: Rule = { ...payload, updatedAt: new Date().toISOString() };
    rules = rules.map((rule) => (rule.id === payload.id ? updated : rule));
    addAudit('Updated Rule', 'Rule', updated.name, updated.createdBy);
    return updated;
  },

  async deleteRule(id: string): Promise<void> {
    await delay();
    const rule = rules.find((item) => item.id === id);
    rules = rules.filter((item) => item.id !== id);
    if (rule) addAudit('Deleted Rule', 'Rule', rule.name);
  },

  async getRuleGroups(): Promise<RuleGroup[]> {
    await delay();
    return [...mockRuleGroups];
  },

  async getTriggers(): Promise<Trigger[]> {
    await delay();
    return [...mockTriggers];
  },

  async getSubscriptions(): Promise<Subscription[]> {
    await delay();
    return [...subscriptions];
  },

  async createSubscription(payload: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    await delay();
    const subscription: Subscription = {
      ...payload,
      id: createId('sub'),
      createdAt: new Date().toISOString(),
    };
    subscriptions = [subscription, ...subscriptions];
    addAudit('Created Subscription', 'Subscription', subscription.id);
    return subscription;
  },

  async updateSubscription(payload: Subscription): Promise<Subscription> {
    await delay();
    subscriptions = subscriptions.map((item) => (item.id === payload.id ? payload : item));
    addAudit('Updated Subscription', 'Subscription', payload.id);
    return payload;
  },

  async getSystemAlerts(): Promise<SystemAlert[]> {
    await delay();
    return [...mockSystemAlerts];
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    await delay();
    return [...auditLogs];
  },

  async getDigestConfig(): Promise<DigestConfig> {
    await delay();
    return { ...digestConfig };
  },

  async updateDigestConfig(payload: DigestConfig): Promise<DigestConfig> {
    await delay();
    digestConfig = { ...payload };
    addAudit('Updated Digest Configuration', 'DigestConfig', payload.frequency);
    return { ...digestConfig };
  },
};

export const extractPlaceholders = (content: string): string[] => {
  const matches = [...content.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((item) => item[1]);
  return Array.from(new Set(matches));
};

export const validatePlaceholders = (content: string, allowed: string[]) => {
  const used = extractPlaceholders(content);
  const invalid = used.filter((placeholder) => !allowed.includes(placeholder));
  return { used, invalid };
};
