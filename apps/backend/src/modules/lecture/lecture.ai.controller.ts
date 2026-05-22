import { Request, Response } from 'express';
import { lectureAIService } from './lecture.ai.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const getLectureSummary = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const result = await lectureAIService.getSummary(lectureId);
  res.json({ success: true, data: result });
});

export const getLectureTopics = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const result = await lectureAIService.getTopics(lectureId);
  res.json({ success: true, data: result });
});

export const askLectureAI = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ success: false, error: "Question is required" });
  }

  const result = await lectureAIService.askAI(lectureId, question);
  res.json({ success: true, data: result });
});
