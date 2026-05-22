import { Router } from 'express';
import { LectureController } from './lecture.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { StartLectureSchema } from '@classroom/shared';
import { z } from 'zod';

const objectIdSchemaLocal = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
import { getLectureSummary, getLectureTopics, askLectureAI } from './lecture.ai.controller';
import { getNotes, createNote, deleteNote, getBookmarks, createBookmark, deleteBookmark } from './lecture.collaboration.controller';
import { exportLectureData } from './lecture.export.controller';
import { getLectureQuiz, getLectureFlashcards } from './lecture.study.controller';
import { LectureLibraryController } from './lecture.library.controller';

const router = Router();

// Used inside nested routes or mapped globally. We will map this at /api
// POST /api/courses/:courseId/lectures
router.post(
  '/courses/:courseId/lectures',
  authenticate,
  authorize('teacher'),
  validate({ 
    params: z.object({ courseId: objectIdSchemaLocal }),
    body: StartLectureSchema 
  }),
  asyncHandler(LectureController.start)
);

// POST /api/lectures/:lectureId/end
router.post(
  '/lectures/:lectureId/end',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ lectureId: objectIdSchemaLocal })
  }),
  asyncHandler(LectureController.end)
);

// GET /api/courses/:courseId/lectures
router.get(
  '/courses/:courseId/lectures',
  authenticate,
  validate({
    params: z.object({ courseId: objectIdSchemaLocal }),
    query: z.object({ limit: z.string().regex(/^\d+$/).transform(Number).optional() })
  }),
  asyncHandler(LectureController.list)
);

// GET /api/lectures (Global Library)
router.get(
  '/lectures',
  authenticate,
  validate({
    query: z.object({
      courseId: objectIdSchemaLocal.optional(),
      sort: z.enum(['asc', 'desc']).optional(),
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    })
  }),
  asyncHandler(LectureLibraryController.getAllLectures)
);

// GET /api/courses/:courseId/lectures/:lectureId
router.get(
  '/courses/:courseId/lectures/:lectureId',
  authenticate, // Both students and teachers can view
  validate({
    params: z.object({
      courseId: objectIdSchemaLocal,
      lectureId: objectIdSchemaLocal
    })
  }),
  asyncHandler(LectureController.get)
);

// GET /api/courses/:courseId/lectures/:lectureId/timeline
router.get(
  '/courses/:courseId/lectures/:lectureId/timeline',
  authenticate,
  validate({
    params: z.object({
      courseId: objectIdSchemaLocal,
      lectureId: objectIdSchemaLocal
    }),
    query: z.object({
      cursor: z.string().optional(),
      limit: z.string().optional()
    })
  }),
  asyncHandler(LectureController.getTimeline)
);

// Phase 3A AI endpoints
router.get(
  "/lectures/:lectureId/summary", 
  authenticate, 
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getLectureSummary
);

router.get(
  "/lectures/:lectureId/topics", 
  authenticate, 
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getLectureTopics
);

router.post(
  "/lectures/:lectureId/ask", 
  authenticate, 
  validate({ 
    params: z.object({ lectureId: objectIdSchemaLocal }),
    body: z.object({ question: z.string().min(1) })
  }),
  askLectureAI
);

// Phase 4A Collaboration endpoints
router.get(
  "/lectures/:lectureId/notes",
  authenticate,
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getNotes
);

router.post(
  "/lectures/:lectureId/notes",
  authenticate,
  validate({ 
    params: z.object({ lectureId: objectIdSchemaLocal }),
    body: z.object({ timestamp: z.number().min(0), content: z.string().min(1), chunkId: objectIdSchemaLocal.optional() })
  }),
  createNote
);

router.delete(
  "/notes/:noteId",
  authenticate,
  validate({ params: z.object({ noteId: objectIdSchemaLocal }) }),
  deleteNote
);

router.get(
  "/lectures/:lectureId/bookmarks",
  authenticate,
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getBookmarks
);

router.post(
  "/lectures/:lectureId/bookmarks",
  authenticate,
  validate({ 
    params: z.object({ lectureId: objectIdSchemaLocal }),
    body: z.object({ timestamp: z.number().min(0), title: z.string().optional(), chunkId: objectIdSchemaLocal.optional() })
  }),
  createBookmark
);

router.delete(
  "/bookmarks/:bookmarkId",
  authenticate,
  validate({ params: z.object({ bookmarkId: objectIdSchemaLocal }) }),
  deleteBookmark
);

router.get(
  "/lectures/:lectureId/export",
  authenticate,
  validate({ 
    params: z.object({ lectureId: objectIdSchemaLocal }),
    query: z.object({ format: z.string().optional() })
  }),
  exportLectureData
);

// --- Phase 4B: Study Material Routes ---
router.get(
  "/lectures/:lectureId/quiz",
  authenticate,
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getLectureQuiz
);

router.get(
  "/lectures/:lectureId/flashcards",
  authenticate,
  validate({ params: z.object({ lectureId: objectIdSchemaLocal }) }),
  getLectureFlashcards
);

export default router;
