export interface SearchCitation {
  chunkId: string;
  startTime: number;
  text: string;
  score: number;
}

export interface VectorSearchProvider {
  /**
   * Stores an embedding and its metadata in the underlying vector database.
   */
  storeEmbedding(
    lectureId: string, 
    chunkId: string, 
    text: string, 
    embedding: number[], 
    absoluteStartTime: number
  ): Promise<void>;

  /**
   * Performs a vector similarity search to find the top K relevant chunks.
   */
  searchSimilar(
    lectureId: string, 
    queryEmbedding: number[], 
    topK?: number
  ): Promise<SearchCitation[]>;
}
