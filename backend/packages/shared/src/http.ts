import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export const json = <T>(statusCode: number, body: T, correlationId?: string): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
  },
  body: JSON.stringify(body),
});

export const badRequest = (message: string, details?: unknown, correlationId?: string) =>
  json(400, { message, details }, correlationId);

export const unauthorized = (message = 'Unauthorized', correlationId?: string) =>
  json(401, { message }, correlationId);

export const forbidden = (message = 'Forbidden', correlationId?: string) =>
  json(403, { message }, correlationId);

export const notFound = (message = 'Not found', correlationId?: string) => json(404, { message }, correlationId);

export const tooManyRequests = (message: string, retryAfterSeconds: number, correlationId?: string) =>
  json(429, { message, retryAfterSeconds }, correlationId);

export const internalError = (message: string, correlationId?: string) =>
  json(500, { message }, correlationId);
