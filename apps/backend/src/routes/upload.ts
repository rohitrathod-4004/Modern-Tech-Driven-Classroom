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
import { authenticate } from "../middleware/auth.middleware";
import { LectureService } from "../modules/lecture/lecture.service";
import mongoose from "mongoose";

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const LECTURES_DIR = path.join(__dirname, "../../uploads/lectures");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(LECTURES_DIR)) {
  fs.mkdirSync(LECTURES_DIR, { recursive: true });
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

router.post("/upload-chunk", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  const requestId = `req-${Date.now()}`;

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalPath = req.file.path;
  const language: string    = (req.body.language    as string) || "en";
  const lectureId: string   = (req.body.lectureId   as string);
  const courseId: string    = (req.body.courseId    as string);
  const chunk_index: number = parseInt(req.body.chunk_index as string, 10) || 0;
  
  // Support legacy frontend during deployment rollout
  const session_id: string  = (req.body.session_id  as string) || lectureId || `legacy-${Date.now()}`;

  console.log(`[upload] [${requestId}] File created: ${req.file.originalname} (${req.file.size} bytes)`);
  console.log(`[upload] [${requestId}] lectureId=${lectureId} chunk_index=${chunk_index}`);

  let convertedPath: string | null = null;

  try {
    // 0. Strict Ownership & State Validation (Service Layer)
    if (lectureId) {
      await LectureService.validateLectureUpload(lectureId, req.user!.id);
    }
    // 1. Idempotency check BEFORE expensive processing
    // We check BOTH the new lectureId index and the legacy session_id index
    const query = lectureId ? { lectureId, chunk_index } : { session_id, chunk_index };
    const existingChunk = await TranscriptChunk.findOne(query);
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
    
    // Quick guard for trivially empty files to prevent ffmpeg/python crashes
    // Using 100 bytes (not 500) — WebM headers are small, we don't want to drop real audio
    if (req.file.size < 100) {
      console.log(`[upload] [${requestId}] File size too small (${req.file.size} bytes), skipping processing.`);
      res.json({ text: "", segments: [], latency_ms: 0, status: "skipped" });
      return;
    }

    convertedPath = await convertToWav(originalPath);

    // 3. Send to Python Whisper core
    const startTime = Date.now();
    const result = await transcribeAudio(convertedPath, language);
    const latencyMs = Date.now() - startTime;

    // 4. Apply cleaning filters
    result.text = cleanText(result.text);

    // 5. Upsert session tracking bounds (Legacy keeping for now)
    await Session.findOneAndUpdate(
      { session_id },
      { session_id },
      { upsert: true, returnDocument: 'after' }
    );

    const firstSeg = result.segments && result.segments.length > 0 ? result.segments[0] : null;
    const lastSeg = result.segments && result.segments.length > 0 ? result.segments[result.segments.length - 1] : null;

    await TranscriptChunk.create({
      session_id, // Legacy compatibility dual-write
      lectureId: lectureId ? new mongoose.Types.ObjectId(lectureId) : undefined,
      courseId: courseId ? new mongoose.Types.ObjectId(courseId) : undefined,
      chunk_index,
      text: result.text || "",
      start_time: firstSeg ? firstSeg.start : 0,
      end_time: lastSeg ? lastSeg.end : 0,
      latencyMs,
      processingProvider: 'faster-whisper'
    });
    
    // 6. Record Metrics
    if (lectureId) {
      await LectureService.recordChunkMetrics(lectureId, latencyMs);

      // 7. Persist the WAV chunk for later concatenation into full lecture audio
      try {
        const chunkDir = path.join(LECTURES_DIR, lectureId, 'chunks');
        if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });
        const destPath = path.join(chunkDir, `chunk_${String(chunk_index).padStart(5, '0')}.wav`);
        fs.copyFileSync(convertedPath!, destPath);
        console.log(`[upload] [${requestId}] Audio chunk saved: ${path.basename(destPath)}`);
      } catch (saveErr: any) {
        console.warn(`[upload] [${requestId}] Could not save audio chunk (non-fatal): ${saveErr.message}`);
      }
    }

    // Trigger optimization sequence (Legacy)
    refineSessionChunks(session_id, chunk_index);

    console.log(`[upload] [${requestId}] Persistent chunk_${chunk_index} cached securely.`);
    res.json(result);

  } catch (err: any) {
    console.error(`[upload] [${requestId}] Pipeline aborted: ${err.message}`);
    // For the demo/MVP, if ANY chunk fails to process (usually due to silence/empty data making ffmpeg or whisper crash), 
    // we MUST return a 200 OK with an empty transcript so the frontend queue doesn't get blocked forever.
    console.warn(`[upload] [${requestId}] Treating failed audio processing as an empty chunk to prevent queue blockage.`);
    res.json({ text: "", segments: [], latency_ms: 0, error_details: err.message });
  } finally {
    // 6. Final lifecycle cleanup guarantees
    deleteFileSafely(originalPath, requestId);
    if (convertedPath) {
      deleteFileSafely(convertedPath, requestId);
    }
  }
});

export default router;
