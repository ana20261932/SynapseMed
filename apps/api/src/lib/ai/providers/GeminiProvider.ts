import { IAIProvider, AICompletionRequest, AICompletionResponse } from './types';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini';
  readonly isMock = false;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: req.systemPrompt ? `${req.systemPrompt}\n\n${req.prompt}` : req.prompt }] }],
      generationConfig: {
        temperature: req.temperature ?? 0.2,
        maxOutputTokens: req.maxTokens ?? 1024,
      },
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${err}`);
    }
    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text, provider: this.name, model: this.model, isMock: false };
  }
}
