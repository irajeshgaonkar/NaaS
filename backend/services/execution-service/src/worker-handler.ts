import type { SQSEvent } from 'aws-lambda';
import { emitMetric } from '../../../packages/shared/src/metrics.js';
import type { NotificationDispatchMessage } from '../../../packages/shared/src/types.js';
import { config } from './config.js';
import { MicrosoftGraphEmailProvider } from './providers/graph-email-provider.js';
import { MicrosoftGraphTeamsProvider } from './providers/graph-teams-provider.js';
import { SlackWebhookProvider } from './providers/slack-webhook-provider.js';
import { executionRepository } from './repository.js';

const emailProvider = new MicrosoftGraphEmailProvider();
const teamsProvider = new MicrosoftGraphTeamsProvider();
const slackProvider = new SlackWebhookProvider();

const classifyTransient = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('timeout') || msg.includes('throttle') || msg.includes('429') || msg.includes('5');
};

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body) as NotificationDispatchMessage;
    const startedAt = Date.now();

    await executionRepository.updateNotificationStatus(message.notificationId, 'sending');

    try {
      const canSend = await executionRepository.tryConsumeRate(
        message.teamId,
        config.sendsPerMinute,
        'PerChannelSent',
      );

      if (!canSend) {
        throw new Error('send-rate-limit-exceeded');
      }

      const body = String(message.renderedPayload.body ?? '');
      let sendResult;

      if (message.channel === 'email') {
        sendResult = await emailProvider.send({
          to: message.recipients,
          cc: (message.renderedPayload.cc as string[]) ?? [],
          bcc: (message.renderedPayload.bcc as string[]) ?? [],
          subject: String(message.renderedPayload.subject ?? 'NaaS Notification'),
          body,
          sender: message.renderedPayload.sender as string | undefined,
        });
      } else if (message.channel === 'teams') {
        sendResult = await teamsProvider.send({ recipients: message.recipients, body });
      } else {
        sendResult = await slackProvider.send({ recipients: message.recipients, body });
      }

      if (!sendResult.accepted) {
        if (sendResult.transientError) {
          throw new Error(`transient-provider-error:${JSON.stringify(sendResult.details ?? {})}`);
        }
        await executionRepository.updateNotificationStatus(
          message.notificationId,
          'failed',
          JSON.stringify(sendResult.details ?? {}),
        );
        emitMetric(config.metricNamespace, {
          name: 'NotificationsFailed',
          value: 1,
          dimensions: { channel: message.channel, teamId: message.teamId },
        });
        continue;
      }

      await executionRepository.updateNotificationStatus(message.notificationId, 'sent');
      await executionRepository.incrementTeamSentCounter(message.teamId, message.channel);

      emitMetric(config.metricNamespace, {
        name: 'NotificationsSent',
        value: 1,
        dimensions: { channel: message.channel, teamId: message.teamId },
      });
      emitMetric(config.metricNamespace, {
        name: 'SendLatencyMs',
        value: Date.now() - startedAt,
        unit: 'Milliseconds',
        dimensions: { channel: message.channel },
      });
    } catch (error) {
      const transient = classifyTransient(error);
      if (!transient) {
        await executionRepository.updateNotificationStatus(
          message.notificationId,
          'failed',
          error instanceof Error ? error.message : String(error),
        );
        emitMetric(config.metricNamespace, {
          name: 'NotificationsFailed',
          value: 1,
          dimensions: { channel: message.channel, teamId: message.teamId },
        });
        continue;
      }
      throw error;
    }
  }
};
