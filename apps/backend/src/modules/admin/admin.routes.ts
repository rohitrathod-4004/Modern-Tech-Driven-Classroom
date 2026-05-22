import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { getQueueHealth, getActiveQueue, getFailedQueue, reprocessLectureAI } from './admin.queue.controller';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';
// import { objectIdSchema } from '@classroom/shared';

const router = Router();

// Apply auth and teacher authorization to all admin routes
router.use(authenticate, authorize('teacher'));

router.get('/queue/health', getQueueHealth);
router.get('/queue/active', getActiveQueue);
router.get('/queue/failed', getFailedQueue);

router.post(
  '/lectures/:lectureId/reprocess-ai',
  validate({ params: z.object({ lectureId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId') }) }),
  reprocessLectureAI
);

export default router;
