import mongoose, { Schema, Document } from "mongoose";

export interface ISavedSummary extends Document {
  session_id: string; // References the unique session_id of LectureSession
  summaryData: any; // The JSON response from Gemini
  generatedAt: Date;
}

const SavedSummarySchema = new Schema<ISavedSummary>({
  session_id: { type: String, required: true, unique: true },
  summaryData: { type: Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
});

SavedSummarySchema.index({ 
  "summaryData.summary": "text", 
  "summaryData.topics": "text", 
  "summaryData.study_notes": "text" 
});

export const SavedSummary = mongoose.model<ISavedSummary>("SavedSummary", SavedSummarySchema);

