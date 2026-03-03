import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});
const cache = new Map<string, string>();

export const getSecret = async (secretArn: string): Promise<string> => {
  if (!secretArn) throw new Error('Missing secret ARN');
  const cached = cache.get(secretArn);
  if (cached) return cached;

  const res = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!res.SecretString) throw new Error(`Secret has no string value: ${secretArn}`);

  cache.set(secretArn, res.SecretString);
  return res.SecretString;
};
