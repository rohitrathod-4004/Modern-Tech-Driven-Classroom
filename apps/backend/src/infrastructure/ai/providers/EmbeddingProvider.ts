export interface EmbeddingProvider {
  /**
   * Generates a vector embedding for a given text.
   */
  generateEmbedding(text: string): Promise<number[]>;
  
  /**
   * Generates embeddings for an array of texts.
   */
  generateEmbeddingsBatch(texts: string[]): Promise<number[][]>;
}
