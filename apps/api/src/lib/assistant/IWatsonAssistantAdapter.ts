/**
 * IWatsonAssistantAdapter — IBM Watson Assistant integration
 * For booking appointments, intake forms, screening queries
 */
export interface WatsonMessage {
  text: string;
  context?: Record<string, any>;
}

export interface WatsonResponse {
  output: {
    generic: Array<{ response_type: string; text?: string; [key: string]: any }>;
  };
  context?: Record<string, any>;
}

export interface IWatsonAssistantAdapter {
  readonly providerName: string;
  readonly isMock: boolean;
  sendMessage(sessionId: string | null, message: WatsonMessage): Promise<WatsonResponse>;
}
