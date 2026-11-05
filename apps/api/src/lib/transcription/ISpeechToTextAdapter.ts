/**
 * ISpeechToTextAdapter — IBM Watson Speech to Text integration
 * For clinical dictation/transcription
 */
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: Array<{ word: string; start: number; end: number; confidence: number }>;
  isMock: boolean;
}

export interface ISpeechToTextAdapter {
  readonly providerName: string;
  readonly isMock: boolean;
  transcribeAudio(audioBuffer: Buffer, options?: { contentType?: string; languageCode?: string }): Promise<TranscriptionResult>;
}
