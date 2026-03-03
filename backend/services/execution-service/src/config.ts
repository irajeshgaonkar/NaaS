export const config = {
  service: 'execution-service',
  artifactsTable: process.env.ARTIFACTS_TABLE ?? 'naas-artifacts',
  executionTable: process.env.EXECUTION_TABLE ?? 'naas-execution',
  auditTable: process.env.AUDIT_TABLE ?? 'naas-audit',
  templateBucket: process.env.TEMPLATE_BUCKET ?? 'naas-templates',
  notificationQueueUrl: process.env.NOTIFICATION_QUEUE_URL ?? '',
  triggersPerMinute: Number(process.env.TEAM_TRIGGER_LIMIT_PER_MINUTE ?? '60'),
  sendsPerMinute: Number(process.env.TEAM_SEND_LIMIT_PER_MINUTE ?? '500'),
  graphEmailSecretArn: process.env.GRAPH_EMAIL_SECRET_ARN ?? '',
  graphTeamsSecretArn: process.env.GRAPH_TEAMS_SECRET_ARN ?? '',
  slackWebhookSecretArn: process.env.SLACK_WEBHOOK_SECRET_ARN ?? '',
  metricNamespace: process.env.METRIC_NAMESPACE ?? 'NaaS/Execution',
};
