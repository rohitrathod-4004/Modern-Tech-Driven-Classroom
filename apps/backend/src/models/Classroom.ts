import mongoose, { Schema, Document } from "mongoose";

export interface IClassroom extends Document {
  name: string;
  code: string;
  faculty_id: mongoose.Types.ObjectId;
  organization_id?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  faculty_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organization_id: { type: Schema.Types.ObjectId, ref: "Organization" },
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export const Classroom = mongoose.model<IClassroom>("Classroom", ClassroomSchema);
