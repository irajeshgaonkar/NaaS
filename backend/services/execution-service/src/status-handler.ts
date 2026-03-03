import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { assertRole, assertTeamScope, parseAuthContext } from '../../../packages/shared/src/auth.js';
import { forbidden, internalError, json, notFound, unauthorized } from '../../../packages/shared/src/http.js';
import { executionRepository } from './repository.js';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const correlationId = event.headers['x-correlation-id'] ?? event.requestContext.requestId;

  try {
    const auth = parseAuthContext(event);
    assertRole(auth, 'NotificationUser');

    const notificationMatch = event.rawPath.match(/^\/execute\/notifications\/([^/]+)$/);
    if (event.requestContext.http.method === 'GET' && notificationMatch) {
      const notification = await executionRepository.getNotification(notificationMatch[1]);
      return notification ? json(200, notification, correlationId) : notFound('Notification not found', correlationId);
    }

    const metricMatch = event.rawPath.match(/^\/execute\/teams\/([^/]+)\/metrics\/summary$/);
    if (event.requestContext.http.method === 'GET' && metricMatch) {
      const teamId = metricMatch[1];
      assertTeamScope(auth, teamId);
      const summary = await executionRepository.getTeamMetricsSummary(teamId);
      return json(200, { teamId, summary }, correlationId);
    }

    return notFound('Route not found', correlationId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Missing Authorization header') {
      return unauthorized('Missing auth token', correlationId);
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return forbidden(error.message, correlationId);
    }
    return internalError('Internal server error', correlationId);
  }
};
