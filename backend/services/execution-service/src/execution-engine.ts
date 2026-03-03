import { randomUUID } from 'node:crypto';
import { emitMetric } from '../../../packages/shared/src/metrics.js';
import { renderTemplate } from '../../../packages/shared/src/template.js';
import type { NotificationDispatchMessage, TriggerRequest } from '../../../packages/shared/src/types.js';
import { config } from './config.js';
import { executionRepository } from './repository.js';

interface TriggerInput {
  ruleName?: string;
  ruleId?: string;
  teamId?: string;
  payload: TriggerRequest;
  correlationId: string;
  actor: string;
}

export const processTrigger = async (input: TriggerInput) => {
  const resolvedRule = await executionRepository.resolveRule(input.ruleName, input.ruleId);
  if (!resolvedRule) {
    throw new Error('Rule not found');
  }

  const teamId = input.teamId ?? (resolvedRule.teamId as string);
  if (!teamId) throw new Error('teamId is required');

  const rateAllowed = await executionRepository.tryConsumeRate(teamId, config.triggersPerMinute, 'NotificationsTriggered');
  if (!rateAllowed) {
    const err = new Error('Rate limit exceeded');
    (err as Error & { statusCode?: number }).statusCode = 429;
    throw err;
  }

  const notificationId = randomUUID();
  if (input.payload.operationId) {
    const idempotency = await executionRepository.checkAndPutIdempotency(
      input.payload.operationId,
      teamId,
      notificationId,
    );
    if (idempotency.alreadyExists) {
      return {
        notificationId: idempotency.notificationId,
        idempotent: true,
      };
    }
  }

  const templateBinding = resolvedRule.templateBinding as
    | { templateId: string; version: number | 'latest-published' }
    | undefined;

  if (!templateBinding) throw new Error('Rule has no template binding');

  const templateMeta = await executionRepository.getTemplateMeta(templateBinding.templateId);
  if (!templateMeta) throw new Error('Template not found');

  const version =
    templateBinding.version === 'latest-published'
      ? Number(templateMeta.latestPublishedVersion ?? 0)
      : Number(templateBinding.version);

  if (!version) throw new Error('No published template version available');

  const templateVersion = await executionRepository.getTemplateVersion(templateBinding.templateId, version);
  if (!templateVersion) throw new Error('Template version not found');

  const strict = input.payload.strictPlaceholders ?? true;
  const render = renderTemplate(templateVersion.content as string, input.payload as Record<string, unknown>, strict);
  if (strict && render.missing.length) {
    const err = new Error(`Missing placeholders: ${render.missing.join(', ')}`);
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  const subs = await executionRepository.listRuleSubscriptions(resolvedRule.ruleId as string);
  const recipients = Array.from(
    new Set([
      ...(input.payload.subscriptionList ?? []),
      ...subs.flatMap((s) => (s.targets as string[]) ?? []),
    ]),
  );

  const channel = (templateMeta.channel as 'email' | 'teams' | 'slack') ?? 'email';

  const attachments = await Promise.all(
    (input.payload.attachments ?? []).map((item) =>
      executionRepository.saveAttachment(teamId, notificationId, item.fileName, item.contentBytes),
    ),
  );

  const dispatchMessage: NotificationDispatchMessage = {
    notificationId,
    correlationId: input.correlationId,
    teamId,
    ruleId: resolvedRule.ruleId as string,
    ruleName: resolvedRule.name as string,
    templateId: templateBinding.templateId,
    templateVersion: version,
    channel,
    recipients,
    renderedPayload: {
      body: render.rendered,
      subject: `NaaS Notification - ${resolvedRule.name}`,
      cc: input.payload.ccSubscriptionList ?? [],
      bcc: input.payload.bccSubscriptionList ?? [],
      sender: input.payload.notificationSenderMail,
      attachments,
    },
    createdAt: new Date().toISOString(),
  };

  await executionRepository.createNotificationRecord({
    notificationId,
    correlationId: input.correlationId,
    teamId,
    ruleId: resolvedRule.ruleId as string,
    status: 'queued',
    channel,
    recipients,
    operationId: input.payload.operationId,
  });

  await executionRepository.enqueueDispatch(dispatchMessage);

  await executionRepository.putAudit({
    actor: input.actor,
    action: 'TRIGGER',
    entityType: 'RULE',
    entityId: resolvedRule.ruleId as string,
    correlationId: input.correlationId,
    before: null,
    after: {
      notificationId,
      teamId,
      recipients,
    },
  });

  emitMetric(config.metricNamespace, {
    name: 'PerTeamSent',
    value: 1,
    dimensions: { teamId },
  });

  return { notificationId, idempotent: false };
};
