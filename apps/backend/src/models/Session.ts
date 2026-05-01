import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  session_id: string;
  created_at: Date;
}

const SessionSchema = new Schema<ISession>({
  session_id: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, default: Date.now },
});

export const Session = mongoose.model<ISession>("Session", SessionSchema);
