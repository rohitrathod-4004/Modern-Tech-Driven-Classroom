import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { CourseController } from './course.controller';
import { z } from 'zod';

const objectIdSchemaLocal = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const router = Router();

// GET /api/courses
router.get(
  '/',
  authenticate,
  asyncHandler(CourseController.list)
);

// GET /api/courses/:courseId
router.get(
  '/:courseId',
  authenticate,
  validate({
    params: z.object({ courseId: objectIdSchemaLocal })
  }),
  asyncHandler(CourseController.get)
);

// POST /api/courses
router.post(
  '/',
  authenticate,
  authorize('teacher'),
  validate({
    body: z.object({
      title: z.string().min(1, 'Title is required').max(100),
      description: z.string().optional()
    })
  }),
  asyncHandler(CourseController.create)
);

// PUT /api/courses/:courseId
router.put(
  '/:courseId',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ courseId: objectIdSchemaLocal }),
    body: z.object({
      title: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional()
    })
  }),
  asyncHandler(CourseController.update)
);

// DELETE /api/courses/:courseId
router.delete(
  '/:courseId',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ courseId: objectIdSchemaLocal })
  }),
  asyncHandler(CourseController.delete)
);

// POST /api/courses/join
router.post(
  '/join',
  authenticate,
  authorize('student'),
  validate({
    body: z.object({
      enrollmentCode: z.string().min(1, 'Enrollment code is required')
    })
  }),
  asyncHandler(CourseController.join)
);

export default router;
