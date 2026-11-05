import { IAIProvider, AICompletionRequest, AICompletionResponse } from './types';

export class WatsonxProvider implements IAIProvider {
  readonly name = 'watsonx';
  readonly isMock = false;
  private apiKey: string;
  private projectId: string;
  private modelId: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; projectId: string; modelId?: string; url?: string }) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.modelId = config.modelId || 'ibm/granite-13b-chat-v2';
    this.baseUrl = config.url || 'https://us-south.ml.cloud.ibm.com';
  }

  private async getToken(): Promise<string> {
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(this.apiKey)}`,
    });
    if (!res.ok) throw new Error(`Watsonx IAM auth failed: ${res.status}`);
    const data = await res.json() as any;
    return data.access_token;
  }

  async generate(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey || !this.projectId) throw new Error('WATSONX_NOT_CONFIGURED');
    const token = await this.getToken();
    const url = `${this.baseUrl}/ml/v1/text/generation?version=2023-05-29`;
    const prompt = req.systemPrompt ? `${req.systemPrompt}\n\n${req.prompt}` : req.prompt;
    const body = {
      input: prompt,
      parameters: {
        decoding_method: 'greedy',
        max_new_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
      },
      model_id: this.modelId,
      project_id: this.projectId,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Watsonx API error: ${res.status} ${err}`);
    }
    const data = await res.json() as any;
    const text = data?.results?.[0]?.generated_text || '';
    return { text, provider: this.name, model: this.modelId, isMock: false };
  }
}
