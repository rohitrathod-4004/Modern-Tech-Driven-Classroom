import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { lectureProcessingQueue, enqueueLectureProcessing } from '../../infrastructure/queue/jobs/lectureProcessing.job';
import { Lecture } from '../../models/Lecture';

export const getQueueHealth = asyncHandler(async (req: Request, res: Response) => {
  // Return BullMQ standard health
  const jobCounts = await lectureProcessingQueue.getJobCounts();
  res.json({
    success: true,
    data: {
      isPaused: await lectureProcessingQueue.isPaused(),
      counts: jobCounts
    }
  });
});

export const getActiveQueue = asyncHandler(async (req: Request, res: Response) => {
  const activeJobs = await lectureProcessingQueue.getActive();
  res.json({
    success: true,
    data: activeJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade
    }))
  });
});

export const getFailedQueue = asyncHandler(async (req: Request, res: Response) => {
  const failedJobs = await lectureProcessingQueue.getFailed();
  res.json({
    success: true,
    data: failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade
    }))
  });
});

export const reprocessLectureAI = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    return res.status(404).json({ success: false, error: 'Lecture not found' });
  }

  // Block reprocessing only if actively running
  const activeStatuses = ['queued', 'summarizing', 'embedding', 'indexing'];
  if (activeStatuses.includes(lecture.aiStatus || '')) {
    return res.status(400).json({ success: false, error: `Lecture is currently being processed (${lecture.aiStatus}). Please wait.` });
  }

  // Reset all AI state using direct DB update to avoid Mongoose validation issues with nested fields
  await Lecture.updateOne(
    { _id: lecture._id },
    {
      $set:   { status: 'ai_processing', aiStatus: 'pending', retryCount: 0 },
      $unset: { aiJobId: '', processingError: '' }
    }
  );

  await enqueueLectureProcessing(lecture.id);

  res.json({
    success: true,
    data: {
      message: 'Lecture re-queued for AI processing successfully.'
    }
  });
});
