/**
 * @module ibm.config
 *
 * Centralized IBM Cloud service configuration for SynapseMed.
 *
 * All IBM services are optional and fall back to mock implementations
 * when credentials are not configured. Never commit real credentials.
 *
 * Supported services:
 *   - IBM Cloudant (NoSQL document store)
 *   - IBM Cloud Object Storage (file/document storage)
 *   - IBM Watson Assistant (conversational AI)
 *   - IBM Watson Speech to Text (clinical dictation)
 *   - IBM watsonx.ai (AI model gateway)
 *
 * Usage:
 *   import { ibmServices } from '../lib/ibm/ibm.config';
 *   const { cloudant, cos, watsonAssistant, speechToText, watsonx } = ibmServices;
 */

import { CloudantAdapter } from '../cloudant/CloudantAdapter';
import { CloudObjectStorageAdapter } from '../storage/CloudObjectStorageAdapter';
import { MockStorageAdapter } from '../storage/MockStorageAdapter';
import { WatsonAssistantAdapter } from '../assistant/WatsonAssistantAdapter';
import { MockWatsonAssistantAdapter } from '../assistant/MockWatsonAssistantAdapter';
import { WatsonSpeechToTextAdapter } from '../transcription/WatsonSpeechToTextAdapter';
import { MockSpeechToTextAdapter } from '../transcription/MockSpeechToTextAdapter';
import { WatsonxProvider } from '../ai/providers/WatsonxProvider';
import { OpencodeProvider } from '../ai/providers/OpencodeProvider';
import { GeminiProvider } from '../ai/providers/GeminiProvider';
import { MockAIProvider } from '../ai/providers/MockAIProvider';
import { IAIProvider } from '../ai/providers/types';
import { IWatsonAssistantAdapter } from '../assistant/IWatsonAssistantAdapter';
import { ISpeechToTextAdapter } from '../transcription/ISpeechToTextAdapter';
import { IStorageAdapter } from '../storage/IStorageAdapter';

// ── IBM Cloudant ────────────────────────────────────────────────────────────

export interface CloudantConfig {
  url?: string;
  apiKey?: string;
  dbName?: string;
}

export function createCloudantAdapter(config?: CloudantConfig): CloudantAdapter {
  const cfg = config ?? {
    url: process.env.CLOUDANT_URL,
    apiKey: process.env.CLOUDANT_API_KEY,
    dbName: process.env.CLOUDANT_DB_NAME || 'synapsemed',
  };
  return new CloudantAdapter(cfg);
}

export function isCloudantConfigured(): boolean {
  return Boolean(process.env.CLOUDANT_URL && process.env.CLOUDANT_API_KEY);
}

// ── IBM Cloud Object Storage ────────────────────────────────────────────────

export interface COSConfig {
  endpoint?: string;
  bucket?: string;
  apiKey?: string;
  serviceInstanceCrn?: string;
  region?: string;
}

export function createCOSAdapter(config?: COSConfig): IStorageAdapter {
  if (isCOSConfigured()) {
    return new CloudObjectStorageAdapter(config);
  }
  return new MockStorageAdapter();
}

export function isCOSConfigured(): boolean {
  return Boolean(
    process.env.IBM_COS_ENDPOINT &&
    process.env.IBM_COS_BUCKET &&
    (process.env.IBM_COS_API_KEY || process.env.IBM_COS_SERVICE_INSTANCE_CRN)
  );
}

export function getStorageProvider(): 'ibm-cos' | 'mock' {
  const provider = (process.env.OBJECT_STORAGE_PROVIDER || process.env.STORAGE_PROVIDER || 'mock').toLowerCase();
  if (provider === 'ibm-cos' || provider === 'cos') return 'ibm-cos';
  if (isCOSConfigured()) return 'ibm-cos';
  return 'mock';
}

// ── IBM Watson Assistant ────────────────────────────────────────────────────

export interface WatsonAssistantConfig {
  url?: string;
  apiKey?: string;
  assistantId?: string;
}

export function createWatsonAssistantAdapter(config?: WatsonAssistantConfig): IWatsonAssistantAdapter {
  const url = config?.url ?? process.env.WATSON_ASSISTANT_URL;
  const apiKey = config?.apiKey ?? process.env.WATSON_ASSISTANT_API_KEY;
  const assistantId = config?.assistantId ?? process.env.WATSON_ASSISTANT_ASSISTANT_ID;

  if (url && apiKey && assistantId) {
    return new WatsonAssistantAdapter({ url, apiKey, assistantId });
  }
  return new MockWatsonAssistantAdapter();
}

export function isWatsonAssistantConfigured(): boolean {
  return Boolean(
    process.env.WATSON_ASSISTANT_URL &&
    process.env.WATSON_ASSISTANT_API_KEY &&
    process.env.WATSON_ASSISTANT_ASSISTANT_ID
  );
}

// ── IBM Watson Speech to Text ───────────────────────────────────────────────

export interface SpeechToTextConfig {
  url?: string;
  apiKey?: string;
  model?: string;
}

export function createSpeechToTextAdapter(config?: SpeechToTextConfig): ISpeechToTextAdapter {
  const url = config?.url ?? process.env.WATSON_SPEECH_TO_TEXT_URL;
  const apiKey = config?.apiKey ?? process.env.WATSON_SPEECH_TO_TEXT_API_KEY;

  if (url && apiKey) {
    return new WatsonSpeechToTextAdapter({
      url,
      apiKey,
      model: config?.model ?? process.env.WATSON_SPEECH_TO_TEXT_MODEL,
    });
  }
  return new MockSpeechToTextAdapter();
}

export function isSpeechToTextConfigured(): boolean {
  return Boolean(process.env.WATSON_SPEECH_TO_TEXT_URL && process.env.WATSON_SPEECH_TO_TEXT_API_KEY);
}

// ── IBM watsonx.ai ──────────────────────────────────────────────────────────

export interface WatsonxConfig {
  apiKey?: string;
  projectId?: string;
  modelId?: string;
  url?: string;
}

export function createWatsonxProvider(config?: WatsonxConfig): WatsonxProvider {
  const cfg = config ?? {
    apiKey: process.env.WATSONX_API_KEY,
    projectId: process.env.WATSONX_PROJECT_ID,
    modelId: process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2',
    url: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
  };
  return new WatsonxProvider({
    apiKey: cfg.apiKey!,
    projectId: cfg.projectId!,
    modelId: cfg.modelId,
    url: cfg.url,
  });
}

export function isWatsonxConfigured(): boolean {
  return Boolean(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID);
}

// ── AI provider resolution (mock | gemini | watsonx | opencode) ─────────────

export function resolveAIProvider(): IAIProvider {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  if (provider === 'watsonx' && isWatsonxConfigured()) {
    return createWatsonxProvider();
  }
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return new GeminiProvider(process.env.GEMINI_API_KEY!, process.env.GEMINI_MODEL || 'gemini-1.5-flash');
  }
  if (provider === 'opencode' && process.env.OPENCODE_API_KEY) {
    return new OpencodeProvider({
      apiKey: process.env.OPENCODE_API_KEY!,
      baseUrl: process.env.OPENCODE_BASE_URL || 'https://opencode.ai/zen/v1',
      model: process.env.OPENCODE_MODEL || 'gpt-4o-mini',
    });
  }
  return new MockAIProvider();
}

export function getAvailableProviders() {
  return [
    { id: 'mock', name: 'Mock (Development)', description: 'Simulated AI for testing', configured: true },
    { id: 'gemini', name: 'Google Gemini (Free Tier)', description: 'Google Gemini API', configured: Boolean(process.env.GEMINI_API_KEY) },
    { id: 'watsonx', name: 'IBM watsonx.ai', description: 'IBM watsonx foundation models', configured: isWatsonxConfigured() },
    { id: 'opencode', name: 'Opencode (Free)', description: 'Opencode free AI API endpoint', configured: Boolean(process.env.OPENCODE_API_KEY) },
  ];
}

// ── Composite service status ────────────────────────────────────────────────

export interface IBMServiceStatus {
  cloudant: { configured: boolean; mock: boolean };
  cos: { configured: boolean; mock: boolean };
  watsonAssistant: { configured: boolean; mock: boolean };
  speechToText: { configured: boolean; mock: boolean };
  watsonx: { configured: boolean; mock: boolean };
  aiProvider: { id: string; configured: boolean; mock: boolean };
}

export function getIBMServiceStatus(): IBMServiceStatus {
  const aiProvider = resolveAIProvider();
  return {
    cloudant: { configured: isCloudantConfigured(), mock: !isCloudantConfigured() },
    cos: { configured: isCOSConfigured(), mock: getStorageProvider() === 'mock' },
    watsonAssistant: { configured: isWatsonAssistantConfigured(), mock: !isWatsonAssistantConfigured() },
    speechToText: { configured: isSpeechToTextConfigured(), mock: !isSpeechToTextConfigured() },
    watsonx: { configured: isWatsonxConfigured(), mock: !isWatsonxConfigured() },
    aiProvider: { id: aiProvider.name, configured: !aiProvider.isMock, mock: aiProvider.isMock },
  };
}

// ── Aggregated export ───────────────────────────────────────────────────────

export const ibmServices = {
  cloudant: { create: createCloudantAdapter, isConfigured: isCloudantConfigured },
  cos: { create: createCOSAdapter, isConfigured: isCOSConfigured, getProvider: getStorageProvider },
  watsonAssistant: { create: createWatsonAssistantAdapter, isConfigured: isWatsonAssistantConfigured },
  speechToText: { create: createSpeechToTextAdapter, isConfigured: isSpeechToTextConfigured },
  watsonx: { create: createWatsonxProvider, isConfigured: isWatsonxConfigured },
  ai: { resolve: resolveAIProvider, getAvailable: getAvailableProviders },
  status: getIBMServiceStatus,
};
