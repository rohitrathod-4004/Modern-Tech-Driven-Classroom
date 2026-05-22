import mongoose from "mongoose";
import dotenv from "dotenv";
import { TranscriptChunk } from "../src/models/TranscriptChunk";
import { LectureSession } from "../src/models/LectureSession";
import { embeddingProvider } from "../src/services/embeddingService";
import { ensureCollectionExists, upsertPoints, qdrantClient, COLLECTION_NAME } from "../src/services/qdrantService";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Override dimension configuration and model for testing recreation
const TARGET_DIMS = 768;
const TARGET_MODEL = "gemini-embedding-2";

async function reindex() {
  console.log("=== SEMANTIC REINDEXING TEST ===");
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lecture-transcription");
  console.log("Connected.");

  try {
    // 1. Fetch completed sessions
    const completedSession = await LectureSession.findOne({ status: "completed" });
    if (!completedSession) {
      console.log("No completed lecture sessions found in database to test reindexing.");
      return;
    }
    console.log(`Target Session: "${completedSession.title}" (${completedSession.session_id})`);

    // 2. Fetch chunks
    const chunks = await TranscriptChunk.find({ session_id: completedSession.session_id }).sort({ chunk_index: 1 });
    console.log(`Found ${chunks.length} chunks in MongoDB.`);
    if (chunks.length === 0) {
      console.log("Aborted: No chunks to index.");
      return;
    }

    // 3. Handle collection creation & dimension check
    console.log("\nChecking Qdrant collection status...");
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some((c) => c.name === COLLECTION_NAME);
    if (exists) {
      const info = await qdrantClient.getCollection(COLLECTION_NAME) as any;
      const currentDims = info.config?.params?.vectors?.size;
      console.log(`Collection "${COLLECTION_NAME}" exists with dimension: ${currentDims}`);
      
      if (currentDims !== TARGET_DIMS) {
        console.log(`Dimension mismatch (expected ${TARGET_DIMS}, got ${currentDims}). Re-creating collection...`);
        await qdrantClient.deleteCollection(COLLECTION_NAME);
        console.log("Deleted old collection.");
      }
    }

    // Call ensureCollectionExists
    console.log(`Ensuring Qdrant collection exists with size ${TARGET_DIMS}...`);
    // Modifying provider parameters temporarily for internal logic verification
    (embeddingProvider as any).dimensions = TARGET_DIMS;
    await ensureCollectionExists(TARGET_DIMS);
    console.log("Collection validated.");

    // 4. Generate embeddings
    console.log("\nGenerating embeddings using Gemini...");
    (embeddingProvider as any).modelName = TARGET_MODEL;
    const texts = chunks.map((c) => c.text || "[Silent segment]");
    const embeddings = await embeddingProvider.embedBatch(texts);
    console.log(`Generated ${embeddings.length} embeddings of size ${embeddings[0].length}.`);

    // 5. Build points
    const points = chunks.map((c, i) => ({
      id: uuidv4(),
      vector: embeddings[i],
      payload: {
        session_id: completedSession.session_id,
        classroom_id: completedSession.classroom_id.toString(),
        chunk_index: c.chunk_index,
        text: c.text || "",
        start_time: c.start_time || 0,
        end_time: c.end_time || 0,
        lecture_title: completedSession.title,
      },
    }));
    console.log(`Prepared ${points.length} points.`);

    // 6. Upsert points
    console.log("Uploading points to Qdrant...");
    await upsertPoints(points);
    console.log("Qdrant upsert complete!");

    // 7. Update state in Mongo
    await LectureSession.updateOne(
      { session_id: completedSession.session_id },
      { $set: { "processing_state.semantic_index": "completed" } }
    );
    console.log("MongoDB processing state updated.");

  } catch (err: any) {
    console.error("Reindexing pipeline failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
  }
}

reindex();
