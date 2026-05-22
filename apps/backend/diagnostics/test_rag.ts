import mongoose from "mongoose";
import dotenv from "dotenv";
import { askLecture } from "../src/services/ragService";
import { LectureSession } from "../src/models/LectureSession";
import { embeddingProvider } from "../src/services/embeddingService";

dotenv.config();

// Override embedding dimensions and model for test
const TARGET_DIMS = 768;
const TARGET_MODEL = "gemini-embedding-2";

async function testRag() {
  console.log("=== RAG QA PIPELINE DIAGNOSTIC ===");
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lecture-transcription");
  console.log("Connected.");

  try {
    const completedSession = await LectureSession.findOne({ status: "completed" });
    if (!completedSession) {
      console.log("No completed lecture sessions found to query.");
      return;
    }

    // Configure the embedding provider to match the new models
    (embeddingProvider as any).dimensions = TARGET_DIMS;
    (embeddingProvider as any).modelName = TARGET_MODEL;

    const question = "What is the new liquid being tested?";
    console.log(`\nQuerying session "${completedSession.title}" (${completedSession.session_id})`);
    console.log(`Question: "${question}"`);

    console.log("\nExecuting RAG retrieval & QA generator...");
    const response = await askLecture(completedSession.session_id, question);
    
    console.log("\n--- ANSWER ---");
    console.log(response.answer);
    
    console.log("\n--- CITATIONS ---");
    if (response.citations.length === 0) {
      console.log("No citations returned.");
    } else {
      response.citations.forEach((c, idx) => {
        console.log(`[Source ${idx + 1}] (Time: ${c.start_time}s): "${c.text}"`);
      });
    }

    // Test empty result handling
    console.log("\nTesting empty result handling with a query that has no vector matches...");
    const irrelevantQuestion = "What is the capital of France?";
    const emptyResponse = await askLecture(completedSession.session_id, irrelevantQuestion);
    console.log("Response to irrelevant question:", emptyResponse.answer);

  } catch (err: any) {
    console.error("RAG pipeline failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
  }
}

testRag();
