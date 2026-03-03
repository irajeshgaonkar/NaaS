import { config } from '../config.js';
import { getSecret } from './secrets.js';
import type { EmailMessage, EmailProvider, SendResult } from './types.js';

interface GraphEmailSecret {
  accessToken: string;
  tenantId?: string;
}

export class MicrosoftGraphEmailProvider implements EmailProvider {
  async send(msg: EmailMessage): Promise<SendResult> {
    const secret = JSON.parse(await getSecret(config.graphEmailSecretArn)) as GraphEmailSecret;
    const sender = msg.sender ?? 'no-reply@contoso.com';

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: msg.subject,
          body: {
            contentType: 'HTML',
            content: msg.body,
          },
          toRecipients: msg.to.map((email) => ({ emailAddress: { address: email } })),
          ccRecipients: (msg.cc ?? []).map((email) => ({ emailAddress: { address: email } })),
          bccRecipients: (msg.bcc ?? []).map((email) => ({ emailAddress: { address: email } })),
        },
      }),
    });

    if (response.ok) return { accepted: true };
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      return { accepted: false, transientError: true, details: { status: response.status } };
    }
    return { accepted: false, transientError: false, details: { status: response.status } };
  }
}
