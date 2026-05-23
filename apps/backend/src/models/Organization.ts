import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  walletId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // org_admin who created it
  admins: mongoose.Types.ObjectId[];
  teachers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganizationDocument>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  logoUrl: { type: String },
  walletId: { type: Schema.Types.ObjectId, ref: 'CreditWallet', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  teachers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export const Organization = mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
