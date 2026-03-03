import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { emitMetric } from '../../../packages/shared/src/metrics.js';
import type { NotificationDispatchMessage } from '../../../packages/shared/src/types.js';
import { config } from './config.js';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const sqs = new SQSClient({});

const nowIso = () => new Date().toISOString();
const minuteBucket = () => Math.floor(Date.now() / 60000);

const streamToString = async (stream: any): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
};

export const executionRepository = {
  async putAudit(params: {
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    correlationId: string;
    before?: unknown;
    after?: unknown;
  }) {
    await ddb.send(
      new PutCommand({
        TableName: config.auditTable,
        Item: {
          pk: `AUDIT#${new Date().toISOString().slice(0, 10)}`,
          sk: `${Date.now()}#${randomUUID()}`,
          ...params,
          createdAt: nowIso(),
        },
      }),
    );
  },

  async resolveRule(ruleName?: string, ruleId?: string) {
    if (ruleId) {
      const res = await ddb.send(
        new GetCommand({
          TableName: config.artifactsTable,
          Key: { pk: `RULE#${ruleId}`, sk: 'META' },
        }),
      );
      return res.Item;
    }

    if (!ruleName) return undefined;

    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi2',
        KeyConditionExpression: 'gsi2pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `RULE_NAME#${ruleName}`,
        },
        Limit: 1,
      }),
    );

    return res.Items?.[0];
  },

  async getTemplateMeta(templateId: string) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: 'META' },
      }),
    );
    return res.Item;
  },

  async getTemplateVersion(templateId: string, version: number) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: `VERSION#${String(version).padStart(5, '0')}` },
      }),
    );
    if (!res.Item) return undefined;

    const object = await s3.send(
      new GetObjectCommand({
        Bucket: config.templateBucket,
        Key: res.Item.s3Key,
      }),
    );

    const content = await streamToString(object.Body);
    return { ...res.Item, content };
  },

  async listRuleSubscriptions(ruleId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `RULE#${ruleId}`,
          ':prefix': 'SUB#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async checkAndPutIdempotency(operationId: string, teamId: string, notificationId: string) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: config.executionTable,
          Item: {
            pk: `OP#${operationId}`,
            sk: 'META',
            operationId,
            teamId,
            notificationId,
            createdAt: nowIso(),
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        }),
      );
      return { alreadyExists: false };
    } catch {
      const existing = await ddb.send(
        new GetCommand({
          TableName: config.executionTable,
          Key: { pk: `OP#${operationId}`, sk: 'META' },
        }),
      );
      return { alreadyExists: true, notificationId: existing.Item?.notificationId as string | undefined };
    }
  },

  async tryConsumeRate(teamId: string, limit: number, metricName: string) {
    const bucket = minuteBucket();
    const key = `RATE#${teamId}#${bucket}`;

    const res = await ddb.send(
      new UpdateCommand({
        TableName: config.executionTable,
        Key: { pk: key, sk: 'META' },
        UpdateExpression: 'ADD #count :inc SET expiresAt = :exp, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#count': 'count' },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':exp': Math.floor(Date.now() / 1000) + 180,
          ':updatedAt': nowIso(),
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    const count = Number(res.Attributes?.count ?? 0);
    if (count > limit) {
      emitMetric(config.metricNamespace, {
        name: 'ThrottledRequests',
        value: 1,
        dimensions: { teamId },
      });
      return false;
    }

    emitMetric(config.metricNamespace, {
      name: metricName,
      value: 1,
      dimensions: { teamId },
    });
    return true;
  },

  async createNotificationRecord(input: {
    notificationId: string;
    correlationId: string;
    teamId: string;
    ruleId: string;
    status: 'queued' | 'sending' | 'sent' | 'failed';
    channel: string;
    recipients: string[];
    operationId?: string;
  }) {
    await ddb.send(
      new PutCommand({
        TableName: config.executionTable,
        Item: {
          pk: `NOTIF#${input.notificationId}`,
          sk: 'META',
          ...input,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      }),
    );
  },

  async getNotification(notificationId: string) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.executionTable,
        Key: { pk: `NOTIF#${notificationId}`, sk: 'META' },
      }),
    );
    return res.Item;
  },

  async updateNotificationStatus(notificationId: string, status: 'sending' | 'sent' | 'failed', failureReason?: string) {
    await ddb.send(
      new UpdateCommand({
        TableName: config.executionTable,
        Key: { pk: `NOTIF#${notificationId}`, sk: 'META' },
        UpdateExpression: 'SET #status = :status, failureReason = :failureReason, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':failureReason': failureReason ?? null,
          ':updatedAt': nowIso(),
        },
      }),
    );
  },

  async enqueueDispatch(message: NotificationDispatchMessage) {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: config.notificationQueueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          teamId: { DataType: 'String', StringValue: message.teamId },
          channel: { DataType: 'String', StringValue: message.channel },
        },
      }),
    );
  },

  async saveAttachment(teamId: string, notificationId: string, fileName: string, contentBytesBase64: string) {
    const key = `teams/${teamId}/attachments/${notificationId}/${fileName}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: config.templateBucket,
        Key: key,
        Body: Buffer.from(contentBytesBase64, 'base64'),
      }),
    );
    return key;
  },

  async getTeamMetricsSummary(teamId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.executionTable,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `TEAMMETRIC#${teamId}`,
        },
      }),
    );

    return res.Items ?? [];
  },

  async incrementTeamSentCounter(teamId: string, channel: string) {
    const day = new Date().toISOString().slice(0, 10);
    const channelAttr = `channel_${channel}_sent`;
    await ddb.send(
      new UpdateCommand({
        TableName: config.executionTable,
        Key: { pk: `TEAMMETRIC#${teamId}`, sk: `DAY#${day}` },
        UpdateExpression: `ADD sentCount :inc, #channelAttr :inc SET updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
          '#channelAttr': channelAttr,
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':updatedAt': nowIso(),
        },
      }),
    );
  },
};
