const { mongoose } = require('mongoose');
const { Queue } = require('bullmq');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/lecture-transcription');
  
  const queue = new Queue('lectureProcessingQueue', {
    connection: { host: '127.0.0.1', port: 6379 }
  });

  const lectures = await mongoose.connection.collection('lectures').find({ status: 'ai_processing', aiStatus: 'pending' }).toArray();
  
  console.log(`Found ${lectures.length} orphaned lectures. Enqueuing...`);
  
  for (const lec of lectures) {
    const lectureId = lec._id.toString();
    await queue.add('process-lecture-ai', { lectureId }, {
      jobId: `lecture-ai-${lectureId}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
    console.log(`Enqueued: ${lectureId}`);
  }

  console.log('Done.');
  process.exit(0);
}

run();
