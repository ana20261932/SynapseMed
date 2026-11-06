/**
 * WatsonAssistantAdapter — IBM Watson Assistant v2 integration
 *
 * Uses the Watson Assistant v2 REST API directly (no SDK dependency required).
 * IAM API-key → IAM token exchange is handled internally.
 * Sessions are created on demand and reused within a conversation.
 *
 * Required env vars:
 *   WATSON_ASSISTANT_URL          — e.g. https://api.us-south.assistant.watson.cloud.ibm.com
 *   WATSON_ASSISTANT_API_KEY      — IBM Cloud IAM API key
 *   WATSON_ASSISTANT_ASSISTANT_ID — Watson Assistant instance/assistant ID
 *   WATSON_ASSISTANT_API_VERSION  — API version date (default: 2023-06-15)
 */
import { IWatsonAssistantAdapter, WatsonMessage, WatsonResponse } from './IWatsonAssistantAdapter';

export class WatsonAssistantAdapter implements IWatsonAssistantAdapter {
  readonly providerName = 'ibm-watson-assistant';
  readonly isMock = false;

  private url: string;
  private apiKey: string;
  private assistantId: string;
  private apiVersion: string;
  private _cachedToken: string | null = null;
  private _tokenExpiry = 0;

  constructor(config: { url: string; apiKey: string; assistantId: string; apiVersion?: string }) {
    this.url = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.assistantId = config.assistantId;
    this.apiVersion = config.apiVersion ?? '2023-06-15';
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this._cachedToken && now < this._tokenExpiry) return this._cachedToken;
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(this.apiKey)}`,
    });
    if (!res.ok) throw new Error(`Watson Assistant IAM auth failed: ${res.status}`);
    const data = await res.json() as any;
    this._cachedToken = data.access_token as string;
    this._tokenExpiry = now + (data.expires_in - 300) * 1000;
    return this._cachedToken!;
  }

  private headers(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /** Create a new Watson Assistant session; returns the session_id. */
  async createSession(): Promise<string> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.url}/v2/assistants/${this.assistantId}/sessions?version=${this.apiVersion}`,
      { method: 'POST', headers: this.headers(token) }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Watson Assistant createSession failed: ${res.status} ${body}`);
    }
    const data = await res.json() as any;
    return data.session_id as string;
  }

  /** Delete a Watson Assistant session. */
  async deleteSession(sessionId: string): Promise<void> {
    const token = await this.getToken();
    await fetch(
      `${this.url}/v2/assistants/${this.assistantId}/sessions/${sessionId}?version=${this.apiVersion}`,
      { method: 'DELETE', headers: this.headers(token) }
    );
  }

  /**
   * Send a message to Watson Assistant.
   * If sessionId is null, a new session is created automatically.
   * The returned context includes the session_id for subsequent calls.
   */
  async sendMessage(sessionId: string | null, message: WatsonMessage): Promise<WatsonResponse> {
    const token = await this.getToken();
    const sid = sessionId ?? await this.createSession();

    const body: any = {
      input: { message_type: 'text', text: message.text },
    };
    if (message.context) {
      body.context = message.context;
    }

    const res = await fetch(
      `${this.url}/v2/assistants/${this.assistantId}/sessions/${sid}/message?version=${this.apiVersion}`,
      { method: 'POST', headers: this.headers(token), body: JSON.stringify(body) }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Watson Assistant sendMessage failed: ${res.status} ${errBody}`);
    }
    const data = await res.json() as any;

    return {
      output: {
        generic: (data.output?.generic ?? []) as Array<{ response_type: string; text?: string; [key: string]: any }>,
      },
      context: {
        ...(data.context ?? {}),
        session_id: sid,
      },
    };
  }
}

export function getWatsonAssistantAdapter(): IWatsonAssistantAdapter {
  const url = process.env.WATSON_ASSISTANT_URL;
  const apiKey = process.env.WATSON_ASSISTANT_API_KEY;
  const assistantId = process.env.WATSON_ASSISTANT_ASSISTANT_ID;
  if (!url || !apiKey || !assistantId) {
    throw new Error(
      'WATSON_ASSISTANT_NOT_CONFIGURED: Set WATSON_ASSISTANT_URL, WATSON_ASSISTANT_API_KEY, and WATSON_ASSISTANT_ASSISTANT_ID.'
    );
  }
  return new WatsonAssistantAdapter({ url, apiKey, assistantId });
}
