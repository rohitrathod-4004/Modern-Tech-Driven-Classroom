const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/classroom_db').then(async () => {
  const result = await mongoose.connection.collection('lectures').updateMany(
    { status: 'ai_processing', aiStatus: 'completed' },
    { $set: { status: 'completed' } }
  );
  console.log('Fixed stuck lectures:', result.modifiedCount);
  process.exit(0);
});
