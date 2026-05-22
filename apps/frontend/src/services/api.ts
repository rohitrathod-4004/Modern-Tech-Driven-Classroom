import { api } from "../infrastructure/api";

// API_URL fallback not needed since infrastructure/api.ts is pre-configured


export interface TranscriptionResponse {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  latency_ms: number;
}

export async function uploadChunk(
  file: Blob,
  lectureId: string,
  courseId: string,
  chunk_index: number,
  language: string
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append("file", file, `chunk_${chunk_index}.webm`);
  formData.append("lectureId", lectureId);
  formData.append("courseId", courseId);
  formData.append("session_id", lectureId); // Legacy compatibility fallback
  formData.append("chunk_index", chunk_index.toString());
  formData.append("language", language);

  console.log(`[api] Sending chunk ${chunk_index} for lecture ${lectureId}`);

  const response = await api.post<TranscriptionResponse>(
    `/upload-chunk`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  console.log(`[api] Response for chunk ${chunk_index}:`, response.data);
  return response.data;
}
