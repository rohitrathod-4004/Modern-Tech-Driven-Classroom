import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "faculty" | "student";
  organization_id?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["faculty", "student"], required: true },
  organization_id: { type: Schema.Types.ObjectId, ref: "Organization" },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", UserSchema);
