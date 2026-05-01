import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/lecture-transcription";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[db] Connected to MongoDB: ${MONGO_URI}`);
  } catch (err: any) {
    console.error(`[db] MongoDB connection failed: ${err.message}`);
    // Do not crash the service — transcription still works without DB
  }
}
