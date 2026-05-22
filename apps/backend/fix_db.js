const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/lecture-transcription').then(async () => {
  const lectures = await mongoose.connection.collection('lectures').find({}, { projection: { title: 1, status: 1, aiStatus: 1, retryCount: 1, 'processingError.stage': 1 } }).toArray();
  console.log(JSON.stringify(lectures, null, 2));

  // Fix stuck ones
  const result1 = await mongoose.connection.collection('lectures').updateMany(
    { status: 'ai_processing', aiStatus: 'completed' },
    { $set: { status: 'ready' } }
  );
  
  const result2 = await mongoose.connection.collection('lectures').updateMany(
    { status: 'ai_processing', aiStatus: 'failed' },
    { $set: { status: 'failed' } }
  );
  
  console.log('Fixed stuck as ready:', result1.modifiedCount);
  console.log('Fixed stuck as failed:', result2.modifiedCount);

  process.exit(0);
});
