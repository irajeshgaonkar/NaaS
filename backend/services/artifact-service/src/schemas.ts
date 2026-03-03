import { z } from 'zod';

export const teamCreateSchema = z.object({
  teamId: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
});

export const teamPatchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const memberCreateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  role: z.enum(['NotificationAdmin', 'NotificationManager', 'NotificationUser']),
});

export const memberPatchSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.enum(['NotificationAdmin', 'NotificationManager', 'NotificationUser']).optional(),
});

export const templateCreateSchema = z.object({
  templateId: z.string().min(3),
  name: z.string().min(2),
  channel: z.enum(['email', 'teams', 'slack', 'adaptive', 'actionable']),
  initialContent: z.string().min(1),
  contentType: z.enum(['text/html', 'text/markdown', 'application/json']).default('text/markdown'),
});

export const templateVersionSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(['text/html', 'text/markdown', 'application/json']).default('text/markdown'),
  changeNotes: z.string().optional(),
});

export const ruleGroupCreateSchema = z.object({
  ruleGroupId: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
});

export const ruleCreateSchema = z.object({
  ruleId: z.string().min(3),
  name: z.string().min(2),
  templateBinding: z
    .object({
      templateId: z.string().min(3),
      version: z.union([z.number().int().positive(), z.literal('latest-published')]),
    })
    .optional(),
  isActive: z.boolean().default(true),
  triggerType: z.enum(['Manual', 'System', 'Digest', 'Event']).default('Manual'),
});

export const rulePatchSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  triggerType: z.enum(['Manual', 'System', 'Digest', 'Event']).optional(),
});

export const bindTemplateSchema = z.object({
  templateId: z.string().min(3),
  version: z.union([z.number().int().positive(), z.literal('latest-published')]),
});

export const subscriptionCreateSchema = z.object({
  subscriptionId: z.string().min(3),
  type: z.enum(['User', 'Team']),
  targets: z.array(z.string().min(3)).min(1),
  channel: z.enum(['email', 'teams', 'slack']),
  sendIndividualEmailsToSubscribers: z.boolean().default(false),
});
