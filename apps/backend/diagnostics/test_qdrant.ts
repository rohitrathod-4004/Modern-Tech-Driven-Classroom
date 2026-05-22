import dotenv from "dotenv";
import { qdrantClient, COLLECTION_NAME } from "../src/services/qdrantService";

dotenv.config();

async function testQdrant() {
  console.log("=== QDRANT DIAGNOSTIC ===");
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
  console.log(`Qdrant URL: ${qdrantUrl}`);

  try {
    console.log("\nFetching collection list...");
    const response = await qdrantClient.getCollections();
    console.log("Collections present:", response.collections.map(c => c.name));

    const exists = response.collections.some(c => c.name === COLLECTION_NAME);
    if (exists) {
      console.log(`\nFetching details for collection: ${COLLECTION_NAME}...`);
      const info = await qdrantClient.getCollection(COLLECTION_NAME) as any;
      console.log(`Status: ${info.status}`);
      console.log(`Vectors Size (Dimensions): ${info.config?.params?.vectors?.size}`);
      console.log(`Distance Metric: ${info.config?.params?.vectors?.distance}`);
      console.log(`Points Count: ${info.points_count}`);
      console.log(`Indexed Vectors Count: ${info.indexed_vectors_count}`);
      console.log("Payload fields indexed:", Object.keys(info.payload_schema || {}));
    } else {
      console.log(`\nCollection ${COLLECTION_NAME} does not exist!`);
    }
  } catch (err: any) {
    console.error("Qdrant interaction failed:", err.message);
  }
}

testQdrant();
