import { aiProviderManager } from '../../ai/providers/AIProviderManager';
import { SemanticBlock } from '../../ai/chunking/semanticChunker';

export async function generateEmbeddings(lectureId: string, blocks: SemanticBlock[]) {
  const embeddingProvider = aiProviderManager.getEmbeddings();
  const vectorSearchProvider = aiProviderManager.getVectorSearch();

  const texts = blocks.map(b => b.text);
  
  // Batch generate
  const embeddings = await embeddingProvider.generateEmbeddingsBatch(texts);

  // Store in vector database
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const embedding = embeddings[i];
    await vectorSearchProvider.storeEmbedding(
      lectureId,
      block.startChunkId,
      block.text,
      embedding,
      block.absoluteStartTime
    );
  }
}
