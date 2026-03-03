import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from './config.js';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const nowIso = () => new Date().toISOString();
const versionSk = (version: number) => `VERSION#${String(version).padStart(5, '0')}`;

export const objectKey = (teamId: string, templateId: string, version: number) =>
  `teams/${teamId}/templates/${templateId}/versions/v${version}/content`;

const streamToString = async (stream: any): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
};

export const repository = {
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

  async createTeam(teamId: string, body: { name: string; description?: string }, actor: string) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `TEAM#${teamId}`,
          sk: 'META',
          entityType: 'TEAM',
          teamId,
          ...body,
          gsi1pk: 'ORG#DEFAULT',
          gsi1sk: `TEAM#${body.name}`,
          createdBy: actor,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );
  },

  async getTeam(teamId: string) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEAM#${teamId}`, sk: 'META' },
      }),
    );
    return res.Item;
  },

  async listTeams() {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': 'ORG#DEFAULT',
          ':prefix': 'TEAM#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async patchTeam(teamId: string, patch: Record<string, unknown>) {
    const allowed = ['name', 'description'];
    const keys = Object.keys(patch).filter((k) => allowed.includes(k));
    if (!keys.length) return this.getTeam(teamId);

    const setExpr = keys.map((key, idx) => `#${key} = :${idx}`).join(', ');
    const names = Object.fromEntries(keys.map((k) => [`#${k}`, k]));
    const values = Object.fromEntries(keys.map((k, idx) => [`:${idx}`, patch[k]]));
    values[':updatedAt'] = nowIso();

    const res = await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEAM#${teamId}`, sk: 'META' },
        UpdateExpression: `SET ${setExpr}, updatedAt = :updatedAt`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return res.Attributes;
  },

  async deleteTeam(teamId: string) {
    await ddb.send(
      new DeleteCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEAM#${teamId}`, sk: 'META' },
      }),
    );
  },

  async putMember(teamId: string, email: string, body: { displayName: string; role: string }) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `TEAM#${teamId}`,
          sk: `MEMBER#${email.toLowerCase()}`,
          entityType: 'MEMBER',
          teamId,
          email: email.toLowerCase(),
          ...body,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      }),
    );
  },

  async patchMember(teamId: string, email: string, patch: Record<string, unknown>) {
    const keys = Object.keys(patch);
    const setExpr = keys.map((key, idx) => `#${key} = :${idx}`).join(', ');
    const names = Object.fromEntries(keys.map((k) => [`#${k}`, k]));
    const values = Object.fromEntries(keys.map((k, idx) => [`:${idx}`, patch[k]]));
    values[':updatedAt'] = nowIso();

    const res = await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEAM#${teamId}`, sk: `MEMBER#${email.toLowerCase()}` },
        UpdateExpression: `SET ${setExpr}, updatedAt = :updatedAt`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return res.Attributes;
  },

  async deleteMember(teamId: string, email: string) {
    await ddb.send(
      new DeleteCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEAM#${teamId}`, sk: `MEMBER#${email.toLowerCase()}` },
      }),
    );
  },

  async createTemplate(teamId: string, body: { templateId: string; name: string; channel: string }, actor: string) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `TEMPLATE#${body.templateId}`,
          sk: 'META',
          entityType: 'TEMPLATE_META',
          teamId,
          templateId: body.templateId,
          name: body.name,
          channel: body.channel,
          state: 'DRAFT',
          latestVersion: 0,
          latestPublishedVersion: 0,
          gsi1pk: `TEAM#${teamId}`,
          gsi1sk: `TEMPLATE#${body.name}`,
          createdBy: actor,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );
  },

  async listTemplatesByTeam(teamId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `TEAM#${teamId}`,
          ':prefix': 'TEMPLATE#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async getTemplate(templateId: string) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: 'META' },
      }),
    );
    return res.Item;
  },

  async createTemplateVersion(templateId: string, teamId: string, content: string, contentType: string, actor: string, notes?: string) {
    const meta = await this.getTemplate(templateId);
    if (!meta) throw new Error('Template not found');

    const version = Number(meta.latestVersion ?? 0) + 1;
    const key = objectKey(teamId, templateId, version);

    await s3.send(
      new PutObjectCommand({
        Bucket: config.templateBucket,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    );

    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `TEMPLATE#${templateId}`,
          sk: versionSk(version),
          entityType: 'TEMPLATE_VERSION',
          version,
          teamId,
          templateId,
          s3Key: key,
          contentType,
          changeNotes: notes ?? '',
          createdBy: actor,
          createdAt: nowIso(),
        },
      }),
    );

    await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: 'META' },
        UpdateExpression: 'SET latestVersion = :v, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':v': version,
          ':updatedAt': nowIso(),
        },
      }),
    );

    return { version, s3Key: key };
  },

  async listTemplateVersions(templateId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `TEMPLATE#${templateId}`,
          ':prefix': 'VERSION#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async getTemplateVersion(templateId: string, version: number) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: versionSk(version) },
      }),
    );
    const item = res.Item;
    if (!item) return undefined;

    const object = await s3.send(
      new GetObjectCommand({
        Bucket: config.templateBucket,
        Key: item.s3Key,
      }),
    );

    const content = await streamToString(object.Body);
    return { ...item, content };
  },

  async publishTemplateVersion(templateId: string, version: number) {
    await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `TEMPLATE#${templateId}`, sk: 'META' },
        UpdateExpression: 'SET state = :state, latestPublishedVersion = :v, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':state': 'PUBLISHED',
          ':v': version,
          ':updatedAt': nowIso(),
        },
      }),
    );
  },

  async createRuleGroup(teamId: string, body: { ruleGroupId: string; name: string; description?: string }, actor: string) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `RULEGROUP#${body.ruleGroupId}`,
          sk: 'META',
          entityType: 'RULE_GROUP',
          teamId,
          ...body,
          gsi1pk: `TEAM#${teamId}`,
          gsi1sk: `RULEGROUP#${body.name}`,
          createdBy: actor,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      }),
    );
  },

  async listRuleGroupsByTeam(teamId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `TEAM#${teamId}`,
          ':prefix': 'RULEGROUP#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async createRule(teamId: string, body: any, actor: string) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `RULE#${body.ruleId}`,
          sk: 'META',
          entityType: 'RULE',
          teamId,
          ...body,
          gsi1pk: `TEAM#${teamId}`,
          gsi1sk: `RULE#${body.name}`,
          gsi2pk: `RULE_NAME#${body.name}`,
          gsi2sk: `RULE#${body.ruleId}`,
          createdBy: actor,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      }),
    );
  },

  async listRulesByTeam(teamId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `TEAM#${teamId}`,
          ':prefix': 'RULE#',
        },
      }),
    );
    return res.Items ?? [];
  },

  async getRule(ruleId: string) {
    const res = await ddb.send(
      new GetCommand({
        TableName: config.artifactsTable,
        Key: { pk: `RULE#${ruleId}`, sk: 'META' },
      }),
    );
    return res.Item;
  },

  async patchRule(ruleId: string, patch: Record<string, unknown>) {
    const keys = Object.keys(patch);
    if (!keys.length) return this.getRule(ruleId);

    const setExpr = keys.map((key, idx) => `#${key} = :${idx}`).join(', ');
    const names = Object.fromEntries(keys.map((k) => [`#${k}`, k]));
    const values = Object.fromEntries(keys.map((k, idx) => [`:${idx}`, patch[k]]));
    values[':updatedAt'] = nowIso();

    const res = await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `RULE#${ruleId}`, sk: 'META' },
        UpdateExpression: `SET ${setExpr}, updatedAt = :updatedAt`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return res.Attributes;
  },

  async bindTemplate(ruleId: string, templateBinding: { templateId: string; version: number | 'latest-published' }) {
    const res = await ddb.send(
      new UpdateCommand({
        TableName: config.artifactsTable,
        Key: { pk: `RULE#${ruleId}`, sk: 'META' },
        UpdateExpression: 'SET templateBinding = :templateBinding, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':templateBinding': templateBinding,
          ':updatedAt': nowIso(),
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return res.Attributes;
  },

  async createSubscription(ruleId: string, payload: any) {
    await ddb.send(
      new PutCommand({
        TableName: config.artifactsTable,
        Item: {
          pk: `RULE#${ruleId}`,
          sk: `SUB#${payload.subscriptionId}`,
          entityType: 'SUBSCRIPTION',
          ruleId,
          ...payload,
          gsi2pk: `SUB#${payload.subscriptionId}`,
          gsi2sk: `RULE#${ruleId}`,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      }),
    );
  },

  async listSubscriptions(ruleId: string) {
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

  async deleteSubscription(subscriptionId: string) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: config.artifactsTable,
        IndexName: 'gsi2',
        KeyConditionExpression: 'gsi2pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `SUB#${subscriptionId}`,
        },
      }),
    );

    const item = (res.Items ?? [])[0];
    if (!item) return;

    await ddb.send(
      new DeleteCommand({
        TableName: config.artifactsTable,
        Key: { pk: item.pk, sk: item.sk },
      }),
    );
  },
};
