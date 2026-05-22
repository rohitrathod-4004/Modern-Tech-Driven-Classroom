import { Queue } from 'bullmq';
import { createBullMQConnection } from '../../redis/redisClient';

export interface LectureProcessingJobPayload {
  lectureId: string;
}

export const LECTURE_PROCESSING_QUEUE_NAME = 'lectureProcessingQueue';

// Exported singleton queue instance
export const lectureProcessingQueue = new Queue<LectureProcessingJobPayload>(LECTURE_PROCESSING_QUEUE_NAME, {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    attempts: 5,          // 5 job-level retries
    backoff: {
      type: 'exponential',
      delay: 65000,       // 65s initial delay — clears Gemini free-tier 60s RPM window
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

export const enqueueLectureProcessing = async (lectureId: string) => {
  const { Lecture } = await import('../../../models/Lecture');
  
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return;

  // Idempotency: Prevent enqueue if already processing or completed
  if (lecture.aiStatus === 'completed' || lecture.aiStatus === 'queued' || lecture.aiStatus === 'summarizing' || lecture.aiStatus === 'embedding' || lecture.aiStatus === 'indexing') {
    console.log(`[Queue] Skipping enqueue for lecture ${lectureId} (status: ${lecture.aiStatus})`);
    return;
  }

  const aiJobId = `lecture-ai-${lectureId}-${Date.now()}`;
  
  await Lecture.updateOne(
    { _id: lecture._id },
    {
      $set: { 
        aiJobId,
        aiProcessingVersion: (lecture.aiProcessingVersion || 0) + 1,
        aiStatus: 'queued',
        retryCount: 0
      },
      $unset: { processingError: '' }
    }
  );

  await lectureProcessingQueue.add('process-lecture-ai', { lectureId }, {
    jobId: aiJobId // Prevent duplicate enqueues at BullMQ layer
  });
  console.log(`[Queue] Enqueued lecture AI processing for ${lectureId}`);
};
