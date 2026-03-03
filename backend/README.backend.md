# NaaS Backend (AWS-First, Platform-Agnostic)

This repository now includes a production-oriented backend monorepo for Notification-as-a-Service (NaaS):

- `services/artifact-service`: CRUD and artifact lifecycle management
- `services/execution-service`: trigger intake, rendering, relay, worker dispatch
- `packages/shared`: shared auth, types, HTTP helpers, logging, metrics, templating
- `infra/cdk`: AWS infrastructure as code (CDK v2)

## Architecture

### Service Separation

1. Artifact Service
- Owns teams, members, templates, template versions, rules, rule groups, subscriptions
- Persists metadata in DynamoDB and template bodies/attachments in S3
- Emits audit logs to DynamoDB

2. Execution Service
- Accepts triggers from REST and EventBridge (`naas.rule.trigger`)
- Applies team-level rate limits
- Resolves artifacts, renders placeholders, resolves recipients
- Enqueues dispatch jobs to SQS
- Worker sends notifications through provider adapters (Graph Email/Teams, Slack)
- Stores execution records + emits CloudWatch metrics

### Event-Driven Flow

1. `POST /execute/rules/{ruleName}/trigger` or EventBridge event
2. Execution Trigger Lambda validates + checks idempotency + rate limit
3. Rendered notification job sent to `naas-notification-queue`
4. Worker Lambda processes queue, dispatches via provider adapters
5. Retries handled by SQS/Lambda; poison messages to `naas-notification-dlq`

## Data Model

## DynamoDB Tables

### `naas-artifacts`
Primary key: `pk` / `sk`

- Team: `pk=TEAM#{teamId}`, `sk=META`
- Team member: `pk=TEAM#{teamId}`, `sk=MEMBER#{email}`
- Template meta: `pk=TEMPLATE#{templateId}`, `sk=META`
- Template version: `pk=TEMPLATE#{templateId}`, `sk=VERSION#{00001}`
- Rule: `pk=RULE#{ruleId}`, `sk=META`
- Rule group: `pk=RULEGROUP#{ruleGroupId}`, `sk=META`
- Subscription: `pk=RULE#{ruleId}`, `sk=SUB#{subscriptionId}`

GSIs:
- `gsi1(gsi1pk,gsi1sk)` for team-centric listing (templates/rules/rule groups/teams)
- `gsi2(gsi2pk,gsi2sk)` for secondary lookup:
  - Rule by name: `gsi2pk=RULE_NAME#{ruleName}`
  - Subscription by id: `gsi2pk=SUB#{subscriptionId}`

### `naas-execution`
Primary key: `pk` / `sk`, TTL attribute: `expiresAt`

- Notification record: `pk=NOTIF#{notificationId}`, `sk=META`
- Idempotency record: `pk=OP#{operationId}`, `sk=META`
- Rate window counter: `pk=RATE#{teamId}#{minuteBucket}`, `sk=META`
- Team metrics aggregate: `pk=TEAMMETRIC#{teamId}`, `sk=DAY#{yyyy-mm-dd}`

### `naas-audit`
Primary key: `pk` / `sk`

- Audit event: `pk=AUDIT#{yyyy-mm-dd}`, `sk={timestamp}#{uuid}`

## S3 Object Key Strategy

Bucket: `${account}-${region}-naas-templates` (versioning enabled)

- Template version content:
  - `teams/{teamId}/templates/{templateId}/versions/v{n}/content`
- Runtime attachments:
  - `teams/{teamId}/attachments/{notificationId}/{fileName}`

This supports immutable template versions and rollback by selecting prior version metadata in DynamoDB.

## Template Versioning

Implemented APIs:
- Create template
- Create version
- List versions
- Get specific version
- Publish version
- Rule template binding (`version` or `latest-published`)

Model behavior:
- Template metadata tracks `latestVersion`, `latestPublishedVersion`, and `state`
- Version content lives in S3; version index is in DynamoDB

## Rate Limiting

Fixed-window, DynamoDB-native counters:

- Trigger layer: `TEAM_TRIGGER_LIMIT_PER_MINUTE` (default `60`)
- Worker send layer: `TEAM_SEND_LIMIT_PER_MINUTE` (default `500`)

On breach, API returns `429 Too Many Requests`.

## Idempotency

If `operationId` is supplied in trigger payload:
- first request inserts `OP#{operationId}` mapping
- repeated request returns prior `notificationId` and does not enqueue duplicate dispatch

## Placeholder Engine

Syntax supported:
- `{{customProperties.CustomerName}}`
- `{{customProperties.Region}}`
- `{{customTables[0].heading}}`

Behavior:
- strict mode: reject trigger when placeholders are missing
- non-strict mode: leaves unresolved placeholder text unchanged

Implementation is safe (path traversal + string replacement, no `eval`).

## Security & Authorization

- JWT-style auth parser with mock token mode:
  - `Bearer email|role|teamA,teamB`
- Roles:
  - `NotificationAdmin`
  - `NotificationManager`
  - `NotificationUser`
- Team-scoped checks on artifact and execution routes
- Zod validation on request payloads
- Least-privilege IAM grants in CDK for table/bucket/queue/secret access

## Provider Abstraction

In `services/execution-service/src/providers/types.ts`:

- `EmailProvider`
- `TeamsProvider`
- `ChatProvider`

AWS-first adapters:

- `MicrosoftGraphEmailProvider`
- `MicrosoftGraphTeamsProvider`
- `SlackWebhookProvider`

Secrets loaded from AWS Secrets Manager.

## API Surface

Artifact Service:
- `POST /artifact/teams`
- `GET /artifact/teams`
- `GET /artifact/teams/{teamId}`
- `PATCH /artifact/teams/{teamId}`
- `DELETE /artifact/teams/{teamId}`
- `POST /artifact/teams/{teamId}/members`
- `PATCH /artifact/teams/{teamId}/members/{email}`
- `DELETE /artifact/teams/{teamId}/members/{email}`
- `POST /artifact/teams/{teamId}/templates`
- `GET /artifact/teams/{teamId}/templates`
- `GET /artifact/templates/{templateId}`
- `POST /artifact/templates/{templateId}/versions`
- `GET /artifact/templates/{templateId}/versions`
- `GET /artifact/templates/{templateId}/versions/{version}`
- `POST /artifact/templates/{templateId}/versions/{version}/publish`
- `POST /artifact/teams/{teamId}/rule-groups`
- `GET /artifact/teams/{teamId}/rule-groups`
- `POST /artifact/teams/{teamId}/rules`
- `GET /artifact/teams/{teamId}/rules`
- `PATCH /artifact/rules/{ruleId}`
- `POST /artifact/rules/{ruleId}/bind-template`
- `POST /artifact/rules/{ruleId}/subscriptions`
- `GET /artifact/rules/{ruleId}/subscriptions`
- `DELETE /artifact/subscriptions/{subscriptionId}`

Execution Service:
- `POST /execute/rules/{ruleName}/trigger`
- `GET /execute/notifications/{notificationId}`
- `GET /execute/teams/{teamId}/metrics/summary`

## EventBridge Integration

Bus: `naas-bus`

- Detail type: `naas.rule.trigger`
- Trigger lambda subscribed via EventBridge rule
- Daily digest sample schedule configured in CDK

Helper:
- `services/execution-service/src/event-producer.ts`

## Observability

- Structured JSON logs with correlation id
- EMF custom metrics:
  - `NotificationsTriggered`
  - `NotificationsSent`
  - `NotificationsFailed`
  - `SendLatencyMs`
  - `ThrottledRequests`
  - `PerChannelSent`
  - `PerTeamSent`
- CloudWatch Dashboard (CDK + `infra/cdk/config/dashboard.json`)
- Alarms:
  - worker failure threshold
  - DLQ depth threshold

## Deployment (CDK)

From `infra/cdk`:

1. `npm install`
2. `npm run synth`
3. `npm run deploy`

Bootstrapping if needed:
- `npx cdk bootstrap aws://<account>/<region>`

## Local Dev / Test

Sample events:
- `events/api-trigger-event.json`
- `events/eventbridge-trigger.json`

Use Lambda invoke or SAM local with these payloads.

Mock auth header example:
- `authorization: Bearer manager@naas.dev|NotificationManager|team-platform`

## Frontend Wiring (Amplify + API)

The frontend now supports backend mode through environment variables:

- `VITE_API_MODE=backend`
- `VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod`
- `VITE_DEFAULT_TEAM_ID=team-platform`

Local frontend example:
- copy `frontend/.env.example` to `frontend/.env`
- run `npm run dev` from `frontend`

Amplify Hosting via CDK is optional and context-driven:

```bash
cd infra/cdk
npm run deploy -- --context amplifyRepoUrl=https://github.com/<org>/<repo> --context amplifyTokenSecretName=<github-token-secret-name> --context amplifyBranch=main
```

Where:
- `amplifyRepoUrl`: Git repository URL containing `frontend/`
- `amplifyTokenSecretName`: Secrets Manager secret name with Git access token
- `amplifyBranch`: branch to deploy (default `main`)

If these context values are omitted, backend infrastructure still deploys and CDK outputs a setup reminder.

## Notes for Production Hardening

- Replace mock JWT parser with API Gateway JWT authorizer or Cognito/JWKS validation
- Restrict secret IAM policies to specific ARNs
- Add canary + blue/green deployment (CodeDeploy)
- Add contract/integration tests against LocalStack or ephemeral AWS account
