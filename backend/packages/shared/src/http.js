export const json = (statusCode, body, correlationId) => ({
    statusCode,
    headers: {
        'content-type': 'application/json',
        ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
    },
    body: JSON.stringify(body),
});
export const badRequest = (message, details, correlationId) => json(400, { message, details }, correlationId);
export const unauthorized = (message = 'Unauthorized', correlationId) => json(401, { message }, correlationId);
export const forbidden = (message = 'Forbidden', correlationId) => json(403, { message }, correlationId);
export const notFound = (message = 'Not found', correlationId) => json(404, { message }, correlationId);
export const tooManyRequests = (message, retryAfterSeconds, correlationId) => json(429, { message, retryAfterSeconds }, correlationId);
export const internalError = (message, correlationId) => json(500, { message }, correlationId);
