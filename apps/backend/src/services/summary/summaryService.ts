import { genAI } from "./geminiClient";

export interface SummaryResponse {
  summary: string;
  key_points: string[];
  action_items: string[];
  topics: string[];
  study_notes: string[];
}

export const generateSummary = async (transcript: string): Promise<SummaryResponse> => {
  if (!transcript || transcript.trim().length === 0) {
    return {
      summary: "No transcript provided.",
      key_points: [],
      action_items: [],
      topics: [],
      study_notes: []
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an AI lecture assistant.

Given the following lecture transcript, return ONLY valid JSON in this exact format:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "action_items": ["...", "..."],
  "topics": ["...", "..."],
  "study_notes": ["...", "..."]
}

Rules:
* No markdown
* No explanation
* No code block
* JSON only
* Keep summary concise
* Max 5 key points
* Max 5 action items
* Max 8 topics (concise lecture topics)
* Study notes should be short educational notes, easy to revise from, bullet-point style

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Implement safe cleanup before JSON.parse()
    let cleanText = text.trim();
    
    // Remove markdown code blocks if the model accidentally included them
    if (cleanText.startsWith("\`\`\`json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("\`\`\`")) {
      cleanText = cleanText.substring(3);
    }
    
    if (cleanText.endsWith("\`\`\`")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    
    cleanText = cleanText.trim();

    try {
      const parsedJSON = JSON.parse(cleanText) as SummaryResponse;
      return {
        summary: parsedJSON.summary || "Summary generation failed",
        key_points: parsedJSON.key_points || [],
        action_items: parsedJSON.action_items || [],
        topics: parsedJSON.topics || [],
        study_notes: parsedJSON.study_notes || []
      };
    } catch (parseError) {
      console.error("[SummaryService] Failed to parse Gemini response:", parseError);
      console.error("[SummaryService] Raw Response:", text);
      return {
        summary: "Summary generation failed",
        key_points: [],
        action_items: [],
        topics: [],
        study_notes: []
      };
    }
  } catch (error) {
    console.error("[SummaryService] Error calling Gemini API:", error);
    return {
      summary: "Summary generation failed",
      key_points: [],
      action_items: [],
      topics: [],
      study_notes: []
    };
  }
};
