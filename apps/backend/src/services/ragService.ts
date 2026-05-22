import { genAI } from "./summary/geminiClient";
import { embeddingProvider } from "./embeddingService";
import { searchVectors } from "./qdrantService";
import { LectureSession } from "../models/LectureSession";

export interface Citation {
  session_id: string;
  lecture_title: string;
  chunk_index: number;
  text: string;
  start_time: number;
  end_time: number;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
}

export async function askLecture(session_id: string, question: string): Promise<RagResponse> {
  // 1. Embed query
  const vector = await embeddingProvider.embedText(question);

  // 2. Query Qdrant with lecture-session filter
  const filter = {
    must: [
      {
        key: "session_id",
        match: { value: session_id },
      },
    ],
  };

  const hits = await searchVectors(vector, filter, 5);

  if (hits.length === 0) {
    return {
      answer: "No relevant content found in this lecture to answer your question.",
      citations: [],
    };
  }

  // 3. Build context for RAG
  const contextParts: string[] = [];
  const citations: Citation[] = [];

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const payload = hit.payload as any;
    if (!payload) continue;

    contextParts.push(
      `[Source ${i + 1}] (Time: ${payload.start_time || 0}s): "${payload.text || ""}"`
    );

    citations.push({
      session_id: payload.session_id,
      lecture_title: payload.lecture_title || "This Lecture",
      chunk_index: payload.chunk_index,
      text: payload.text || "",
      start_time: payload.start_time || 0,
      end_time: payload.end_time || 0,
    });
  }

  const contextText = contextParts.join("\n\n");

  // 4. Generate answer via Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are a helpful classroom assistant. Answer the user's question based strictly on the provided lecture transcript segments.
For citations, use the source brackets like [Source 1], [Source 2], etc. where appropriate in your response.
If the context does not contain enough information to answer, state clearly that you cannot find the answer in this lecture.
Keep the answer direct, informative, and formatted in markdown.

Context segments:
${contextText}

Question: ${question}

Answer:`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  return { answer, citations };
}

export async function askClassroom(classroom_id: string, question: string): Promise<RagResponse> {
  // 1. Embed query
  const vector = await embeddingProvider.embedText(question);

  // 2. Query Qdrant with classroom-wide filter
  const filter = {
    must: [
      {
        key: "classroom_id",
        match: { value: classroom_id },
      },
    ],
  };

  const hits = await searchVectors(vector, filter, 5);

  if (hits.length === 0) {
    return {
      answer: "No relevant content found in any of the classroom lectures to answer your question.",
      citations: [],
    };
  }

  // 3. Build context and citations
  const contextParts: string[] = [];
  const citations: Citation[] = [];

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const payload = hit.payload as any;
    if (!payload) continue;

    contextParts.push(
      `[Source ${i + 1}] (Lecture: ${payload.lecture_title || "Unknown"}, Time: ${payload.start_time || 0}s): "${payload.text || ""}"`
    );

    citations.push({
      session_id: payload.session_id,
      lecture_title: payload.lecture_title || "Lecture",
      chunk_index: payload.chunk_index,
      text: payload.text || "",
      start_time: payload.start_time || 0,
      end_time: payload.end_time || 0,
    });
  }

  const contextText = contextParts.join("\n\n");

  // 4. Generate answer via Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are a helpful classroom assistant. Answer the user's question based strictly on the provided lecture transcript segments from different lectures in the classroom.
For citations, use the source brackets like [Source 1], [Source 2], etc. where appropriate in your response.
If the context does not contain enough information to answer, state clearly that you cannot find the answer in the classroom transcripts.
Keep the answer direct, informative, and formatted in markdown.

Context segments:
${contextText}

Question: ${question}

Answer:`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  return { answer, citations };
}
