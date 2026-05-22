import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  domain?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  domain: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Organization = mongoose.model<IOrganization>("Organization", OrganizationSchema);
