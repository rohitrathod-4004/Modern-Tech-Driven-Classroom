import { Lecture } from '../../models/Lecture';
import { enqueueLectureProcessing } from './jobs/lectureProcessing.job';

/**
 * Recovers any lectures that were stranded in an active AI processing state
 * during a server crash or Redis restart.
 */
export async function recoverStrandedAIJobs() {
  console.log('[Queue Recovery] Scanning for stranded AI jobs...');
  
  const strandedLectures = await Lecture.find({
    aiStatus: { $in: ['queued', 'summarizing', 'embedding', 'indexing'] }
  });

  if (strandedLectures.length === 0) {
    console.log('[Queue Recovery] No stranded jobs found.');
    return;
  }

  console.log(`[Queue Recovery] Found ${strandedLectures.length} stranded jobs. Re-queuing safely...`);

  for (const lecture of strandedLectures) {
    // We reset the aiStatus slightly so the enqueue function doesn't bail out
    // and we let the enqueue logic handle idempotency assignment.
    lecture.aiStatus = 'pending';
    await lecture.save();
    
    await enqueueLectureProcessing(lecture.id);
  }

  console.log('[Queue Recovery] Recovery complete.');
}
