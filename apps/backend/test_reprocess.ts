import { createBullMQConnection } from './src/infrastructure/redis/redisClient';
import { enqueueLectureProcessing } from './src/infrastructure/queue/jobs/lectureProcessing.job';
import { Lecture } from './src/models/Lecture';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lecture-transcription');
  console.log("Connected");
  try {
    const lectureId = '6a0f8929885196ea9ae8a0b4';
    const lecture = await Lecture.findById(lectureId);
    console.log("Lecture found");

    if (lecture) {
      await Lecture.updateOne(
        { _id: lecture._id },
        {
          $set:   { status: 'ai_processing', aiStatus: 'pending', retryCount: 0 },
          $unset: { aiJobId: '', processingError: '' }
        }
      );
      console.log("Lecture updated");

      await enqueueLectureProcessing(lecture.id);
      console.log("Done");
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

run();
