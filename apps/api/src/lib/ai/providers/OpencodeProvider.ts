import { IAIProvider, AICompletionRequest, AICompletionResponse } from './types';

export class OpencodeProvider implements IAIProvider {
  readonly name = 'opencode';
  readonly isMock = false;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://opencode.ai/zen/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  async generate(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) throw new Error('OPENCODE_API_KEY_NOT_CONFIGURED');
    const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const messages = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.prompt });
    const body = {
      model: this.model,
      messages,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 1024,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Opencode API error: ${res.status} ${err}`);
    }
    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content || '';
    return { text, provider: this.name, model: this.model, isMock: false };
  }
}
