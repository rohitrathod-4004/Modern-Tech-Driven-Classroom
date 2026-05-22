import { VectorSearchProvider, SearchCitation } from './VectorSearchProvider';
import { LectureEmbedding } from '../../../models/LectureEmbedding';

/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class LocalCosineProvider implements VectorSearchProvider {
  async storeEmbedding(
    lectureId: string, 
    chunkId: string, 
    text: string, 
    embedding: number[], 
    absoluteStartTime: number
  ): Promise<void> {
    await LectureEmbedding.create({
      lectureId,
      chunkId,
      text,
      embedding,
      absoluteStartTime
    });
  }

  async searchSimilar(
    lectureId: string, 
    queryEmbedding: number[], 
    topK: number = 5
  ): Promise<SearchCitation[]> {
    // 1. Fetch ALL embeddings for this specific lecture.
    // This is scalable enough for an MVP since a lecture rarely has > 100 semantic chunks.
    const candidates = await LectureEmbedding.find({ lectureId }).lean();
    
    // 2. Calculate cosine similarity in-memory
    const scoredCandidates = candidates.map(candidate => ({
      chunkId: candidate.chunkId,
      startTime: candidate.absoluteStartTime,
      text: candidate.text,
      score: cosineSimilarity(queryEmbedding, candidate.embedding)
    }));

    // 3. Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 4. Return Top-K
    return scoredCandidates.slice(0, topK);
  }
}
