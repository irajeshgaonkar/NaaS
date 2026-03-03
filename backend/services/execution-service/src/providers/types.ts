export interface SendResult {
  providerMessageId?: string;
  accepted: boolean;
  transientError?: boolean;
  details?: Record<string, unknown>;
}

export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  sender?: string;
}

export interface TeamsMessage {
  recipients: string[];
  body: string;
}

export interface ChatMessage {
  recipients: string[];
  body: string;
}

export interface EmailProvider {
  send(msg: EmailMessage): Promise<SendResult>;
}

export interface TeamsProvider {
  send(msg: TeamsMessage): Promise<SendResult>;
}

export interface ChatProvider {
  send(msg: ChatMessage): Promise<SendResult>;
}
