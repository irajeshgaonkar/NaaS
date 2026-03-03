import { config } from '../config.js';
import { getSecret } from './secrets.js';
import type { ChatMessage, ChatProvider, SendResult } from './types.js';

interface SlackSecret {
  webhookUrl: string;
}

export class SlackWebhookProvider implements ChatProvider {
  async send(msg: ChatMessage): Promise<SendResult> {
    const secret = JSON.parse(await getSecret(config.slackWebhookSecretArn)) as SlackSecret;

    const response = await fetch(secret.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg.body }),
    });

    if (response.ok) return { accepted: true };
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      return { accepted: false, transientError: true, details: { status: response.status } };
    }
    return { accepted: false, transientError: false, details: { status: response.status } };
  }
}
