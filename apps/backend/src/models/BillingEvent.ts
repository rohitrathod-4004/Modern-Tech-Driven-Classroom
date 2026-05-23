import mongoose, { Schema, Document } from 'mongoose';
import { BillingEventType } from '@classroom/shared';

export interface IBillingEventDocument extends Document {
  paymentId: mongoose.Types.ObjectId;
  eventType: BillingEventType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const BillingEventSchema = new Schema<IBillingEventDocument>({
  paymentId: { type: Schema.Types.ObjectId, ref: 'BillingPayment', required: true, index: true },
  eventType: { 
    type: String, 
    enum: ['checkout_initialized', 'payment_verified', 'recharge_completed', 'recharge_failed', 'refund_created'],
    required: true 
  },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

export const BillingEvent = mongoose.model<IBillingEventDocument>('BillingEvent', BillingEventSchema);
