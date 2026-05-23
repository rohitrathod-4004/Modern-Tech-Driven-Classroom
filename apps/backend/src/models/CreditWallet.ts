import mongoose, { Schema, Document } from 'mongoose';
import { OwnerType } from '@classroom/shared';

export interface ICreditWalletDocument extends Document {
  ownerType: OwnerType;
  ownerId: mongoose.Types.ObjectId;
  totalCredits: number;
  consumedCredits: number;
  remainingCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreditWalletSchema = new Schema<ICreditWalletDocument>({
  ownerType: { type: String, enum: ['individual', 'organization'], required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
  totalCredits: { type: Number, default: 0, min: 0 },
  consumedCredits: { type: Number, default: 0, min: 0 },
  remainingCredits: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Ensure ownerId is unique across ownerTypes
CreditWalletSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });

export const CreditWallet = mongoose.model<ICreditWalletDocument>('CreditWallet', CreditWalletSchema);
