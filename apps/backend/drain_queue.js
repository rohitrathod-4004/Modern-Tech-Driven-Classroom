const { Queue } = require('bullmq');

const queue = new Queue('lectureProcessingQueue', {
  connection: { host: '127.0.0.1', port: 6379 }
});

async function drain() {
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const delayed = await queue.getDelayed();
  const failed = await queue.getFailed();

  console.log(`Waiting: ${waiting.length}, Active: ${active.length}, Delayed: ${delayed.length}, Failed: ${failed.length}`);

  // Obliterate clears everything from Redis
  await queue.obliterate({ force: true });
  console.log('Queue fully cleared.');

  await queue.close();
  process.exit(0);
}

drain().catch(err => { console.error(err); process.exit(1); });
