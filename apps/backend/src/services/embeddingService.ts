import { genAI } from "./summary/geminiClient";

export interface IEmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 5, delay = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota exceeded"))) {
      let waitTime = delay;
      if (error.errorDetails) {
        for (const detail of error.errorDetails) {
          if (detail.retryDelay) {
            // e.g. "26.06293937s" or similar
            const seconds = parseFloat(detail.retryDelay);
            if (!isNaN(seconds)) {
              waitTime = Math.ceil(seconds) * 1000 + 2000;
              break;
            }
          }
        }
      }
      console.warn(`[Embedding Service] Rate limited. Retrying in ${waitTime / 1000}s... (Retries left: ${retries})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private modelName = "gemini-embedding-2";
  private dimensions = 768;

  async embedText(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: this.modelName });
    return retryWithBackoff(async () => {
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: this.dimensions,
      } as any);
      if (!result.embedding || !result.embedding.values) {
        throw new Error("[GeminiEmbeddingProvider] No embedding values returned from API");
      }
      return result.embedding.values;
    });
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    const chunkSize = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < texts.length; i += chunkSize) {
      chunks.push(texts.slice(i, i + chunkSize));
    }

    const model = genAI.getGenerativeModel({ model: this.modelName });
    
    const results: number[][] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkTexts = chunks[i];
      const chunkEmbeddings = await retryWithBackoff(async () => {
        const response = await model.batchEmbedContents({
          requests: chunkTexts.map((t) => ({
            content: { role: "user", parts: [{ text: t }] },
            model: `models/${this.modelName}`,
            outputDimensionality: this.dimensions,
          })),
        } as any);
        if (!response.embeddings) {
          throw new Error("[GeminiEmbeddingProvider] No batch embeddings returned from API");
        }
        return response.embeddings.map((emb) => emb.values);
      });
      results.push(...chunkEmbeddings);
    }

    return results;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

export const embeddingProvider: IEmbeddingProvider = new GeminiEmbeddingProvider();

