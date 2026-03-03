import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, EventBridgeEvent } from 'aws-lambda';
import { ZodError } from 'zod';
import { assertRole, assertTeamScope, parseAuthContext } from '../../../packages/shared/src/auth.js';
import { badRequest, forbidden, internalError, json, notFound, tooManyRequests, unauthorized } from '../../../packages/shared/src/http.js';
import { logger } from '../../../packages/shared/src/logger.js';
import { config } from './config.js';
import { processTrigger } from './execution-engine.js';
import { triggerEventDetailSchema, triggerPayloadSchema } from './schemas.js';

type TriggerEvent = APIGatewayProxyEventV2 | EventBridgeEvent<'naas.rule.trigger', Record<string, unknown>>;

const isApiGateway = (event: TriggerEvent): event is APIGatewayProxyEventV2 =>
  'requestContext' in event && 'http' in event.requestContext;

export const handler = async (event: TriggerEvent): Promise<APIGatewayProxyResultV2 | void> => {
  const correlationId =
    (isApiGateway(event)
      ? event.headers['x-correlation-id'] ?? event.requestContext.requestId
      : (event.id as string | undefined)) ?? randomUUID();

  try {
    if (isApiGateway(event)) {
      const method = event.requestContext.http.method;
      const path = event.rawPath;

      if (method !== 'POST') return notFound('Only POST supported on trigger handler', correlationId);

      const ruleNameMatch = path.match(/^\/execute\/rules\/([^/]+)\/trigger$/);
      if (!ruleNameMatch) return notFound('Route not found', correlationId);

      const auth = parseAuthContext(event);
      assertRole(auth, 'NotificationManager');

      const body = triggerPayloadSchema.parse(event.body ? JSON.parse(event.body) : {});
      const teamId = event.headers['x-team-id'];
      if (!teamId) return badRequest('x-team-id header is required for ruleName trigger', undefined, correlationId);
      assertTeamScope(auth, teamId);

      const result = await processTrigger({
        ruleName: decodeURIComponent(ruleNameMatch[1]),
        teamId,
        payload: body,
        correlationId,
        actor: auth.email,
      });

      return json(202, result, correlationId);
    }

    const detail = triggerEventDetailSchema.parse(event.detail);

    await processTrigger({
      ruleName: detail.ruleName,
      ruleId: detail.ruleId,
      teamId: detail.teamId,
      payload: detail,
      correlationId,
      actor: 'eventbridge',
    });

    logger.info('eventbridge trigger processed', {
      service: config.service,
      correlationId,
      detailType: event['detail-type'],
    });
    return;
  } catch (error) {
    if (!isApiGateway(event)) {
      logger.error('eventbridge trigger failed', {
        service: config.service,
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (error instanceof ZodError) {
      return badRequest('Validation failed', error.flatten(), correlationId);
    }
    if (error instanceof Error && error.message === 'Missing Authorization header') {
      return unauthorized('Missing auth token', correlationId);
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return forbidden(error.message, correlationId);
    }
    if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 429) {
      return tooManyRequests(error.message, 60, correlationId);
    }
    if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 400) {
      return badRequest(error.message, undefined, correlationId);
    }

    logger.error('trigger handler failed', {
      service: config.service,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return internalError('Internal server error', correlationId);
  }
};
