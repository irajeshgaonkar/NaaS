import { z } from 'zod';

export const triggerPayloadSchema = z.object({
  subscriptionListType: z.enum(['User', 'Team']).optional(),
  subscriptionListDataSource: z.enum(['JSON', 'Subscription']).optional(),
  subscriptionList: z.array(z.string().min(3)).optional(),
  sendIndividualEmailsToSubscribers: z.boolean().optional(),
  customProperties: z.record(z.any()).optional(),
  customTables: z.array(z.record(z.any())).optional(),
  ccSubscriptionList: z.array(z.string().email()).optional(),
  bccSubscriptionList: z.array(z.string().email()).optional(),
  notificationSenderMail: z.string().email().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1),
        contentBytes: z.string().min(1),
      }),
    )
    .optional(),
  operationId: z.string().min(3).optional(),
  categoryId: z.string().optional(),
  strictPlaceholders: z.boolean().optional(),
});

export const triggerEventDetailSchema = triggerPayloadSchema.extend({
  ruleName: z.string().optional(),
  ruleId: z.string().optional(),
  teamId: z.string().min(3),
});
