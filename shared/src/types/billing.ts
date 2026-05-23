export type PaymentStatus = 'created' | 'pending_verification' | 'verified' | 'failed' | 'refunded';
export type PurchaserType = 'individual' | 'organization';

export interface BillingPaymentDto {
  id: string;
  provider: string; // e.g. 'razorpay'
  providerOrderId: string;
  providerPaymentId?: string;
  purchaserId: string;
  purchaserType: PurchaserType;
  walletId: string;
  amountInr: number;
  creditsPurchased: number;
  packageId: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type BillingEventType = 
  | 'checkout_initialized' 
  | 'payment_verified' 
  | 'recharge_completed' 
  | 'recharge_failed' 
  | 'refund_created';

export interface BillingEventDto {
  id: string;
  paymentId: string;
  eventType: BillingEventType;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Static Demo Packages for Localhost
export const BILLING_PACKAGES = {
  // Independent Teachers
  STARTER_TEACHER: {
    id: 'pkg_starter_teacher',
    name: 'Starter Pack',
    credits: 25,
    amountInr: 99,
    purchaserType: 'individual' as PurchaserType
  },
  PRO_TEACHER: {
    id: 'pkg_pro_teacher',
    name: 'Pro Pack',
    credits: 100,
    amountInr: 299,
    purchaserType: 'individual' as PurchaserType
  },
  
  // Organizations
  INSTITUTION_STARTER: {
    id: 'pkg_institution_starter',
    name: 'Institution Starter',
    credits: 500,
    amountInr: 999,
    purchaserType: 'organization' as PurchaserType
  },
  INSTITUTION_GROWTH: {
    id: 'pkg_institution_growth',
    name: 'Institution Growth',
    credits: 2000,
    amountInr: 2499,
    purchaserType: 'organization' as PurchaserType
  }
};
