import { z } from 'zod';

export const StartLectureSchema = z.object({
  title: z.string().min(1, "Lecture title is required")
});
