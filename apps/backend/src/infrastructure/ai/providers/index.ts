import { aiProviderManager } from './AIProviderManager';
import { GeminiProvider } from './GeminiProvider';
import { LocalCosineProvider } from './LocalCosineProvider';

// Initialize the default providers
export function initializeAIProviders() {
  const gemini = new GeminiProvider();
  const localCosine = new LocalCosineProvider();

  aiProviderManager.setLLMProvider(gemini);
  aiProviderManager.setEmbeddingProvider(gemini);
  aiProviderManager.setVectorSearchProvider(localCosine);
}

// Export the initialized manager
export { aiProviderManager };
