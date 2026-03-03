export const config = {
  service: 'artifact-service',
  artifactsTable: process.env.ARTIFACTS_TABLE ?? 'naas-artifacts',
  auditTable: process.env.AUDIT_TABLE ?? 'naas-audit',
  templateBucket: process.env.TEMPLATE_BUCKET ?? 'naas-templates',
};
