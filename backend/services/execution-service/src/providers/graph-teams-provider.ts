import { config } from '../config.js';
import { getSecret } from './secrets.js';
import type { SendResult, TeamsMessage, TeamsProvider } from './types.js';

interface GraphTeamsSecret {
  accessToken: string;
  teamId: string;
  channelId: string;
}

export class MicrosoftGraphTeamsProvider implements TeamsProvider {
  async send(msg: TeamsMessage): Promise<SendResult> {
    const secret = JSON.parse(await getSecret(config.graphTeamsSecretArn)) as GraphTeamsSecret;

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${secret.teamId}/channels/${secret.channelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType: 'html',
            content: msg.body,
          },
        }),
      },
    );

    if (response.ok) return { accepted: true };
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      return { accepted: false, transientError: true, details: { status: response.status } };
    }
    return { accepted: false, transientError: false, details: { status: response.status } };
  }
}
