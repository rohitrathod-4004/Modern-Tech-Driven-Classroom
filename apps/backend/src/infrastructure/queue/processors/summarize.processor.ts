import { aiProviderManager } from '../../ai/providers/AIProviderManager';
import { SUMMARY_PROMPT, SummaryOutputSchema } from '../../ai/prompts/summary.prompt';
import { SemanticBlock } from '../../ai/chunking/semanticChunker';

interface SummaryResult {
  short: string;
  detailed: string;
}

export async function generateSummaries(blocks: SemanticBlock[]): Promise<SummaryResult> {
  const llm = aiProviderManager.getLLM();
  
  // Combine text for summarization
  const fullText = blocks.map(b => b.text).join(' ');

  // Estimate tokens (approx)
  const tokens = llm.estimateTokens(fullText);
  const MAX_TOKENS = 60000; // Gemini 1.5 Flash handles 1M, but keep it sane for cost control

  if (tokens > MAX_TOKENS) {
    console.warn(`[Summarize] Transcript is huge (~${tokens} tokens). We should recursively chunk. For MVP, we will truncate.`);
    // A robust system would recursively summarize.
  }

  const result = await llm.generateStructured<SummaryResult>(SUMMARY_PROMPT, fullText.slice(0, MAX_TOKENS * 4), SummaryOutputSchema);
  return result;
}
