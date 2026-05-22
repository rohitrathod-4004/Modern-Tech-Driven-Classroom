const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/lecture-transcription';
const LECTURE_ID = '6a0fba5cd1e72be94dd02502'; // Your failed lecture ID

async function run() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const db = conn.collection('lectures');

  console.log(`Setting lecture ${LECTURE_ID} to ready state...`);

  await db.updateOne(
    { _id: new mongoose.Types.ObjectId(LECTURE_ID) },
    {
      $set: { 
        status: 'ready',
        aiStatus: 'failed'
      }
    }
  );

  console.log('Lecture successfully set to ready! The frontend will now display it correctly.');
  
  await conn.close();
  process.exit(0);
}

run().catch(console.error);
