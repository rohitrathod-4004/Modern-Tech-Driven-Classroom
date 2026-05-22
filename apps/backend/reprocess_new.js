const mongoose = require('mongoose');
const { Queue } = require('bullmq');

const MONGO_URI = 'mongodb://localhost:27017/lecture-transcription';
const REDIS_CONN = { host: '127.0.0.1', port: 6379 };
const LECTURE_ID = '6a100ecefd6dfccb9c163dba';

async function run() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const queue = new Queue('lectureProcessingQueue', { connection: REDIS_CONN });

  const aiJobId = `lecture-ai-${LECTURE_ID}-${Date.now()}`;

  // Reset to pending
  await conn.collection('lectures').updateOne(
    { _id: new mongoose.Types.ObjectId(LECTURE_ID) },
    {
      $set:   { status: 'ai_processing', aiStatus: 'queued', aiJobId, retryCount: 0 },
      $unset: { processingError: '' }
    }
  );

  await queue.add('process-lecture-ai', { lectureId: LECTURE_ID }, {
    jobId: aiJobId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  });
  console.log('Enqueued for reprocessing new lecture.');

  await queue.close();
  await conn.close();
  process.exit(0);
}

run().catch(console.error);
