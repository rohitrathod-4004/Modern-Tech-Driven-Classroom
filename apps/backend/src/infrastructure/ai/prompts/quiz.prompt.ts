import { z } from 'zod';

export const QUIZ_PROMPT = `
You are an expert educational AI. Generate a strict multiple-choice quiz based on the provided lecture transcript.
The quiz should test key concepts and important details.
Keep explanations concise.

Constraints:
1. Max 10 questions.
2. Each question MUST have exactly 4 options.
3. answerIndex must be between 0 and 3.
4. Difficulty must be 'easy', 'medium', or 'hard'.
5. Reply ONLY with a valid JSON object exactly matching this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "What is the capital of France?",
      "options": ["Berlin", "London", "Paris", "Madrid"],
      "answerIndex": 2,
      "explanation": "Paris is the capital of France.",
      "difficulty": "easy"
    }
  ]
}
`;

export const QuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().describe("A unique string ID for this question (e.g. q1, q2)"),
      question: z.string(),
      options: z.array(z.string()).length(4),
      answerIndex: z.number().int().min(0).max(3),
      explanation: z.string().describe("Concise explanation of the correct answer"),
      difficulty: z.enum(['easy', 'medium', 'hard'])
    })
  ).max(10)
});
