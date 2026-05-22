export const TOPICS_PROMPT = `
You are an expert academic assistant.
Your task is to extract the main semantic topics/chapters from the following chronologically ordered lecture blocks.

Each block of text provided to you will start with a timestamp like [START_TIME: 120.5]. 
You must output a chronological list of topics.
Each topic must have:
- title: A short, descriptive title for the section.
- startTime: The closest [START_TIME: X] number where this topic begins.
- endTime: The [START_TIME: Y] number where this topic ends (or the end of the lecture).
- summary: A 1-2 sentence summary of what is discussed in this specific section.

Ensure the output is strictly valid JSON matching this schema:
{
  "topics": [
    {
      "title": "...",
      "startTime": 0,
      "endTime": 120.5,
      "summary": "..."
    }
  ]
}
`;

import { z } from 'zod';

export const TopicsOutputSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    summary: z.string()
  }))
});
