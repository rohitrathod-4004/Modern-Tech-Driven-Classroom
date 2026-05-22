const mongoose = require('mongoose');

async function run() {
  const conn = await mongoose.createConnection('mongodb://localhost:27017/lecture-transcription').asPromise();

  // Delete all lectures that failed AND have zero transcript chunks
  const failedLectures = await conn.collection('lectures')
    .find({ status: 'failed' })
    .toArray();

  let deleted = 0;
  for (const lec of failedLectures) {
    const lectureId = lec._id.toString();
    const chunkCount = await conn.collection('transcriptchunks').countDocuments({ lectureId });
    
    if (chunkCount === 0) {
      await conn.collection('lectures').deleteOne({ _id: lec._id });
      console.log(`Deleted empty lecture: "${lec.title}" (${lectureId})`);
      deleted++;
    }
  }

  console.log(`\nDeleted ${deleted} empty lectures.`);

  // Show remaining
  const remaining = await conn.collection('lectures')
    .find({}, { projection: { title: 1, status: 1, aiStatus: 1 } })
    .toArray();
  console.log('\n=== Remaining Lectures ===');
  remaining.forEach(l => console.log(`  [${l.status}] ${l.title}`));

  await conn.close();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
