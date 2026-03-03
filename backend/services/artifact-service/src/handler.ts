import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { assertRole, assertTeamScope, parseAuthContext } from '../../../packages/shared/src/auth.js';
import {
  badRequest,
  forbidden,
  internalError,
  json,
  notFound,
  unauthorized,
} from '../../../packages/shared/src/http.js';
import { logger } from '../../../packages/shared/src/logger.js';
import { config } from './config.js';
import { repository } from './repository.js';
import {
  bindTemplateSchema,
  memberCreateSchema,
  memberPatchSchema,
  ruleCreateSchema,
  ruleGroupCreateSchema,
  rulePatchSchema,
  subscriptionCreateSchema,
  teamCreateSchema,
  teamPatchSchema,
  templateCreateSchema,
  templateVersionSchema,
} from './schemas.js';

const parseBody = (event: APIGatewayProxyEventV2) => {
  if (!event.body) return {};
  return JSON.parse(event.body);
};

const route = (method: string, path: string, pattern: RegExp) => method + ':' + path.match(pattern)?.join(':');

const withAudit = async (
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  correlationId: string,
  before: unknown,
  after: unknown,
) => {
  await repository.putAudit({
    actor,
    action,
    entityType,
    entityId,
    correlationId,
    before,
    after,
  });
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const correlationId = event.headers['x-correlation-id'] ?? randomUUID();
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    const auth = parseAuthContext(event);

    logger.info('artifact request', {
      service: config.service,
      correlationId,
      method,
      path,
      actor: auth.email,
    });

    if (method === 'POST' && path === '/artifact/teams') {
      assertRole(auth, 'NotificationAdmin');
      const body = teamCreateSchema.parse(parseBody(event));
      await repository.createTeam(body.teamId, { name: body.name, description: body.description }, auth.email);
      await withAudit(auth.email, 'CREATE', 'TEAM', body.teamId, correlationId, null, body);
      return json(201, { teamId: body.teamId }, correlationId);
    }

    if (method === 'GET' && path === '/artifact/teams') {
      assertRole(auth, 'NotificationUser');
      const items = await repository.listTeams();
      return json(200, { items }, correlationId);
    }

    const teamIdMatch = path.match(/^\/artifact\/teams\/([^/]+)$/);
    if (teamIdMatch) {
      const [, teamId] = teamIdMatch;
      assertTeamScope(auth, teamId);
      if (method === 'GET') {
        const team = await repository.getTeam(teamId);
        return team ? json(200, team, correlationId) : notFound('Team not found', correlationId);
      }
      if (method === 'PATCH') {
        assertRole(auth, 'NotificationAdmin');
        const body = teamPatchSchema.parse(parseBody(event));
        const before = await repository.getTeam(teamId);
        const after = await repository.patchTeam(teamId, body);
        await withAudit(auth.email, 'UPDATE', 'TEAM', teamId, correlationId, before, after);
        return json(200, after, correlationId);
      }
      if (method === 'DELETE') {
        assertRole(auth, 'NotificationAdmin');
        const before = await repository.getTeam(teamId);
        await repository.deleteTeam(teamId);
        await withAudit(auth.email, 'DELETE', 'TEAM', teamId, correlationId, before, null);
        return json(204, {}, correlationId);
      }
    }

    const teamMemberMatch = path.match(/^\/artifact\/teams\/([^/]+)\/members(?:\/([^/]+))?$/);
    if (teamMemberMatch) {
      const [, teamId, email] = teamMemberMatch;
      assertTeamScope(auth, teamId);

      if (method === 'POST') {
        assertRole(auth, 'NotificationAdmin');
        const body = memberCreateSchema.parse(parseBody(event));
        await repository.putMember(teamId, body.email, { displayName: body.displayName, role: body.role });
        await withAudit(auth.email, 'CREATE', 'TEAM_MEMBER', `${teamId}:${body.email}`, correlationId, null, body);
        return json(201, { teamId, email: body.email }, correlationId);
      }

      if (method === 'PATCH' && email) {
        assertRole(auth, 'NotificationAdmin');
        const body = memberPatchSchema.parse(parseBody(event));
        const after = await repository.patchMember(teamId, decodeURIComponent(email), body);
        await withAudit(auth.email, 'UPDATE', 'TEAM_MEMBER', `${teamId}:${email}`, correlationId, null, after);
        return json(200, after, correlationId);
      }

      if (method === 'DELETE' && email) {
        assertRole(auth, 'NotificationAdmin');
        await repository.deleteMember(teamId, decodeURIComponent(email));
        await withAudit(auth.email, 'DELETE', 'TEAM_MEMBER', `${teamId}:${email}`, correlationId, null, null);
        return json(204, {}, correlationId);
      }
    }

    const teamTemplatesMatch = path.match(/^\/artifact\/teams\/([^/]+)\/templates$/);
    if (teamTemplatesMatch) {
      const [, teamId] = teamTemplatesMatch;
      assertTeamScope(auth, teamId);
      if (method === 'POST') {
        assertRole(auth, 'NotificationManager');
        const body = templateCreateSchema.parse(parseBody(event));
        await repository.createTemplate(teamId, body, auth.email);
        const version = await repository.createTemplateVersion(
          body.templateId,
          teamId,
          body.initialContent,
          body.contentType,
          auth.email,
          'initial version',
        );
        await withAudit(auth.email, 'CREATE', 'TEMPLATE', body.templateId, correlationId, null, body);
        return json(201, { templateId: body.templateId, initialVersion: version.version }, correlationId);
      }
      if (method === 'GET') {
        const items = await repository.listTemplatesByTeam(teamId);
        return json(200, { items }, correlationId);
      }
    }

    const templateMatch = path.match(/^\/artifact\/templates\/([^/]+)$/);
    if (templateMatch && method === 'GET') {
      const [, templateId] = templateMatch;
      const item = await repository.getTemplate(templateId);
      return item ? json(200, item, correlationId) : notFound('Template not found', correlationId);
    }

    const templateVersionCollectionMatch = path.match(/^\/artifact\/templates\/([^/]+)\/versions$/);
    if (templateVersionCollectionMatch) {
      const [, templateId] = templateVersionCollectionMatch;
      if (method === 'POST') {
        assertRole(auth, 'NotificationManager');
        const body = templateVersionSchema.parse(parseBody(event));
        const template = await repository.getTemplate(templateId);
        if (!template) return notFound('Template not found', correlationId);
        assertTeamScope(auth, template.teamId);
        const result = await repository.createTemplateVersion(
          templateId,
          template.teamId,
          body.content,
          body.contentType,
          auth.email,
          body.changeNotes,
        );
        await withAudit(auth.email, 'CREATE_VERSION', 'TEMPLATE', templateId, correlationId, null, result);
        return json(201, result, correlationId);
      }
      if (method === 'GET') {
        const items = await repository.listTemplateVersions(templateId);
        return json(200, { items }, correlationId);
      }
    }

    const specificVersionMatch = path.match(/^\/artifact\/templates\/([^/]+)\/versions\/(\d+)$/);
    if (specificVersionMatch && method === 'GET') {
      const [, templateId, versionRaw] = specificVersionMatch;
      const result = await repository.getTemplateVersion(templateId, Number(versionRaw));
      return result ? json(200, result, correlationId) : notFound('Version not found', correlationId);
    }

    const publishMatch = path.match(/^\/artifact\/templates\/([^/]+)\/versions\/(\d+)\/publish$/);
    if (publishMatch && method === 'POST') {
      const [, templateId, versionRaw] = publishMatch;
      assertRole(auth, 'NotificationManager');
      await repository.publishTemplateVersion(templateId, Number(versionRaw));
      await withAudit(auth.email, 'PUBLISH_VERSION', 'TEMPLATE', templateId, correlationId, null, { version: Number(versionRaw) });
      return json(200, { templateId, version: Number(versionRaw), state: 'PUBLISHED' }, correlationId);
    }

    const ruleGroupMatch = path.match(/^\/artifact\/teams\/([^/]+)\/rule-groups$/);
    if (ruleGroupMatch) {
      const [, teamId] = ruleGroupMatch;
      assertTeamScope(auth, teamId);
      if (method === 'POST') {
        assertRole(auth, 'NotificationManager');
        const body = ruleGroupCreateSchema.parse(parseBody(event));
        await repository.createRuleGroup(teamId, body, auth.email);
        await withAudit(auth.email, 'CREATE', 'RULE_GROUP', body.ruleGroupId, correlationId, null, body);
        return json(201, body, correlationId);
      }
      if (method === 'GET') {
        const items = await repository.listRuleGroupsByTeam(teamId);
        return json(200, { items }, correlationId);
      }
    }

    const rulesByTeamMatch = path.match(/^\/artifact\/teams\/([^/]+)\/rules$/);
    if (rulesByTeamMatch) {
      const [, teamId] = rulesByTeamMatch;
      assertTeamScope(auth, teamId);
      if (method === 'POST') {
        assertRole(auth, 'NotificationManager');
        const body = ruleCreateSchema.parse(parseBody(event));
        await repository.createRule(teamId, body, auth.email);
        await withAudit(auth.email, 'CREATE', 'RULE', body.ruleId, correlationId, null, body);
        return json(201, body, correlationId);
      }
      if (method === 'GET') {
        const items = await repository.listRulesByTeam(teamId);
        return json(200, { items }, correlationId);
      }
    }

    const rulePatchMatch = path.match(/^\/artifact\/rules\/([^/]+)$/);
    if (rulePatchMatch && method === 'PATCH') {
      const [, ruleId] = rulePatchMatch;
      const existing = await repository.getRule(ruleId);
      if (!existing) return notFound('Rule not found', correlationId);
      assertTeamScope(auth, existing.teamId);
      assertRole(auth, 'NotificationManager');
      const body = rulePatchSchema.parse(parseBody(event));
      const after = await repository.patchRule(ruleId, body);
      await withAudit(auth.email, 'UPDATE', 'RULE', ruleId, correlationId, existing, after);
      return json(200, after, correlationId);
    }

    const bindMatch = path.match(/^\/artifact\/rules\/([^/]+)\/bind-template$/);
    if (bindMatch && method === 'POST') {
      const [, ruleId] = bindMatch;
      const existing = await repository.getRule(ruleId);
      if (!existing) return notFound('Rule not found', correlationId);
      assertTeamScope(auth, existing.teamId);
      assertRole(auth, 'NotificationManager');
      const body = bindTemplateSchema.parse(parseBody(event));
      const after = await repository.bindTemplate(ruleId, body);
      await withAudit(auth.email, 'BIND_TEMPLATE', 'RULE', ruleId, correlationId, existing, after);
      return json(200, after, correlationId);
    }

    const ruleSubsMatch = path.match(/^\/artifact\/rules\/([^/]+)\/subscriptions$/);
    if (ruleSubsMatch) {
      const [, ruleId] = ruleSubsMatch;
      const existingRule = await repository.getRule(ruleId);
      if (!existingRule) return notFound('Rule not found', correlationId);
      assertTeamScope(auth, existingRule.teamId);

      if (method === 'POST') {
        assertRole(auth, 'NotificationManager');
        const body = subscriptionCreateSchema.parse(parseBody(event));
        await repository.createSubscription(ruleId, body);
        await withAudit(auth.email, 'CREATE', 'SUBSCRIPTION', body.subscriptionId, correlationId, null, body);
        return json(201, body, correlationId);
      }

      if (method === 'GET') {
        const items = await repository.listSubscriptions(ruleId);
        return json(200, { items }, correlationId);
      }
    }

    const subDeleteMatch = path.match(/^\/artifact\/subscriptions\/([^/]+)$/);
    if (subDeleteMatch && method === 'DELETE') {
      assertRole(auth, 'NotificationManager');
      const [, subscriptionId] = subDeleteMatch;
      await repository.deleteSubscription(subscriptionId);
      await withAudit(auth.email, 'DELETE', 'SUBSCRIPTION', subscriptionId, correlationId, null, null);
      return json(204, {}, correlationId);
    }

    return notFound(`No route for ${method} ${path}`, correlationId);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('Validation failed', error.flatten(), correlationId);
    }
    if (error instanceof Error && error.message === 'Missing Authorization header') {
      return unauthorized('Missing auth token', correlationId);
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return forbidden(error.message, correlationId);
    }

    logger.error('artifact handler failed', {
      service: config.service,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return internalError('Internal server error', correlationId);
  }
};
