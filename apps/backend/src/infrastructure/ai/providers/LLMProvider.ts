import { ZodSchema } from 'zod';

export interface LLMProvider {
  /**
   * Generates structured JSON based on a prompt and input text.
   * If a Zod schema is provided, it validates the output before returning.
   */
  generateStructured<T>(prompt: string, input: string, schema?: ZodSchema<T>): Promise<T>;
  
  /**
   * Estimates the token count of a given string to enforce limits.
   */
  estimateTokens(text: string): number;
}
