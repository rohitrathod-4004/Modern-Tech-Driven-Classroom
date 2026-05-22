import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './LLMProvider';
import { EmbeddingProvider } from './EmbeddingProvider';
import { ZodSchema, ZodError } from 'zod';

export class AIValidationError extends Error {
  constructor(public originalError: ZodError | Error) {
    super(`AI Validation Failed: ${originalError.message}`);
    this.name = 'AIValidationError';
  }
}

export class GeminiProvider implements LLMProvider, EmbeddingProvider {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private failedKeyCooldowns: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 60 * 1000; // 60s cooldown

  // gemini-flash-lite-latest: fast, cheap, available quota
  private modelName = 'gemini-flash-lite-latest';
  // Standard text embedding model
  private embeddingModelName = 'gemini-embedding-001';

  constructor() {
    const keysRaw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    this.apiKeys = keysRaw.split(',').map(k => k.trim()).filter(k => k);
    
    if (this.apiKeys.length === 0) {
      console.warn("GEMINI_API_KEYS is not set. GeminiProvider will fail if invoked.");
    }
  }

  private getActiveGenAI(): GoogleGenerativeAI {
    if (this.apiKeys.length === 0) throw new Error('No Gemini API keys configured');

    const now = Date.now();
    let attempts = 0;

    // Round-robin to find a key that is not in cooldown
    while (attempts < this.apiKeys.length) {
      const key = this.apiKeys[this.currentKeyIndex];
      const cooldownEnd = this.failedKeyCooldowns.get(key) || 0;

      if (now >= cooldownEnd) {
        return new GoogleGenerativeAI(key);
      }

      // Rotate to next
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
    }

    // If all keys in cooldown, just use the next one and hope it works (maybe cooldowns are stale)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return new GoogleGenerativeAI(this.apiKeys[this.currentKeyIndex]);
  }

  private markCurrentKeyFailed() {
    const key = this.apiKeys[this.currentKeyIndex];
    this.failedKeyCooldowns.set(key, Date.now() + this.COOLDOWN_MS);
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    console.warn(`[Gemini] Key marked as failed. Rotating to next key. Cooldown for 60s.`);
  }

  async generateStructured<T>(prompt: string, input: string, schema?: ZodSchema<T>): Promise<T> {
    const fullPrompt = `${prompt}\n\nInput:\n${input}`;
    
    // Only retry on transient non-rate-limit errors (network blips, etc).
    // 429 rate limit errors are thrown immediately so BullMQ's job-level
    // exponential backoff (65s+) can handle them properly.
    let retries = 2;
    while (retries > 0) {
      try {
        const genAI = this.getActiveGenAI();
        const model = genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();
        
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (e: any) {
          throw new AIValidationError(new Error(`Invalid JSON returned: ${text}`));
        }

        if (schema) {
          const validationResult = schema.safeParse(parsed);
          if (!validationResult.success) {
            throw new AIValidationError(validationResult.error);
          }
          return validationResult.data;
        }

        return parsed as T;
      } catch (err: any) {
        if (err instanceof AIValidationError) {
          throw err;
        }

        // Rate limit: throw immediately — let BullMQ retry with 65s backoff
        if (err.status === 429 || err.message?.includes('quota') || err.message?.includes('rate') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`[Gemini] Rate limited (429). Propagating to BullMQ for job-level retry.`);
          throw new Error(`GEMINI_RATE_LIMITED: ${err.message}`);
        }

        // Other transient errors (network, 5xx): retry once with short wait
        console.warn(`[Gemini Error] ${err.message?.substring(0, 80)}. Retrying once...`);
        await new Promise(res => setTimeout(res, 3000));
        retries--;
      }
    }
    throw new Error('Failed to generate content after retries.');
  }

  estimateTokens(text: string): number {
    // Rough estimation: 1 token ~= 4 chars for English
    return Math.ceil(text.length / 4);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const genAI = this.getActiveGenAI();
    const model = genAI.getGenerativeModel({ model: this.embeddingModelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    // text-embedding-004 supports batch embedding natively or via map.
    // For simplicity/MVP, we map concurrently with a tiny delay to respect rate limits if huge.
    // Real production might chunk this into smaller concurrent groups.
    const embeddings = [];
    for (const text of texts) {
      const e = await this.generateEmbedding(text);
      embeddings.push(e);
      await new Promise(r => setTimeout(r, 100)); // small delay to protect free tier
    }
    return embeddings;
  }
}
