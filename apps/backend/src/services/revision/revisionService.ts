import { genAI } from "../summary/geminiClient";
import { Quiz, IQuizQuestion } from "../../models/Quiz";
import { Flashcard, IFlashcardItem } from "../../models/Flashcard";

export const generateQuizAndFlashcards = async (sessionId: string, summaryText: string): Promise<void> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 1. Generate Quiz
    const quizPrompt = `You are an AI teacher. Based on the following lecture summary and study notes, create a multiple-choice quiz with exactly 5 questions.
Return ONLY valid JSON array of objects in this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "explanation": "Explanation here..."
  }
]

Rules:
* 4 unique options per question
* answerIndex must be a number 0 to 3
* explanation must explain why the correct option is correct
* JSON only, no markdown block fences.

Summary Content:
${summaryText}`;

    let quizQuestions: IQuizQuestion[] = [];
    try {
      const result = await model.generateContent(quizPrompt);
      const text = (await result.response).text().trim();
      let cleanText = text;
      if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
      else if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
      if (cleanText.endsWith("```")) cleanText = cleanText.substring(0, cleanText.length - 3);
      cleanText = cleanText.trim();
      quizQuestions = JSON.parse(cleanText);
    } catch (err) {
      console.error("[RevisionService] Failed to generate/parse Quiz:", err);
      // Fallback questions
      quizQuestions = [
        {
          question: "What is the primary topic discussed in this lecture?",
          options: ["Core Concept", "Alternative Topic A", "Alternative Topic B", "Alternative Topic C"],
          answerIndex: 0,
          explanation: "The lecture focus is on the core concept."
        }
      ];
    }

    // Save Quiz to MongoDB
    await Quiz.findOneAndUpdate(
      { session_id: sessionId },
      { $set: { questions: quizQuestions, generatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`[RevisionService] Quiz generated and saved for session: ${sessionId}`);

    // 2. Generate Flashcards
    const flashcardPrompt = `You are an AI study assistant. Based on the following lecture summary and topics, generate a list of 5-8 flashcards containing key concepts/terms and their definitions or answers.
Return ONLY valid JSON array of objects in this exact format:
[
  {
    "front": "Term or Concept",
    "back": "Short explanation or description"
  }
]

Rules:
* Limit front card side to a short concept, question, or term
* Limit back card side to a concise 1-2 sentence description/answer
* JSON only, no markdown block fences.

Summary Content:
${summaryText}`;

    let flashcards: IFlashcardItem[] = [];
    try {
      const result = await model.generateContent(flashcardPrompt);
      const text = (await result.response).text().trim();
      let cleanText = text;
      if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
      else if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
      if (cleanText.endsWith("```")) cleanText = cleanText.substring(0, cleanText.length - 3);
      cleanText = cleanText.trim();
      flashcards = JSON.parse(cleanText);
    } catch (err) {
      console.error("[RevisionService] Failed to generate/parse Flashcards:", err);
      flashcards = [
        {
          front: "Key Concept",
          back: "Important details about the key concept discussed during the lecture."
        }
      ];
    }

    // Save Flashcards to MongoDB
    await Flashcard.findOneAndUpdate(
      { session_id: sessionId },
      { $set: { cards: flashcards, generatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`[RevisionService] Flashcards generated and saved for session: ${sessionId}`);

  } catch (error) {
    console.error("[RevisionService] Error during revision content generation:", error);
  }
};
