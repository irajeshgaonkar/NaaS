import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
  aws_apigateway as apigw,
  aws_amplify as amplify,
  aws_cloudwatch as cloudwatch,
  aws_dynamodb as ddb,
  aws_events as events,
  aws_events_targets as eventTargets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_event_sources as eventSources,
  aws_lambda_nodejs as nodejs,
  aws_logs as logs,
  aws_s3 as s3,
  aws_sqs as sqs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NaasPlatformStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const artifactsTable = new ddb.Table(this, 'ArtifactsTable', {
      tableName: 'naas-artifacts',
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    artifactsTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
    artifactsTable.addGlobalSecondaryIndex({
      indexName: 'gsi2',
      partitionKey: { name: 'gsi2pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'gsi2sk', type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    const executionTable = new ddb.Table(this, 'ExecutionTable', {
      tableName: 'naas-execution',
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const auditTable = new ddb.Table(this, 'AuditTable', {
      tableName: 'naas-audit',
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const templateBucket = new s3.Bucket(this, 'TemplateBucket', {
      bucketName: `${this.account}-${this.region}-naas-templates`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const dlq = new sqs.Queue(this, 'NotificationDLQ', {
      queueName: 'naas-notification-dlq',
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: 'naas-notification-queue',
      visibilityTimeout: Duration.seconds(180),
      retentionPeriod: Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 5,
      },
    });

    const naasBus = new events.EventBus(this, 'NaasEventBus', {
      eventBusName: 'naas-bus',
    });

    const lambdaDefaults: Omit<nodejs.NodejsFunctionProps, 'entry' | 'handler'> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
      bundling: { externalModules: ['@aws-sdk/*'] as string[] },
      environment: {
        ARTIFACTS_TABLE: artifactsTable.tableName,
        EXECUTION_TABLE: executionTable.tableName,
        AUDIT_TABLE: auditTable.tableName,
        TEMPLATE_BUCKET: templateBucket.bucketName,
      },
    };

    const artifactApiLambda = new nodejs.NodejsFunction(this, 'ArtifactApiLambda', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../../../backend/services/artifact-service/src/handler.ts'),
      handler: 'handler',
      functionName: 'naas-artifact-api',
    });

    const executionTriggerLambda = new nodejs.NodejsFunction(this, 'ExecutionTriggerLambda', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../../../backend/services/execution-service/src/trigger-handler.ts'),
      handler: 'handler',
      functionName: 'naas-execution-trigger',
      environment: {
        ...lambdaDefaults.environment,
        NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
        TEAM_TRIGGER_LIMIT_PER_MINUTE: '60',
        TEAM_SEND_LIMIT_PER_MINUTE: '500',
        METRIC_NAMESPACE: 'NaaS/Execution',
      },
    });

    const executionStatusLambda = new nodejs.NodejsFunction(this, 'ExecutionStatusLambda', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../../../backend/services/execution-service/src/status-handler.ts'),
      handler: 'handler',
      functionName: 'naas-execution-status',
    });

    const executionWorkerLambda = new nodejs.NodejsFunction(this, 'ExecutionWorkerLambda', {
      ...lambdaDefaults,
      entry: path.join(__dirname, '../../../backend/services/execution-service/src/worker-handler.ts'),
      handler: 'handler',
      functionName: 'naas-execution-worker',
      timeout: Duration.seconds(60),
      environment: {
        ...lambdaDefaults.environment,
        NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
        TEAM_SEND_LIMIT_PER_MINUTE: '500',
        METRIC_NAMESPACE: 'NaaS/Execution',
        GRAPH_EMAIL_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:naas/graph/email',
        GRAPH_TEAMS_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:naas/graph/teams',
        SLACK_WEBHOOK_SECRET_ARN: 'arn:aws:secretsmanager:region:account:secret:naas/slack/webhook',
      },
    });

    executionWorkerLambda.addEventSource(
      new eventSources.SqsEventSource(notificationQueue, {
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(5),
      }),
    );

    artifactsTable.grantReadWriteData(artifactApiLambda);
    artifactsTable.grantReadData(executionTriggerLambda);
    artifactsTable.grantReadData(executionStatusLambda);

    executionTable.grantReadWriteData(executionTriggerLambda);
    executionTable.grantReadData(executionStatusLambda);
    executionTable.grantReadWriteData(executionWorkerLambda);

    auditTable.grantReadWriteData(artifactApiLambda);
    auditTable.grantReadWriteData(executionTriggerLambda);

    templateBucket.grantReadWrite(artifactApiLambda);
    templateBucket.grantReadWrite(executionTriggerLambda);

    notificationQueue.grantSendMessages(executionTriggerLambda);

    executionWorkerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
      }),
    );

    const api = new apigw.RestApi(this, 'NaasApi', {
      restApiName: 'naas-api',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        tracingEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const artifact = api.root.addResource('artifact');
    artifact.addProxy({ defaultIntegration: new apigw.LambdaIntegration(artifactApiLambda), anyMethod: true });

    const execute = api.root.addResource('execute');
    const rules = execute.addResource('rules');
    const ruleName = rules.addResource('{ruleName}');
    ruleName.addResource('trigger').addMethod('POST', new apigw.LambdaIntegration(executionTriggerLambda));

    execute
      .addResource('notifications')
      .addResource('{notificationId}')
      .addMethod('GET', new apigw.LambdaIntegration(executionStatusLambda));

    execute
      .addResource('teams')
      .addResource('{teamId}')
      .addResource('metrics')
      .addResource('summary')
      .addMethod('GET', new apigw.LambdaIntegration(executionStatusLambda));

    new events.Rule(this, 'RuleTriggerEventRule', {
      eventBus: naasBus,
      eventPattern: {
        detailType: ['naas.rule.trigger'],
      },
      targets: [new eventTargets.LambdaFunction(executionTriggerLambda)],
    });

    new events.Rule(this, 'DailyDigestTriggerRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '8' }),
      targets: [
        new eventTargets.LambdaFunction(executionTriggerLambda, {
          event: events.RuleTargetInput.fromObject({
            source: 'naas.scheduler',
            'detail-type': 'naas.rule.trigger',
            detail: {
              teamId: 'team-platform',
              ruleName: 'DailySummary',
              customProperties: { mode: 'daily' },
            },
          }),
        }),
      ],
    });

    new cloudwatch.Alarm(this, 'ExecutionFailureAlarm', {
      metric: executionWorkerLambda.metricErrors({ statistic: 'sum', period: Duration.minutes(5) }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Execution worker failures are above threshold',
    });

    new cloudwatch.Alarm(this, 'NotificationDlqDepthAlarm', {
      metric: dlq.metricApproximateNumberOfMessagesVisible({ statistic: 'avg', period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Notification DLQ has messages',
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NaasDashboard', {
      dashboardName: 'naas-operations-dashboard',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Triggered / Sent / Failed',
        left: [
          new cloudwatch.Metric({ namespace: 'NaaS/Execution', metricName: 'NotificationsTriggered', statistic: 'sum' }),
          new cloudwatch.Metric({ namespace: 'NaaS/Execution', metricName: 'NotificationsSent', statistic: 'sum' }),
          new cloudwatch.Metric({ namespace: 'NaaS/Execution', metricName: 'NotificationsFailed', statistic: 'sum' }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Throttled + DLQ Depth',
        left: [
          new cloudwatch.Metric({ namespace: 'NaaS/Execution', metricName: 'ThrottledRequests', statistic: 'sum' }),
          dlq.metricApproximateNumberOfMessagesVisible({ statistic: 'avg' }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Send Latency p95',
        left: [new cloudwatch.Metric({ namespace: 'NaaS/Execution', metricName: 'SendLatencyMs', statistic: 'p95' })],
      }),
    );

    const amplifyRepoUrl = this.node.tryGetContext('amplifyRepoUrl') as string | undefined;
    const amplifyBranch = (this.node.tryGetContext('amplifyBranch') as string | undefined) ?? 'main';
    const amplifyTokenSecretName = this.node.tryGetContext('amplifyTokenSecretName') as string | undefined;

    if (amplifyRepoUrl && amplifyTokenSecretName) {
      const amplifyApp = new amplify.CfnApp(this, 'NaasFrontendAmplifyApp', {
        name: 'naas-admin-frontend',
        repository: amplifyRepoUrl,
        accessToken: SecretValue.secretsManager(amplifyTokenSecretName).toString(),
        buildSpec: [
          'version: 1',
          'applications:',
          '  - appRoot: frontend',
          '    frontend:',
          '      phases:',
          '        preBuild:',
          '          commands:',
          '            - npm ci',
          '        build:',
          '          commands:',
          '            - npm run build',
          '      artifacts:',
          '        baseDirectory: dist',
          '        files:',
          '          - \"**/*\"',
          '      cache:',
          '        paths:',
          '          - node_modules/**/*',
        ].join('\n'),
        environmentVariables: [
          { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'frontend' },
          { name: 'VITE_API_MODE', value: 'backend' },
          { name: 'VITE_DEFAULT_TEAM_ID', value: 'team-platform' },
          { name: 'VITE_API_BASE_URL', value: api.url.replace(/\/$/, '') },
        ],
      });

      const amplifyBranchResource = new amplify.CfnBranch(this, 'NaasFrontendAmplifyBranch', {
        appId: amplifyApp.attrAppId,
        branchName: amplifyBranch,
        enableAutoBuild: true,
        framework: 'React',
        stage: 'PRODUCTION',
      });

      new CfnOutput(this, 'AmplifyAppId', {
        value: amplifyApp.attrAppId,
      });

      new CfnOutput(this, 'AmplifyBranchUrl', {
        value: `https://${amplifyBranch}.${amplifyApp.attrDefaultDomain}`,
      });

      amplifyBranchResource.addDependency(amplifyApp);
    } else {
      new CfnOutput(this, 'AmplifySetupRequired', {
        value:
          'Amplify app not created. Pass cdk context: amplifyRepoUrl and amplifyTokenSecretName (optional amplifyBranch).',
      });
    }

    new CfnOutput(this, 'ApiBaseUrl', {
      value: api.url.replace(/\/$/, ''),
    });
  }
}
