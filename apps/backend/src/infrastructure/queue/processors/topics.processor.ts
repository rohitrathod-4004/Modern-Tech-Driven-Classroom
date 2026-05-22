import { aiProviderManager } from '../../ai/providers/AIProviderManager';
import { TOPICS_PROMPT, TopicsOutputSchema } from '../../ai/prompts/topics.prompt';
import { SemanticBlock } from '../../ai/chunking/semanticChunker';
import crypto from 'crypto';

interface TopicResult {
  title: string;
  startTime: number;
  endTime: number;
  summary: string;
}

export async function extractTopics(blocks: SemanticBlock[]) {
  const llm = aiProviderManager.getLLM();
  
  // Format input with explicit timestamps
  const formattedInput = blocks.map(b => `[START_TIME: ${b.absoluteStartTime}]\n${b.text}`).join('\n\n');

  const result = await llm.generateStructured<{ topics: TopicResult[] }>(TOPICS_PROMPT, formattedInput, TopicsOutputSchema);
  
  return result.topics.map(t => ({
    id: crypto.randomUUID(),
    title: t.title,
    startTime: t.startTime,
    endTime: t.endTime,
    summary: t.summary
  }));
}
