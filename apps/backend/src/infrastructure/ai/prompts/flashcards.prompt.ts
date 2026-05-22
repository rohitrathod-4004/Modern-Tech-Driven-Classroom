import { z } from 'zod';

export const FLASHCARDS_PROMPT = `
You are an expert educational AI. Generate study flashcards based on the provided lecture transcript.
The flashcards should cover key terminology, definitions, and concepts.
Keep the front concise (the prompt/term) and the back informative but brief (the definition/answer).

Constraints:
1. Max 20 flashcards.
2. Reply ONLY with a valid JSON object exactly matching this structure:
{
  "cards": [
    {
      "id": "c1",
      "front": "Term",
      "back": "Definition"
    }
  ]
}
`;

export const FlashcardsOutputSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string().describe("A unique string ID for this card (e.g. c1, c2)"),
      front: z.string(),
      back: z.string()
    })
  ).max(25)
});
