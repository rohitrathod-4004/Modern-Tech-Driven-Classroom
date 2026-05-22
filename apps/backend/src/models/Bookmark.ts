import mongoose, { Schema, Document } from "mongoose";

export interface IBookmark extends Document {
  user_id: mongoose.Types.ObjectId;
  session_id: string;
  chunk_index: number;
  text: string;
  start_time: number;
  note?: string;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  session_id: { type: String, required: true },
  chunk_index: { type: Number, required: true },
  text: { type: String, required: true },
  start_time: { type: Number, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// A user can bookmark a specific chunk index of a session only once
BookmarkSchema.index({ user_id: 1, session_id: 1, chunk_index: 1 }, { unique: true });
BookmarkSchema.index({ user_id: 1 });

export const Bookmark = mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
