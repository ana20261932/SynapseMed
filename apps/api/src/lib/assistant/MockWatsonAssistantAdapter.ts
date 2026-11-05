import { IWatsonAssistantAdapter, WatsonMessage, WatsonResponse } from './IWatsonAssistantAdapter';
import { randomUUID } from 'crypto';

export class MockWatsonAssistantAdapter implements IWatsonAssistantAdapter {
  readonly providerName = 'watson-assistant-mock';
  readonly isMock = true;

  async sendMessage(sessionId: string | null, message: WatsonMessage): Promise<WatsonResponse> {
    return {
      output: {
        generic: [
          {
            response_type: 'text',
            text: `[MOCK WATSON ASSISTANT] I can help you book appointments, complete intake forms, or answer general health questions. You said: "${message.text}". (This is a mock response - configure WATSON_ASSISTANT credentials to use the real service.)`,
          },
        ],
      },
      context: {
        session_id: sessionId || randomUUID(),
      },
    };
  }
}

let instance: MockWatsonAssistantAdapter | null = null;
export function getWatsonAssistantAdapter(): IWatsonAssistantAdapter {
  if (!instance) instance = new MockWatsonAssistantAdapter();
  return instance;
}
