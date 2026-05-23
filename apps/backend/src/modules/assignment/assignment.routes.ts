import { Router } from 'express';
import { AssignmentController } from './assignment.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Configure temporary multer storage for submissions
const TEMP_DIR = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `temp-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// POST /api/courses/:courseId/assignments (Teacher: Create assignment)
router.post(
  '/courses/:courseId/assignments',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ courseId: objectIdSchema }),
    body: z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
      dueDate: z.string().min(1, 'Due date is required'),
      maxSizeMb: z.string().optional().transform(v => v ? parseInt(v, 10) : 10)
    })
  }),
  asyncHandler(AssignmentController.create)
);

// GET /api/courses/:courseId/assignments (All members: List assignments)
router.get(
  '/courses/:courseId/assignments',
  authenticate,
  validate({
    params: z.object({ courseId: objectIdSchema })
  }),
  asyncHandler(AssignmentController.list)
);

// DELETE /api/assignments/:assignmentId (Teacher: Delete assignment)
router.delete(
  '/assignments/:assignmentId',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ assignmentId: objectIdSchema })
  }),
  asyncHandler(AssignmentController.delete)
);

// POST /api/assignments/:assignmentId/submissions (Student: Submit file)
router.post(
  '/assignments/:assignmentId/submissions',
  authenticate,
  authorize('student'),
  upload.single('file'),
  validate({
    params: z.object({ assignmentId: objectIdSchema })
  }),
  asyncHandler(AssignmentController.submit)
);

// GET /api/assignments/:assignmentId/submissions (Teacher: View all submissions)
router.get(
  '/assignments/:assignmentId/submissions',
  authenticate,
  authorize('teacher'),
  validate({
    params: z.object({ assignmentId: objectIdSchema })
  }),
  asyncHandler(AssignmentController.getSubmissions)
);

// GET /api/assignments/:assignmentId/submissions/my (Student: View own submission)
router.get(
  '/assignments/:assignmentId/submissions/my',
  authenticate,
  authorize('student'),
  validate({
    params: z.object({ assignmentId: objectIdSchema })
  }),
  asyncHandler(AssignmentController.getStudentSubmission)
);

export default router;
