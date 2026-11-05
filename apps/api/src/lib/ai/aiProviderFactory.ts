import { IAIProvider } from './providers/types';
import { MockAIProvider } from './providers/MockAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { WatsonxProvider } from './providers/WatsonxProvider';
import { OpencodeProvider } from './providers/OpencodeProvider';
import { prisma } from '../prisma';

export async function getAIProviderForPractice(practiceId: string): Promise<IAIProvider> {
  try {
    const settings = await prisma.practiceAISettings.findUnique({ where: { practiceId } });
    if (!settings || settings.aiProvider === 'mock') return new MockAIProvider();

    if (settings.aiProvider === 'gemini' && settings.geminiApiKey) {
      return new GeminiProvider(settings.geminiApiKey, settings.geminiModel || 'gemini-1.5-flash');
    }
    if (settings.aiProvider === 'watsonx' && settings.watsonxApiKey && settings.watsonxProjectId) {
      return new WatsonxProvider({
        apiKey: settings.watsonxApiKey,
        projectId: settings.watsonxProjectId,
        modelId: settings.watsonxModelId || undefined,
        url: settings.watsonxUrl || undefined,
      });
    }
    if (settings.aiProvider === 'opencode' && settings.opencodeApiKey) {
      return new OpencodeProvider({
        apiKey: settings.opencodeApiKey,
        baseUrl: settings.opencodeBaseUrl || undefined,
        model: settings.opencodeModel || undefined,
      });
    }
  } catch (e) {
    // fall back to mock
  }
  return new MockAIProvider();
}

export function getAvailableProviders() {
  return [
    { id: 'mock', name: 'Mock (Development)', description: 'Simulated AI for testing' },
    { id: 'gemini', name: 'Google Gemini (Free Tier)', description: 'Google Gemini API - free tier available' },
    { id: 'watsonx', name: 'IBM watsonx.ai', description: 'IBM watsonx foundation models' },
    { id: 'opencode', name: 'Opencode (Free)', description: 'Opencode free AI API endpoint' },
  ];
}
