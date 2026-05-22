import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
export const qdrantClient = new QdrantClient({ url: QDRANT_URL });

export const COLLECTION_NAME = "transcript_chunks";

export async function ensureCollectionExists(dimensions: number) {
  try {
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some((c) => c.name === COLLECTION_NAME);
    if (!exists) {
      console.log(`[Qdrant] Creating collection: ${COLLECTION_NAME} (dimensions: ${dimensions})`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: dimensions,
          distance: "Cosine",
        },
      });

      // Index session_id for O(1) filtering inside a specific lecture session
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "session_id",
        field_schema: "keyword",
      });

      // Index classroom_id for classroom-scoped queries
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "classroom_id",
        field_schema: "keyword",
      });
    }
  } catch (err: any) {
    console.error("[Qdrant] Failed to verify/create collection:", err.message);
  }
}

export interface VectorPoint {
  id: string; // Must be standard UUID
  vector: number[];
  payload: {
    session_id: string;
    classroom_id: string;
    chunk_index: number;
    text: string;
    start_time: number;
    end_time: number;
  };
}

export async function upsertPoints(points: VectorPoint[]) {
  if (points.length === 0) return;
  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });
  console.log(`[Qdrant] Upserted ${points.length} points to Qdrant collection "${COLLECTION_NAME}".`);
}

export class QdrantUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QdrantUnavailableError";
  }
}

export async function searchVectors(
  vector: number[],
  filterObj: any,
  limit: number = 5
) {
  try {
    return await qdrantClient.search(COLLECTION_NAME, {
      vector,
      filter: filterObj,
      limit,
      with_payload: true,
    });
  } catch (err: any) {
    console.error("[Qdrant] Search failed due to connection error:", err.message);
    throw new QdrantUnavailableError(`Qdrant service is unavailable: ${err.message}`);
  }
}
