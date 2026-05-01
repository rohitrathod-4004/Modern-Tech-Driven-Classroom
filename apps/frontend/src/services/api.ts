import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
  session_id: string,
  chunk_index: number,
  language: string
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append("file", file, `chunk_${chunk_index}.webm`);
  formData.append("session_id", session_id);
  formData.append("chunk_index", chunk_index.toString());
  formData.append("language", language);

  console.log(`[api] Sending chunk ${chunk_index} for session ${session_id}`);

  const response = await axios.post<TranscriptionResponse>(
    `${API_URL}/upload-chunk`,
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
