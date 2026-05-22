import { aiProviderManager } from '../../ai/providers/AIProviderManager';
import { FLASHCARDS_PROMPT, FlashcardsOutputSchema } from '../../ai/prompts/flashcards.prompt';
import { SemanticBlock } from '../../ai/chunking/semanticChunker';
import { IFlashcard } from '../../../models/LectureFlashcard';

export async function generateFlashcards(blocks: SemanticBlock[]): Promise<IFlashcard[]> {
  const llm = aiProviderManager.getLLM();
  const fullText = blocks.map(b => b.text).join(' ');
  const MAX_TOKENS = 60000;
  
  const result = await llm.generateStructured<{ cards: IFlashcard[] }>(
    FLASHCARDS_PROMPT, 
    fullText.slice(0, MAX_TOKENS * 4), 
    FlashcardsOutputSchema
  );
  
  return result.cards;
}
