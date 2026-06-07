import { create } from 'zustand';
import { api } from '../../../infrastructure/api';
import { openRazorpayCheckout } from '../utils/razorpay';

export type RechargeState = 'idle' | 'opening_checkout' | 'payment_pending' | 'verifying' | 'recharge_success' | 'recharge_failed' | 'canceled';

interface BillingHistoryItem {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}

interface BillingState {
  rechargeStatus: RechargeState;
  history: BillingHistoryItem[];
  walletBalance: number;
  totalPages: number;
  currentPage: number;
  isLoadingHistory: boolean;
  error: string | null;

  setRechargeStatus: (status: RechargeState) => void;
  fetchHistory: (page?: number) => Promise<void>;
  initiateRecharge: (packageId: string) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  rechargeStatus: 'idle',
  history: [],
  walletBalance: 0,
  totalPages: 1,
  currentPage: 1,
  isLoadingHistory: false,
  error: null,

  setRechargeStatus: (status) => set({ rechargeStatus: status }),

  fetchHistory: async (page = 1) => {
    set({ isLoadingHistory: true, error: null });
    try {
      const response = await api.get(`/api/billing/history?page=${page}`);
      const { transactions, pagination, walletBalance } = response.data.data;
      set({ 
        history: transactions, 
        walletBalance,
        currentPage: pagination.page, 
        totalPages: pagination.pages,
        isLoadingHistory: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch billing history', isLoadingHistory: false });
    }
  },

  initiateRecharge: async (packageId: string) => {
    try {
      set({ rechargeStatus: 'opening_checkout', error: null });

      // 1. Create Order
      const { data } = await api.post('/api/billing/create-order', { packageId });
      const orderData = data.data;

      set({ rechargeStatus: 'payment_pending' });

      // 2. Open Razorpay
      await openRazorpayCheckout({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AI Classroom',
        description: 'AI Credits Recharge',
        order_id: orderData.orderId,
        theme: {
          color: '#4F46E5' // Indigo-600
        },
        modal: {
          ondismiss: () => {
            // If the user manually closes the popup
            if (get().rechargeStatus === 'payment_pending') {
              set({ rechargeStatus: 'canceled' });
            }
          }
        },
        handler: async (response) => {
          set({ rechargeStatus: 'verifying' });
          try {
            // 3. Verify Payment
            await api.post('/api/billing/verify-payment', {
              internalPaymentId: orderData.internalPaymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            set({ rechargeStatus: 'recharge_success' });
            // Refresh history to reflect new balance
            get().fetchHistory(1);
          } catch (verifyError: any) {
            set({ 
              rechargeStatus: 'recharge_failed', 
              error: verifyError.response?.data?.message || 'Payment verification failed' 
            });
          }
        }
      });
    } catch (error: any) {
      set({ 
        rechargeStatus: 'recharge_failed', 
        error: error.response?.data?.message || error.message || 'Failed to initiate checkout' 
      });
    }
  }
}));
