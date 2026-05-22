import { Request, Response, RequestHandler } from "express";
import * as lectureService from "../services/lecture/lectureService";
import { Classroom } from "../models/Classroom";
import { SavedSummary } from "../models/SavedSummary";
import { generateQuizAndFlashcards } from "../services/revision/revisionService";
import path from "path";
import fs from "fs";
import { mergeChunksToMp3 } from "../utils/ffmpeg";
import { TranscriptChunk } from "../models/TranscriptChunk";
import { LectureSession } from "../models/LectureSession";
import { embeddingProvider } from "../services/embeddingService";
import { ensureCollectionExists, upsertPoints } from "../services/qdrantService";
import { v4 as uuidv4 } from "uuid";


// Asynchronous background indexing function
async function indexLectureTranscript(session_id: string, classroom_id: string, lecture_title: string) {
  try {
    console.log(`[Qdrant Indexing] Starting indexing for session: ${session_id}`);
    
    // 1. Fetch chunks
    const chunks = await TranscriptChunk.find({ session_id }).sort({ chunk_index: 1 });
    if (chunks.length === 0) {
      console.log(`[Qdrant Indexing] No chunks found to index for session: ${session_id}`);
      await LectureSession.updateOne({ session_id }, { $set: { "processing_state.semantic_index": "completed" } });
      return;
    }

    // 2. Ensure Qdrant collection exists with proper dimensions
    await ensureCollectionExists(embeddingProvider.getDimensions());

    // 3. Batch generate embeddings for chunks
    const texts = chunks.map((c) => c.text || "[Silent segment]");
    const embeddings = await embeddingProvider.embedBatch(texts);
    console.log(`[Qdrant Indexing] Embeddings generated: successfully generated ${embeddings.length} embeddings for session ${session_id}`);

    const points = chunks.map((c, i) => ({
      id: uuidv4(),
      vector: embeddings[i],
      payload: {
        session_id,
        classroom_id,
        chunk_index: c.chunk_index,
        text: c.text || "",
        start_time: c.start_time || 0,
        end_time: c.end_time || 0,
        lecture_title,
      },
    }));

    // 4. Upload vectors to Qdrant
    console.log(`[Qdrant Indexing] Uploading ${points.length} vectors to Qdrant`);
    await upsertPoints(points);
    console.log(`[Qdrant Indexing] Vectors uploaded: successfully uploaded vector count: ${points.length} for session ${session_id}`);

    // 5. Update index processing state
    await LectureSession.updateOne({ session_id }, { $set: { "processing_state.semantic_index": "completed" } });
    console.log(`[Qdrant Indexing] Indexing completion: successfully completed indexing for session ${session_id}`);
  } catch (err: any) {
    console.error(`[Qdrant Indexing] Failed to index session ${session_id}:`, err.message);
    await LectureSession.updateOne({ session_id }, { $set: { "processing_state.semantic_index": "failed" } });
  }
}

export const reindexLectureHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    const lecture = await lectureService.getLectureBySessionId(session_id);
    if (!lecture) {
      res.status(404).json({ error: "Lecture session not found" });
      return;
    }

    // Set status to in_progress
    await LectureSession.updateOne(
      { session_id },
      { $set: { "processing_state.semantic_index": "in_progress" } }
    );

    // Run the reindexing synchronously so we can return its final state in the response
    await indexLectureTranscript(session_id, lecture.classroom_id.toString(), lecture.title);

    const updated = await lectureService.getLectureBySessionId(session_id);
    if (updated?.processing_state?.semantic_index === "failed") {
      res.status(500).json({
        error: "reindexing_failed",
        message: "Semantic reindexing failed. Check backend logs.",
      });
      return;
    }

    res.json({
      message: "Lecture semantic reindexing completed",
      lecture: updated,
    });
  } catch (error: any) {
    console.error("[LectureController] reindexLectureHandler:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const startLecture: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { classroom_id, title } = req.body;
    if (!classroom_id || !title) {
      res.status(400).json({ error: "classroom_id and title are required" });
      return;
    }

    // Verify faculty owns this classroom
    const classroom = await Classroom.findOne({
      _id: classroom_id,
      faculty_id: req.user!.userId,
    });
    if (!classroom) {
      res.status(403).json({ error: "Classroom not found or access denied" });
      return;
    }

    const session = await lectureService.startLectureSession(
      classroom_id,
      req.user!.userId,
      title
    );

    res.status(201).json(session);
  } catch (error) {
    console.error("[LectureController] startLecture:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLecturesByClassroom: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lectures = await lectureService.getLecturesByClassroom(id);
    res.json(lectures);
  } catch (error) {
    console.error("[LectureController] getLecturesByClassroom:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLectureDetail: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const detail = await lectureService.getLectureDetail(session_id);

    if (!detail) {
      res.status(404).json({ error: "Lecture session not found" });
      return;
    }

    res.json(detail);
  } catch (error) {
    console.error("[LectureController] getLectureDetail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const completeLecture: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    // Idempotent: if already completed, return success without writing again
    const existing = await lectureService.getLectureBySessionId(session_id);
    if (!existing) {
      res.status(404).json({ error: "Lecture session not found" });
      return;
    }
    if (existing.status === "completed") {
      res.json({ message: "Lecture already completed", lecture: existing });
      return;
    }

    const chunks = await TranscriptChunk.find({ session_id }).sort({ chunk_index: 1 });
    const UPLOAD_DIR = path.join(__dirname, "../../uploads");
    const sessionDir = path.join(UPLOAD_DIR, "sessions", session_id);
    
    const chunkPaths = chunks.map(c => path.join(sessionDir, `chunk_${c.chunk_index}.webm`));
    const validChunkPaths = chunkPaths.filter(p => fs.existsSync(p));

    let audioPath: string | undefined = undefined;
    let audioUrl: string | undefined = undefined;

    if (validChunkPaths.length > 0) {
      const masterMp3Path = path.join(sessionDir, "master.mp3");
      console.log(`[lectureController] Stitching ${validChunkPaths.length} chunks to ${masterMp3Path}`);
      await mergeChunksToMp3(validChunkPaths, masterMp3Path);

      audioPath = `uploads/sessions/${session_id}/master.mp3`;
      audioUrl = `/api/lectures/${session_id}/audio`;

      // Clean up chunk files
      validChunkPaths.forEach(p => {
        try {
          fs.unlinkSync(p);
        } catch (err: any) {
          console.error(`[lectureController] Failed to delete chunk file ${p}: ${err.message}`);
        }
      });
    }

    const updated = await LectureSession.findOneAndUpdate(
      { session_id },
      {
        $set: {
          status: "completed",
          endedAt: new Date(),
          "processing_state.transcription": "completed",
          audio_path: audioPath,
          audio_url: audioUrl,
        },
      },
      { new: true }
    );

    // Asynchronously index transcript chunks in Qdrant vector store
    indexLectureTranscript(session_id, existing.classroom_id.toString(), existing.title).catch((err) => {
      console.error("[LectureController] Qdrant indexing trigger error:", err);
    });

    res.json({ message: "Lecture marked as completed", lecture: updated });
  } catch (error) {
    console.error("[LectureController] completeLecture:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLectureAudio: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    const lecture = await lectureService.getLectureBySessionId(session_id);
    if (!lecture) {
      res.status(404).json({ error: "Lecture session not found" });
      return;
    }

    if (!lecture.audio_path) {
      res.status(404).json({ error: "Audio not found for this lecture session" });
      return;
    }

    const absolutePath = path.resolve(path.join(__dirname, "../.."), lecture.audio_path);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "Audio file not found on disk" });
      return;
    }

    res.sendFile(absolutePath);
  } catch (error) {
    console.error("[LectureController] getLectureAudio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveSummaryForSession: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { summaryData } = req.body;

    if (!summaryData) {
      res.status(400).json({ error: "summaryData is required" });
      return;
    }

    // Upsert summary — unique index on session_id ensures exactly one record per session
    const saved = await SavedSummary.findOneAndUpdate(
      { session_id },
      { $set: { summaryData, generatedAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );

    // Update the LectureSession processing_state to reflect summary is done
    await lectureService.markSummaryComplete(session_id);

    // Asynchronously generate Quiz & Flashcards in the background
    const summaryText = typeof summaryData === "string" ? summaryData : JSON.stringify(summaryData);
    generateQuizAndFlashcards(session_id, summaryText).catch((err) => {
      console.error("[LectureController] Quiz & Flashcard generation background error:", err);
    });

    res.json({ message: "Summary saved", saved });
  } catch (error) {
    console.error("[LectureController] saveSummaryForSession:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getQuizForSession: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { Quiz } = await import("../models/Quiz");
    const quiz = await Quiz.findOne({ session_id });
    if (!quiz) {
       res.status(404).json({ error: "Quiz not found for this lecture" });
       return;
    }
    res.json(quiz);
  } catch (error) {
    console.error("[LectureController] getQuizForSession:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFlashcardsForSession: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { Flashcard } = await import("../models/Flashcard");
    const flashcards = await Flashcard.findOne({ session_id });
    if (!flashcards) {
       res.status(404).json({ error: "Flashcards not found for this lecture" });
       return;
    }
    res.json(flashcards);
  } catch (error) {
    console.error("[LectureController] getFlashcardsForSession:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setupDemoSession: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { chunks, summaryData } = req.body;

    const existing = await lectureService.getLectureBySessionId(session_id);
    if (!existing) {
      res.status(404).json({ error: "Lecture session not found" });
      return;
    }

    // 1. Bulk insert chunks
    if (chunks && chunks.length > 0) {
      await TranscriptChunk.deleteMany({ session_id });
      
      const chunkDocs = chunks.map((c: any, i: number) => ({
        session_id,
        chunk_index: c.chunk_index ?? i,
        text: c.text ?? "",
        start_time: c.start_time ?? i * 30,
        end_time: c.end_time ?? (i + 1) * 30,
        confidence: 0.99,
      }));
      await TranscriptChunk.insertMany(chunkDocs);
    }

    // 2. Save summary
    if (summaryData) {
      await SavedSummary.findOneAndUpdate(
        { session_id },
        { $set: { summaryData, generatedAt: new Date() } },
        { upsert: true }
      );
      await lectureService.markSummaryComplete(session_id);

      // Async generate quiz and flashcards
      const summaryText = typeof summaryData === "string" ? summaryData : JSON.stringify(summaryData);
      generateQuizAndFlashcards(session_id, summaryText).catch((err) => {
        console.error("[LectureController] Quiz & Flashcard generation demo error:", err);
      });
    }

    // 3. Mark lecture completed
    const updated = await LectureSession.findOneAndUpdate(
      { session_id },
      {
        $set: {
          status: "completed",
          endedAt: new Date(),
          "processing_state.transcription": "completed",
        },
      },
      { new: true }
    );

    // Asynchronously index transcript chunks in Qdrant vector store
    indexLectureTranscript(session_id, existing.classroom_id.toString(), existing.title).catch((err) => {
      console.error("[LectureController] Qdrant indexing demo trigger error:", err);
    });

    res.json({ message: "Demo session saved successfully", lecture: updated });
  } catch (err: any) {
    console.error("[LectureController] setupDemoSession error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

