import dotenv from "dotenv";
import { genAI } from "../src/services/summary/geminiClient";
import { embeddingProvider } from "../src/services/embeddingService";

dotenv.config();

async function testEmbedding() {
  console.log("=== GEMINI EMBEDDING DIAGNOSTIC ===");
  const apiKey = process.env.GEMINI_API_KEY || "";
  console.log(`API Key prefix: ${apiKey.substring(0, 8)}...`);

  // Test 1: text-embedding-004 (current default)
  console.log("\nTesting configured model: text-embedding-004...");
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const res = await model.embedContent("Hello World");
    console.log(`Success! Dimension: ${res.embedding.values.length}`);
  } catch (err: any) {
    console.log(`Failed as expected: ${err.message}`);
  }

  // Test 2: embeddingProvider.embedText
  console.log("\nTesting configured embeddingProvider.embedText...");
  try {
    const res = await embeddingProvider.embedText("Hello World");
    console.log(`Success! Dimension: ${res.length}`);
  } catch (err: any) {
    console.log(`Failed: ${err.message}`);
  }

  // Test 3: Batch embedding on embeddingProvider
  console.log("\nTesting configured embeddingProvider.embedBatch...");
  try {
    const sampleTexts = ["First sentence.", "Second sentence.", "Third sentence."];
    const embeddings = await embeddingProvider.embedBatch(sampleTexts);
    console.log(`Batch embedding success! Count: ${embeddings.length}`);
    console.log(`Dimension of index 0: ${embeddings[0].length}`);
  } catch (err: any) {
    console.log(`Failed batch embedding: ${err.message}`);
  }
}

testEmbedding();
