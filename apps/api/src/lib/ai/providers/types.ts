export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  text: string;
  provider: string;
  model: string;
  isMock: boolean;
}

export interface IAIProvider {
  readonly name: string;
  readonly isMock: boolean;
  generate(req: AICompletionRequest): Promise<AICompletionResponse>;
}
