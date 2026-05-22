import mongoose from "mongoose";
import dotenv from "dotenv";
import { TranscriptChunk } from "../src/models/TranscriptChunk";

dotenv.config();

async function testTimeline() {
  console.log("=== TIMELINE OFFSET DIAGNOSTIC ===");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lecture-transcription");
  console.log("Connected.");

  try {
    const sessionId = "13b04f4a-0943-441f-be23-891daef3a1e4";

    // 1. Show old chunks (Before Fix)
    console.log("\n--- Transcript Timestamps BEFORE Fix (MongoDB records) ---");
    const oldChunks = await TranscriptChunk.find({ session_id: sessionId })
      .sort({ chunk_index: 1 })
      .limit(5);

    if (oldChunks.length === 0) {
      console.log("No old chunks found for session", sessionId);
    } else {
      oldChunks.forEach((c) => {
        console.log(
          `Chunk #${c.chunk_index} | start_time: ${c.start_time.toFixed(2)}s | end_time: ${c.end_time.toFixed(2)}s | Text: "${c.text}"`
        );
      });
    }

    // 2. Simulate inserting new chunks with the cumulative offset fix (After Fix)
    console.log("\n--- Simulating Transcript Chunk inserts AFTER Fix ---");
    const testSessionId = `test-timeline-fix-${Date.now()}`;
    const CHUNK_DURATION_SEC = 3;
    
    // Simulate Whisper segments returning start/end relative to the 3-second chunk
    const mockWhisperOutputs = [
      { chunk_index: 0, text: "Welcome to class.", firstSeg: { start: 0.1 }, lastSeg: { end: 2.8 } },
      { chunk_index: 1, text: "Today we will cover math.", firstSeg: { start: 0.2 }, lastSeg: { end: 2.5 } },
      { chunk_index: 2, text: "Let's start with addition.", firstSeg: { start: 0.0 }, lastSeg: { end: 2.9 } },
    ];

    for (const item of mockWhisperOutputs) {
      const cumulativeOffset = item.chunk_index * CHUNK_DURATION_SEC;
      const start_time = item.firstSeg.start + cumulativeOffset;
      const end_time = item.lastSeg.end + cumulativeOffset;

      await TranscriptChunk.create({
        session_id: testSessionId,
        chunk_index: item.chunk_index,
        text: item.text,
        start_time,
        end_time,
      });
    }

    // Fetch and display the newly inserted chunks
    const newChunks = await TranscriptChunk.find({ session_id: testSessionId }).sort({ chunk_index: 1 });
    newChunks.forEach((c) => {
      console.log(
        `Chunk #${c.chunk_index} | start_time: ${c.start_time.toFixed(2)}s | end_time: ${c.end_time.toFixed(2)}s | Text: "${c.text}"`
      );
    });

    // Cleanup test records
    await TranscriptChunk.deleteMany({ session_id: testSessionId });
    console.log("\nTemporary test timeline records cleaned up.");

  } catch (err: any) {
    console.error("Timeline test failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

testTimeline();
