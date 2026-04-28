import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transcribeAudio } from "../services/transcriptionService";
import { convertToWav } from "../utils/ffmpeg";

const router = Router();

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage — accept any audio file, store in uploads/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({ storage });

/** Silently delete a file, logging if it fails. */
function deleteFile(filePath: string) {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`[upload] Failed to delete file: ${filePath} — ${err.message}`);
    } else {
      console.log(`[upload] Deleted: ${path.basename(filePath)}`);
    }
  });
}

// POST /upload-chunk
router.post("/upload-chunk", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalPath = req.file.path;
  const language: string = (req.body.language as string) || "en";
  let convertedPath: string | null = null;

  console.log(`[upload] File received: ${req.file.originalname} (${req.file.size} bytes)`);
  console.log(`[upload] Language: ${language}`);

  try {
    // 1. Convert to WAV (mono, 16kHz)
    console.log(`[upload] Converting audio to WAV (mono, 16kHz)...`);
    convertedPath = await convertToWav(originalPath);

    // 2. Send converted WAV to Python Whisper service
    console.log(`[upload] Sending converted WAV to Python Whisper service...`);
    const result = await transcribeAudio(convertedPath, language);

    console.log(`[upload] Transcription complete. Latency: ${result.latency_ms}ms`);
    res.json(result);
  } catch (err: any) {
    const detail = err?.message || "Unknown error";
    console.error(`[upload] Pipeline failed: ${detail}`);
    res.status(500).json({ error: "Transcription failed", detail });
  } finally {
    // 3. Clean up both original and converted files
    deleteFile(originalPath);
    if (convertedPath) {
      deleteFile(convertedPath);
    }
  }
});

export default router;
