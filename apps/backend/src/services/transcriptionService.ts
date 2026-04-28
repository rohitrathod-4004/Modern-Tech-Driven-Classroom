import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || "http://localhost:8000";

export async function transcribeAudio(filePath: string, language: string = "en"): Promise<any> {
  console.log(`[transcriptionService] Sending file to Python service: ${filePath} (language: ${language})`);

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("language", language);

  try {
    const response = await axios.post(`${WHISPER_SERVICE_URL}/transcribe`, form, {
      headers: {
        ...form.getHeaders(),
      },
      // Allow up to 5 minutes for large audio files
      timeout: 5 * 60 * 1000,
    });

    console.log(`[transcriptionService] Python response received`);
    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = err?.message;

    console.error(`[transcriptionService] Python error occurred`);
    console.error(`[transcriptionService] message:`, message);
    console.error(`[transcriptionService] status:`, status);
    console.error(`[transcriptionService] response data:`, JSON.stringify(data, null, 2));

    // Build a meaningful error message to surface upstream
    const detail =
      data?.detail ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      message ||
      "Unknown error";

    const error = new Error(detail) as any;
    error.status = status;
    error.responseData = data;
    throw error;
  }
}
