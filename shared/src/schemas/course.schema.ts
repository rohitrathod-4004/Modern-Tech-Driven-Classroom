import { z } from 'zod';

export const CreateCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional()
});

export const JoinCourseSchema = z.object({
  enrollmentCode: z.string().min(1, "Enrollment code is required")
});
