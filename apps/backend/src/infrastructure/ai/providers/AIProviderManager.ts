import { LLMProvider } from './LLMProvider';
import { EmbeddingProvider } from './EmbeddingProvider';
import { VectorSearchProvider } from './VectorSearchProvider';

// A simple singleton manager to get the active providers
class AIProviderManager {
  private llmProvider: LLMProvider | null = null;
  private embeddingProvider: EmbeddingProvider | null = null;
  private vectorSearchProvider: VectorSearchProvider | null = null;

  setLLMProvider(provider: LLMProvider) {
    this.llmProvider = provider;
  }

  setEmbeddingProvider(provider: EmbeddingProvider) {
    this.embeddingProvider = provider;
  }

  setVectorSearchProvider(provider: VectorSearchProvider) {
    this.vectorSearchProvider = provider;
  }

  getLLM(): LLMProvider {
    if (!this.llmProvider) throw new Error("LLMProvider not initialized");
    return this.llmProvider;
  }

  getEmbeddings(): EmbeddingProvider {
    if (!this.embeddingProvider) throw new Error("EmbeddingProvider not initialized");
    return this.embeddingProvider;
  }

  getVectorSearch(): VectorSearchProvider {
    if (!this.vectorSearchProvider) throw new Error("VectorSearchProvider not initialized");
    return this.vectorSearchProvider;
  }
}

export const aiProviderManager = new AIProviderManager();
