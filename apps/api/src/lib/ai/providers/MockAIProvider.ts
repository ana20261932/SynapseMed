import { IAIProvider, AICompletionRequest, AICompletionResponse } from './types';

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock';
  readonly isMock = true;

  async generate(req: AICompletionRequest): Promise<AICompletionResponse> {
    return {
      text: `[MOCK AI] Draft response for: "${req.prompt.slice(0, 100)}${req.prompt.length > 100 ? '...' : ''}". This is a simulated AI output requiring human review.`,
      provider: this.name,
      model: 'mock',
      isMock: true,
    };
  }
}
