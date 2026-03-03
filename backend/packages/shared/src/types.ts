export type UserRole = 'NotificationAdmin' | 'NotificationManager' | 'NotificationUser';

export interface AuthContext {
  sub: string;
  email: string;
  role: UserRole;
  teamIds: string[];
}

export interface BaseEntity {
  pk: string;
  sk: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  teamId: string;
  name: string;
  description?: string;
  createdBy: string;
}

export interface TeamMember {
  teamId: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface TemplateMeta {
  templateId: string;
  teamId: string;
  name: string;
  channel: 'email' | 'teams' | 'slack' | 'adaptive' | 'actionable';
  state: 'DRAFT' | 'PUBLISHED';
  latestVersion: number;
  latestPublishedVersion?: number;
}

export interface Rule {
  ruleId: string;
  teamId: string;
  name: string;
  templateBinding: {
    templateId: string;
    version: number | 'latest-published';
  };
  isActive: boolean;
}

export interface TriggerRequest {
  subscriptionListType?: 'User' | 'Team';
  subscriptionListDataSource?: 'JSON' | 'Subscription';
  subscriptionList?: string[];
  sendIndividualEmailsToSubscribers?: boolean;
  customProperties?: Record<string, unknown>;
  customTables?: Array<Record<string, unknown>>;
  ccSubscriptionList?: string[];
  bccSubscriptionList?: string[];
  notificationSenderMail?: string;
  attachments?: Array<{ fileName: string; contentBytes: string }>;
  operationId?: string;
  categoryId?: string;
  strictPlaceholders?: boolean;
}

export interface NotificationDispatchMessage {
  notificationId: string;
  correlationId: string;
  teamId: string;
  ruleId: string;
  ruleName: string;
  templateId: string;
  templateVersion: number;
  channel: 'email' | 'teams' | 'slack';
  recipients: string[];
  renderedPayload: Record<string, unknown>;
  createdAt: string;
}
