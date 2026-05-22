const mongoose = require('mongoose');
const { Queue } = require('bullmq');

const MONGO_URI = 'mongodb://localhost:27017/lecture-transcription';
const REDIS_CONN = { host: '127.0.0.1', port: 6379 };

// These 2 genuinely have no audio/transcript data
const NO_TRANSCRIPT_IDS = [
  '6a0f91004baf528d2a183b77',
  '6a0f9292d2a878038172bc39',
];

async function run() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const queue = new Queue('lectureProcessingQueue', { connection: REDIS_CONN });

  // Find all failed OR pending lectures
  const lectures = await conn.collection('lectures')
    .find({ $or: [{ aiStatus: 'failed' }, { status: 'ai_processing', aiStatus: 'pending' }] })
    .toArray();

  console.log(`Found ${lectures.length} lectures to check.`);

  let requeued = 0;
  let skipped = 0;

  for (const lec of lectures) {
    const lectureId = lec._id.toString();

    if (NO_TRANSCRIPT_IDS.includes(lectureId)) {
      console.log(`SKIP (no transcript data): ${lectureId}`);
      skipped++;
      continue;
    }

    const jobId = `lecture-ai-rescue-${lectureId}`;

    await conn.collection('lectures').updateOne(
      { _id: lec._id },
      {
        $set: {
          status: 'ai_processing',
          aiStatus: 'pending',
          aiJobId: jobId,
          retryCount: 0,
          processingError: null
        }
      }
    );

    try {
      await queue.add('process-lecture-ai', { lectureId }, {
        jobId: jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: true,
        removeOnFail: false
      });
      console.log(`Enqueued: ${lectureId}`);
      requeued++;
    } catch (e) {
      console.log(`Already in queue: ${lectureId}`);
      requeued++;
    }
  }

  console.log(`\nDone. Enqueued: ${requeued}, Skipped: ${skipped}`);
  await queue.close();
  await conn.close();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
