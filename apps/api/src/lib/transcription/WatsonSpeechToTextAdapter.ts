/**
 * WatsonSpeechToTextAdapter — IBM Watson Speech to Text integration
 *
 * Uses the Watson Speech to Text v1 REST API directly (no SDK dependency required).
 * IAM API-key → IAM token exchange is handled internally.
 * Submits audio buffers for recognition and returns transcription results.
 *
 * Required env vars:
 *   WATSON_SPEECH_TO_TEXT_URL      — e.g. https://api.us-south.speech-to-text.watson.cloud.ibm.com
 *   WATSON_SPEECH_TO_TEXT_API_KEY  — IBM Cloud IAM API key
 *   WATSON_SPEECH_TO_TEXT_MODEL    — e.g. en-US_BroadbandModel (default)
 *                                    For SA English: en-AU_BroadbandModel or en-GB_BroadbandModel
 *
 * Supported content types:
 *   audio/wav, audio/mp3, audio/flac, audio/ogg, audio/webm, audio/l16, audio/basic
 */
import { ISpeechToTextAdapter, TranscriptionResult } from './ISpeechToTextAdapter';

interface WatsonSTTResult {
  results: Array<{
    alternatives: Array<{
      transcript: string;
      confidence: number;
      timestamps?: Array<[string, number, number]>;
      word_confidence?: Array<[string, number]>;
    }>;
    final: boolean;
  }>;
}

export class WatsonSpeechToTextAdapter implements ISpeechToTextAdapter {
  readonly providerName = 'ibm-watson-speech-to-text';
  readonly isMock = false;

  private url: string;
  private apiKey: string;
  private model: string;
  private _cachedToken: string | null = null;
  private _tokenExpiry = 0;

  constructor(config: { url: string; apiKey: string; model?: string }) {
    this.url = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'en-US_BroadbandModel';
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this._cachedToken && now < this._tokenExpiry) return this._cachedToken;
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(this.apiKey)}`,
    });
    if (!res.ok) throw new Error(`Watson STT IAM auth failed: ${res.status}`);
    const data = await res.json() as any;
    this._cachedToken = data.access_token as string;
    this._tokenExpiry = now + (data.expires_in - 300) * 1000;
    return this._cachedToken!;
  }

  /**
   * Transcribe audio using IBM Watson Speech to Text.
   * Returns the top-confidence transcript with word-level timestamps if available.
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    options?: { contentType?: string; languageCode?: string }
  ): Promise<TranscriptionResult> {
    const token = await this.getToken();
    const contentType = options?.contentType ?? 'audio/wav';

    // Resolve the model: use languageCode hint if provided
    let model = this.model;
    if (options?.languageCode) {
      // Map BCP-47 language codes to Watson models where known
      const langMap: Record<string, string> = {
        'en-US': 'en-US_BroadbandModel',
        'en-GB': 'en-GB_BroadbandModel',
        'en-AU': 'en-AU_BroadbandModel',
        'en-ZA': 'en-US_BroadbandModel', // SA English — closest supported model
        'af-ZA': 'en-US_BroadbandModel', // Afrikaans — fallback
        'zu-ZA': 'en-US_BroadbandModel', // Zulu — fallback
        'xh-ZA': 'en-US_BroadbandModel', // Xhosa — fallback
      };
      model = langMap[options.languageCode] ?? this.model;
    }

    const queryParams = new URLSearchParams({
      model,
      timestamps: 'true',
      word_confidence: 'true',
      smart_formatting: 'true',
    });

    const res = await fetch(
      `${this.url}/v1/recognize?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
        },
        body: audioBuffer,
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Watson STT transcription failed: ${res.status} ${errBody}`);
    }

    const data = await res.json() as WatsonSTTResult;
    const finalResults = data.results.filter(r => r.final);
    const best = finalResults.map(r => r.alternatives[0]).filter(Boolean);

    const transcript = best.map(a => a.transcript.trim()).join(' ');
    const confidence =
      best.length > 0
        ? best.reduce((sum, a) => sum + (a.confidence ?? 0), 0) / best.length
        : 0;

    // Flatten word timestamps from all final results
    const words = best.flatMap(a =>
      (a.timestamps ?? []).map((ts, i) => ({
        word: ts[0],
        start: ts[1],
        end: ts[2],
        confidence: (a.word_confidence ?? [])[i]?.[1] ?? confidence,
      }))
    );

    return {
      transcript,
      confidence,
      words: words.length > 0 ? words : undefined,
      isMock: false,
    };
  }
}

export function getSpeechToTextAdapter(): ISpeechToTextAdapter {
  const url = process.env.WATSON_SPEECH_TO_TEXT_URL;
  const apiKey = process.env.WATSON_SPEECH_TO_TEXT_API_KEY;
  if (!url || !apiKey) {
    throw new Error(
      'WATSON_STT_NOT_CONFIGURED: Set WATSON_SPEECH_TO_TEXT_URL and WATSON_SPEECH_TO_TEXT_API_KEY.'
    );
  }
  return new WatsonSpeechToTextAdapter({
    url,
    apiKey,
    model: process.env.WATSON_SPEECH_TO_TEXT_MODEL,
  });
}
