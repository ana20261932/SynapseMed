import { ISpeechToTextAdapter, TranscriptionResult } from './ISpeechToTextAdapter';

export class MockSpeechToTextAdapter implements ISpeechToTextAdapter {
  readonly providerName = 'watson-speech-to-text-mock';
  readonly isMock = true;

  async transcribeAudio(audioBuffer: Buffer, _options?: { contentType?: string; languageCode?: string }): Promise<TranscriptionResult> {
    return {
      transcript: `[MOCK TRANSCRIPTION] Patient presents with... (This is a mock transcription of ${(audioBuffer.length / 1024).toFixed(2)} KB of audio. Configure WATSON_SPEECH_TO_TEXT credentials to use the real service.)`,
      confidence: 0.95,
      isMock: true,
    };
  }
}

let instance: MockSpeechToTextAdapter | null = null;
export function getSpeechToTextAdapter(): ISpeechToTextAdapter {
  if (!instance) instance = new MockSpeechToTextAdapter();
  return instance;
}
