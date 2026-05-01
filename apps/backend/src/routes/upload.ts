import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transcribeAudio } from "../services/transcriptionService";
import { convertToWav } from "../utils/ffmpeg";
import { Session } from "../models/Session";
import { TranscriptChunk } from "../models/TranscriptChunk";
import { refineSessionChunks } from "../services/refinementService";
import { cleanText } from "../utils/cleanup";

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

function deleteFileSafely(filePath: string, requestId: string) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[upload] [${requestId}] File deleted: ${path.basename(filePath)}`);
    }
  } catch (err: any) {
    console.error(`[upload] [${requestId}] Safe deletion error for ${filePath}: ${err.message}`);
  }
}

router.post("/upload-chunk", upload.single("file"), async (req: Request, res: Response) => {
  const requestId = `req-${Date.now()}`;

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalPath = req.file.path;
  const language: string    = (req.body.language    as string) || "en";
  const session_id: string  = (req.body.session_id  as string) || `session-${Date.now()}`;
  const chunk_index: number = parseInt(req.body.chunk_index as string, 10) || 0;

  console.log(`[upload] [${requestId}] File created: ${req.file.originalname} (${req.file.size} bytes)`);
  console.log(`[upload] [${requestId}] session_id=${session_id} chunk_index=${chunk_index}`);

  let convertedPath: string | null = null;

  try {
    // 1. Idempotency check BEFORE expensive processing
    const existingChunk = await TranscriptChunk.findOne({ session_id, chunk_index });
    if (existingChunk) {
      console.log(`[upload] [${requestId}] Duplicate chunk_${chunk_index} ignored.`);
      res.json({
        text: existingChunk.text,
        latency_ms: 0,
        status: "existing",
      });
      return;
    }

    // 2. Convert to WAV (mono, 16kHz)
    console.log(`[upload] [${requestId}] Processing audio payload...`);
    convertedPath = await convertToWav(originalPath);

    // 3. Send to Python Whisper core
    const result = await transcribeAudio(convertedPath, language);

    // 4. Apply cleaning filters
    result.text = cleanText(result.text);

    // 5. Upsert session tracking bounds
    await Session.findOneAndUpdate(
      { session_id },
      { session_id },
      { upsert: true, new: true }
    );

    const firstSeg = result.segments && result.segments.length > 0 ? result.segments[0] : null;
    const lastSeg = result.segments && result.segments.length > 0 ? result.segments[result.segments.length - 1] : null;

    await TranscriptChunk.create({
      session_id,
      chunk_index,
      text: result.text || "",
      start_time: firstSeg ? firstSeg.start : 0,
      end_time: lastSeg ? lastSeg.end : 0,
    });

    // Trigger optimization sequence
    refineSessionChunks(session_id, chunk_index);

    console.log(`[upload] [${requestId}] Persistent chunk_${chunk_index} cached securely.`);
    res.json(result);

  } catch (err: any) {
    console.error(`[upload] [${requestId}] Pipeline aborted: ${err.message}`);
    res.status(503).json({ error: "transcription_unavailable" });
  } finally {
    // 6. Final lifecycle cleanup guarantees
    deleteFileSafely(originalPath, requestId);
    if (convertedPath) {
      deleteFileSafely(convertedPath, requestId);
    }
  }
});

export default router;
