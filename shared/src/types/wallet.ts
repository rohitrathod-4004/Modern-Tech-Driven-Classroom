export type OwnerType = 'individual' | 'organization';
export type TransactionSource = 'allocation' | 'lecture_consumption' | 'recharge' | 'refund' | 'welcome_bonus';

export interface CreditWalletDto {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  totalCredits: number;
  consumedCredits: number;
  remainingCredits: number;
  updatedAt: string;
}

export interface CreditTransactionDto {
  id: string;
  walletId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: TransactionSource;
  description: string;
  referenceId?: string; // e.g. lectureId, inviteId, stripeInvoiceId
  createdAt: string;
}

export interface CreditUsageDto {
  id: string;
  lectureId: string;
  teacherId: string;
  organizationId?: string;
  creditsConsumed: number;
  durationConsumed: number; // in seconds
  source: 'lecture_finalized';
  createdAt: string;
}
