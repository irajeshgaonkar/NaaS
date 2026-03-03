export type UserRole = 'admin' | 'manager' | 'user';

export type MemberRole = 'Admin' | 'Manager' | 'User';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  accessLevelEnabled: boolean;
  members: Member[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  teamId: string;
  name: string;
  category: 'System' | 'Ops' | 'Security' | 'Digest';
  isActive: boolean;
  isTeamsAdaptiveCard: boolean;
  useApprovalWorkflow: boolean;
  emailTemplate: string;
  teamsTemplate: string;
  adaptiveCardJson: string;
  workflowJson: string;
  placeholders: string[];
  createdBy: string;
  updatedAt: string;
}

export type TriggerType = 'Manual' | 'System' | 'Digest' | 'Event';

export interface Rule {
  id: string;
  name: string;
  templateId: string;
  triggerType: TriggerType;
  category: 'Critical' | 'Warning' | 'Info';
  defaultSubscribeForTeams: boolean;
  isActive: boolean;
  createdBy: string;
  updatedAt: string;
}

export interface RuleGroup {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  createdAt: string;
}

export interface Trigger {
  id: string;
  name: string;
  type: TriggerType;
  source: string;
  isEnabled: boolean;
  lastFiredAt: string;
}

export interface Subscription {
  id: string;
  scope: 'User' | 'Team';
  scopeId: string;
  ruleId: string;
  emails: string[];
  groupedEmails: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'Open' | 'Acknowledged' | 'Resolved';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceName: string;
  timestamp: string;
}

export interface DigestConfig {
  frequency: 'Daily' | 'Weekly';
  summaryEnabled: boolean;
  includeFailures: boolean;
  includeUsageMetrics: boolean;
}

export interface ActivityItem {
  id: string;
  message: string;
  actor: string;
  timestamp: string;
}

export interface DashboardStats {
  totalTeams: number;
  activeRules: number;
  notificationsSent: number;
  failedNotifications: number;
}
