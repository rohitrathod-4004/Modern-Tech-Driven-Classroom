import mongoose, { Schema, Document } from "mongoose";

export interface ITranscriptChunk extends Document {
  session_id: string;
  chunk_index: number;
  text: string;
  start_time: number;
  end_time: number;
  created_at: Date;
}

const TranscriptChunkSchema = new Schema<ITranscriptChunk>({
  session_id:  { type: String,  required: true, index: true },
  chunk_index: { type: Number,  required: true },
  text:        { type: String,  default: "" },
  start_time:  { type: Number,  required: true },
  end_time:    { type: Number,  required: true },
  created_at:  { type: Date,    default: Date.now },
});

// Compound unique index: fast lookups, ordering, and idempotency enforcement
TranscriptChunkSchema.index({ session_id: 1, chunk_index: 1 }, { unique: true });

export const TranscriptChunk = mongoose.model<ITranscriptChunk>(
  "TranscriptChunk",
  TranscriptChunkSchema
);
