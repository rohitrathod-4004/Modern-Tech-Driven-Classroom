import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../redis/redisClient';
import { LECTURE_PROCESSING_QUEUE_NAME, LectureProcessingJobPayload } from './jobs/lectureProcessing.job';
import { Lecture } from '../../models/Lecture';

import { aggregateLectureTranscript } from '../ai/chunking/semanticChunker';
import { generateSummaries } from './processors/summarize.processor';
import { extractTopics } from './processors/topics.processor';
import { generateEmbeddings } from './processors/embeddings.processor';
import { generateQuiz } from './processors/quiz.processor';
import { generateFlashcards } from './processors/flashcards.processor';
import { LectureQuiz } from '../../models/LectureQuiz';
import { LectureFlashcard } from '../../models/LectureFlashcard';

export const startLectureWorker = () => {
  const connection = createBullMQConnection();

  const worker = new Worker<LectureProcessingJobPayload>(
    LECTURE_PROCESSING_QUEUE_NAME,
    async (job: Job<LectureProcessingJobPayload>) => {
      const { lectureId } = job.data;
      console.log(`[Worker] Starting AI processing for lecture: ${lectureId}`);

      const lecture = await Lecture.findById(lectureId);
      if (!lecture) {
        throw new Error(`Lecture ${lectureId} not found`);
      }

      // Idempotency Guard: Bail out if already completed
      if (lecture.aiStatus === 'completed') {
        console.log(`[Worker] Lecture ${lectureId} already completed. Bailing out.`);
        return;
      }

      // Idempotency Guard: Mismatching job ID means this is a stale worker
      if (lecture.aiJobId && lecture.aiJobId !== job.id) {
        console.log(`[Worker] Stale job detected for lecture ${lectureId}. Expected ${lecture.aiJobId}, got ${job.id}. Bailing out.`);
        return;
      }

      try {
        // 1. Mark as ai_processing
        lecture.aiStatus = 'summarizing'; // Initial stage
        lecture.retryCount = job.attemptsMade;
        await lecture.save();

        // --- STAGE 1: Aggregation ---
        await job.updateProgress(10);
        const blocks = await aggregateLectureTranscript(lectureId);
        if (blocks.length === 0) {
          throw new Error('No transcript chunks found to process');
        }
        
        // --- STAGE 2: Summarization ---
        await job.updateProgress(30);
        const summaries = await generateSummaries(blocks);
        lecture.summary = summaries;
        lecture.summaryGeneratedAt = new Date();
        await lecture.save();

        // --- STAGE 3: Topics ---
        lecture.aiStatus = 'embedding';
        await lecture.save();
        await job.updateProgress(60);
        const topics = await extractTopics(blocks);
        lecture.topics = topics;
        lecture.topicsGeneratedAt = new Date();
        await lecture.save();

        // --- STAGE 4: Embeddings ---
        lecture.aiStatus = 'indexing';
        await lecture.save();
        await job.updateProgress(90);
        await generateEmbeddings(lectureId, blocks);
        lecture.embeddingsGeneratedAt = new Date();

        // --- STAGE 5: Study Materials ---
        lecture.aiStatus = 'generating_study_materials';
        await lecture.save();
        await job.updateProgress(95);

        // Generate Quiz
        try {
          console.log(`[Worker] Generating Quiz for ${lectureId}`);
          const questions = await generateQuiz(blocks);
          await LectureQuiz.findOneAndUpdate(
            { lectureId },
            { questions },
            { upsert: true, new: true }
          );
        } catch (quizErr: any) {
          console.error(`[Worker] Failed to generate Quiz for ${lectureId}:`, quizErr);
          // Non-fatal error, let it continue
        }

        // Generate Flashcards
        try {
          console.log(`[Worker] Generating Flashcards for ${lectureId}`);
          const cards = await generateFlashcards(blocks);
          await LectureFlashcard.findOneAndUpdate(
            { lectureId },
            { cards },
            { upsert: true, new: true }
          );
        } catch (flashErr: any) {
          console.error(`[Worker] Failed to generate Flashcards for ${lectureId}:`, flashErr);
          // Non-fatal error
        }

        // 6. Mark Complete
        lecture.aiStatus = 'completed';
        lecture.status = 'ready'; // Update the main status so frontend knows it's ready
        lecture.processingError = undefined; // clear any old errors
        await lecture.save();

        console.log(`[Worker] Successfully completed AI processing for lecture: ${lectureId}`);
        await job.updateProgress(100);
      } catch (error: any) {
        console.error(`[Worker] Failed AI processing for lecture ${lectureId}:`, error);
        
        // Let BullMQ handle retries. Only mark as failed if it's the last attempt.
        if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
          lecture.aiStatus = 'failed';
          lecture.status = 'failed'; // Update main status to failed as well
          lecture.processingError = {
            stage: lecture.aiStatus, // This captures the stage it failed on
            message: error.message || 'Unknown error during AI processing',
            timestamp: new Date()
          };
          lecture.retryCount = job.attemptsMade + 1;
          await lecture.save();
          console.error(`[Worker] Lecture ${lectureId} moved to DLQ (failed completely).`);
        } else {
          // It will retry, just update retry count
          lecture.retryCount = job.attemptsMade + 1;
          await lecture.save();
        }
        
        throw error; // Rethrow to let BullMQ handle retries
      }
    },
    {
      connection,
      concurrency: 1, // Free-tier Gemini: 15 RPM. One lecture at a time prevents quota exhaustion.
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log(`[Worker] Started lecture processing worker. Listening to ${LECTURE_PROCESSING_QUEUE_NAME}`);
  return worker;
};
