import { aiProviderManager } from '../../ai/providers/AIProviderManager';
import { QUIZ_PROMPT, QuizOutputSchema } from '../../ai/prompts/quiz.prompt';
import { SemanticBlock } from '../../ai/chunking/semanticChunker';
import { IQuizQuestion } from '../../../models/LectureQuiz';

export async function generateQuiz(blocks: SemanticBlock[]): Promise<IQuizQuestion[]> {
  const llm = aiProviderManager.getLLM();
  const fullText = blocks.map(b => b.text).join(' ');
  const MAX_TOKENS = 60000;
  
  const result = await llm.generateStructured<{ questions: IQuizQuestion[] }>(
    QUIZ_PROMPT, 
    fullText.slice(0, MAX_TOKENS * 4), 
    QuizOutputSchema
  );
  
  return result.questions;
}
