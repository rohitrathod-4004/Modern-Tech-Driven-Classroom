import mongoose, { Schema, Document } from "mongoose";

export interface ILectureSession extends Document {
  classroom_id: mongoose.Types.ObjectId;
  faculty_id: mongoose.Types.ObjectId;
  title: string;
  session_id: string; // The unique ID used for transcription mapping
  status: "active" | "completed";
  processing_state: {
    transcription: "pending" | "completed";
    summary: "pending" | "completed";
    export: "pending" | "generated";
    semantic_index?: "pending" | "completed" | "failed";
  };
  startedAt: Date;
  endedAt?: Date;
  audio_path?: string;
  audio_url?: string;
}

const LectureSessionSchema = new Schema<ILectureSession>({
  classroom_id: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
  faculty_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  session_id: { type: String, required: true, unique: true },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  processing_state: {
    transcription: { type: String, enum: ["pending", "completed"], default: "pending" },
    summary: { type: String, enum: ["pending", "completed"], default: "pending" },
    export: { type: String, enum: ["pending", "generated"], default: "pending" },
    semantic_index: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  audio_path: { type: String },
  audio_url: { type: String },
});

LectureSessionSchema.index({ title: "text" });

export const LectureSession = mongoose.model<ILectureSession>("LectureSession", LectureSessionSchema);

