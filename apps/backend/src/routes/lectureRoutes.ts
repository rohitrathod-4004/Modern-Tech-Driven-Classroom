import express from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  startLecture,
  getLecturesByClassroom,
  getLectureDetail,
  completeLecture,
  saveSummaryForSession,
  getQuizForSession,
  getFlashcardsForSession,
  getLectureAudio,
  reindexLectureHandler,
  setupDemoSession,
} from "../controllers/lectureController";
import { askLectureHandler } from "../controllers/ragController";

const router = express.Router();

// All authenticated: get audio file stream for a lecture
router.get("/:session_id/audio", requireAuth, getLectureAudio);

// Faculty only: start a new lecture session
router.post("/start", requireAuth, requireRole("faculty"), startLecture);

// All authenticated: get lecture history for a classroom
router.get("/classroom/:id", requireAuth, getLecturesByClassroom);

// All authenticated: get full detail for a single session (transcript + summary)
router.get("/:session_id", requireAuth, getLectureDetail);

// Faculty only: mark lecture as completed
router.patch("/:session_id/complete", requireAuth, requireRole("faculty"), completeLecture);

// Faculty only: save a demo session completely
router.post("/:session_id/demo-setup", requireAuth, requireRole("faculty"), setupDemoSession);

// All authenticated: save/upsert summary for a session
router.post("/:session_id/summary", requireAuth, saveSummaryForSession);

// All authenticated: get quiz for a session
router.get("/:session_id/quiz", requireAuth, getQuizForSession);

// All authenticated: get flashcards for a session
router.get("/:session_id/flashcards", requireAuth, getFlashcardsForSession);

// All authenticated: ask semantic questions on a single lecture session
router.post("/:session_id/ask", requireAuth, askLectureHandler);

// All authenticated: manually trigger semantic reindexing
router.post("/:session_id/reindex", requireAuth, reindexLectureHandler);

export default router;
