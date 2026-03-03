import {
  ActivityItem,
  AuditLog,
  DigestConfig,
  Rule,
  RuleGroup,
  Subscription,
  SystemAlert,
  Team,
  Template,
  Trigger,
} from './models';

const now = new Date();

const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockTeams: Team[] = [
  {
    id: 'team-platform',
    name: 'Platform Operations',
    description: 'Core platform reliability and uptime notifications.',
    accessLevelEnabled: true,
    members: [
      { id: 'm1', name: 'Aria Patel', email: 'aria@naas.dev', role: 'Admin' },
      { id: 'm2', name: 'Noah Kim', email: 'noah@naas.dev', role: 'Manager' },
      { id: 'm3', name: 'Liam Chen', email: 'liam@naas.dev', role: 'User' },
    ],
    createdBy: 'Aria Patel',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  },
  {
    id: 'team-security',
    name: 'Security Incident Response',
    description: 'Security and compliance alerting workflows.',
    accessLevelEnabled: true,
    members: [
      { id: 'm4', name: 'Emma Reed', email: 'emma@naas.dev', role: 'Admin' },
      { id: 'm5', name: 'Mason Lee', email: 'mason@naas.dev', role: 'User' },
    ],
    createdBy: 'Emma Reed',
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
  },
  {
    id: 'team-finops',
    name: 'FinOps Alerts',
    description: 'Spend anomalies and budget threshold notifications.',
    accessLevelEnabled: false,
    members: [
      { id: 'm6', name: 'Sophia Ward', email: 'sophia@naas.dev', role: 'Manager' },
    ],
    createdBy: 'Sophia Ward',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
];

export const mockTemplates: Template[] = [
  {
    id: 'tpl-incident',
    teamId: 'team-platform',
    name: 'Critical Incident Template',
    category: 'Ops',
    isActive: true,
    isTeamsAdaptiveCard: true,
    useApprovalWorkflow: true,
    emailTemplate: 'Incident {{incidentId}} detected for {{serviceName}}.',
    teamsTemplate: 'Service {{serviceName}} is degraded. Owner: {{ownerName}}.',
    adaptiveCardJson: '{\n  "type": "AdaptiveCard",\n  "version": "1.4",\n  "body": [{"type":"TextBlock","text":"Incident {{incidentId}}"}]\n}',
    workflowJson: '{\n  "steps": [\n    {"type": "approval", "approver": "oncall-manager"},\n    {"type": "notify", "channel": "teams"}\n  ]\n}',
    placeholders: ['incidentId', 'serviceName', 'ownerName'],
    createdBy: 'Noah Kim',
    updatedAt: daysAgo(1),
  },
  {
    id: 'tpl-weekly-digest',
    teamId: 'team-finops',
    name: 'Weekly Cost Digest',
    category: 'Digest',
    isActive: true,
    isTeamsAdaptiveCard: false,
    useApprovalWorkflow: false,
    emailTemplate: 'Weekly spend summary for {{teamName}} is {{totalSpend}}.',
    teamsTemplate: 'Weekly digest: {{teamName}} total {{totalSpend}}.',
    adaptiveCardJson: '{\n  "type": "AdaptiveCard",\n  "body": [{"type":"TextBlock","text":"Weekly Digest"}]\n}',
    workflowJson: '{\n  "steps": [{"type":"notify","channel":"email"}]\n}',
    placeholders: ['teamName', 'totalSpend'],
    createdBy: 'Sophia Ward',
    updatedAt: daysAgo(4),
  },
];

export const mockRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'Service Health Critical',
    templateId: 'tpl-incident',
    triggerType: 'System',
    category: 'Critical',
    defaultSubscribeForTeams: true,
    isActive: true,
    createdBy: 'Noah Kim',
    updatedAt: daysAgo(1),
  },
  {
    id: 'rule-2',
    name: 'Budget Threshold Breach',
    templateId: 'tpl-weekly-digest',
    triggerType: 'Event',
    category: 'Warning',
    defaultSubscribeForTeams: false,
    isActive: true,
    createdBy: 'Sophia Ward',
    updatedAt: daysAgo(7),
  },
  {
    id: 'rule-3',
    name: 'Daily Summary Rollup',
    templateId: 'tpl-weekly-digest',
    triggerType: 'Digest',
    category: 'Info',
    defaultSubscribeForTeams: true,
    isActive: false,
    createdBy: 'Sophia Ward',
    updatedAt: daysAgo(12),
  },
];

export const mockRuleGroups: RuleGroup[] = [
  {
    id: 'group-1',
    name: 'Incident Management',
    description: 'Rules for high severity incident alerts.',
    ruleIds: ['rule-1'],
    createdAt: daysAgo(30),
  },
  {
    id: 'group-2',
    name: 'Financial Controls',
    description: 'Budget and cost anomaly notifications.',
    ruleIds: ['rule-2', 'rule-3'],
    createdAt: daysAgo(22),
  },
];

export const mockTriggers: Trigger[] = [
  {
    id: 'trigger-1',
    name: 'Service Monitor Event',
    type: 'System',
    source: 'Prometheus',
    isEnabled: true,
    lastFiredAt: daysAgo(0),
  },
  {
    id: 'trigger-2',
    name: 'Weekly Digest Scheduler',
    type: 'Digest',
    source: 'Scheduler',
    isEnabled: true,
    lastFiredAt: daysAgo(3),
  },
  {
    id: 'trigger-3',
    name: 'Manual Incident Drill',
    type: 'Manual',
    source: 'Portal Action',
    isEnabled: false,
    lastFiredAt: daysAgo(21),
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    scope: 'Team',
    scopeId: 'team-platform',
    ruleId: 'rule-1',
    emails: ['platform-oncall@naas.dev', 'sre-lead@naas.dev'],
    groupedEmails: true,
    isActive: true,
    createdAt: daysAgo(10),
  },
  {
    id: 'sub-2',
    scope: 'User',
    scopeId: 'm5',
    ruleId: 'rule-2',
    emails: ['mason@naas.dev'],
    groupedEmails: false,
    isActive: true,
    createdAt: daysAgo(9),
  },
];

export const mockSystemAlerts: SystemAlert[] = [
  {
    id: 'alert-1',
    title: 'Notification queue latency above SLA',
    severity: 'P1',
    status: 'Open',
    createdAt: daysAgo(0),
  },
  {
    id: 'alert-2',
    title: 'Teams connector auth token expires in 3 days',
    severity: 'P2',
    status: 'Acknowledged',
    createdAt: daysAgo(1),
  },
  {
    id: 'alert-3',
    title: 'Digest generation timeout recovered',
    severity: 'P3',
    status: 'Resolved',
    createdAt: daysAgo(2),
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    actor: 'Aria Patel',
    action: 'Created Team',
    resourceType: 'Team',
    resourceName: 'Platform Operations',
    timestamp: daysAgo(12),
  },
  {
    id: 'audit-2',
    actor: 'Noah Kim',
    action: 'Updated Template',
    resourceType: 'Template',
    resourceName: 'Critical Incident Template',
    timestamp: daysAgo(3),
  },
  {
    id: 'audit-3',
    actor: 'Sophia Ward',
    action: 'Disabled Rule',
    resourceType: 'Rule',
    resourceName: 'Daily Summary Rollup',
    timestamp: daysAgo(1),
  },
];

export const mockActivity: ActivityItem[] = [
  {
    id: 'activity-1',
    message: 'Template "Critical Incident Template" published',
    actor: 'Noah Kim',
    timestamp: daysAgo(0),
  },
  {
    id: 'activity-2',
    message: 'Rule "Service Health Critical" triggered 42 notifications',
    actor: 'System',
    timestamp: daysAgo(0),
  },
  {
    id: 'activity-3',
    message: 'New member onboarded to Security Incident Response',
    actor: 'Emma Reed',
    timestamp: daysAgo(1),
  },
  {
    id: 'activity-4',
    message: 'Weekly digest generated for FinOps Alerts',
    actor: 'Scheduler',
    timestamp: daysAgo(2),
  },
];

export const mockDigestConfig: DigestConfig = {
  frequency: 'Daily',
  summaryEnabled: true,
  includeFailures: true,
  includeUsageMetrics: false,
};
