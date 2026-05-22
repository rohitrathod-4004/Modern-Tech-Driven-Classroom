import { Lecture } from '../../models/Lecture';
import { aiProviderManager } from '../../infrastructure/ai/providers/AIProviderManager';
import { RAG_PROMPT, RagOutputSchema } from '../../infrastructure/ai/prompts/rag.prompt';

export class LectureAIService {
  async getSummary(lectureId: string) {
    const lecture = await Lecture.findById(lectureId).select('summary aiStatus processingError').lean();
    if (!lecture) throw new Error('Lecture not found');
    return {
      summary: lecture.summary,
      aiStatus: lecture.aiStatus,
      processingError: lecture.processingError
    };
  }

  async getTopics(lectureId: string) {
    const lecture = await Lecture.findById(lectureId).select('topics aiStatus processingError').lean();
    if (!lecture) throw new Error('Lecture not found');
    return {
      topics: lecture.topics,
      aiStatus: lecture.aiStatus,
      processingError: lecture.processingError
    };
  }

  async askAI(lectureId: string, question: string) {
    const lecture = await Lecture.findById(lectureId).select('aiStatus').lean();
    if (!lecture) throw new Error('Lecture not found');
    if (lecture.aiStatus !== 'completed') {
      throw new Error('Lecture AI processing is not complete yet. Cannot answer questions.');
    }

    const embeddingProvider = aiProviderManager.getEmbeddings();
    const vectorSearchProvider = aiProviderManager.getVectorSearch();
    const llm = aiProviderManager.getLLM();

    // 1. Embed user query
    const queryEmbedding = await embeddingProvider.generateEmbedding(question);

    // 2. Retrieve top-K chunks
    const citations = await vectorSearchProvider.searchSimilar(lectureId, queryEmbedding, 5);
    
    if (citations.length === 0) {
      return {
        answer: "I don't have enough information from this lecture to answer that question.",
        citations: []
      };
    }

    // 3. Construct grounded prompt
    const contextText = citations.map((c, i) => `[Citation ${i + 1} - Start: ${c.startTime}s]\n${c.text}`).join('\n\n');
    
    const structuredInput = `
QUESTION:
${question}

CONTEXT EXCERPTS FROM LECTURE:
${contextText}
`;

    // 4. Generate Answer
    const result = await llm.generateStructured<{ answer: string }>(RAG_PROMPT, structuredInput, RagOutputSchema);

    return {
      answer: result.answer,
      citations: citations.map(c => ({
        chunkId: c.chunkId,
        startTime: c.startTime,
        text: c.text
      }))
    };
  }
}

export const lectureAIService = new LectureAIService();
