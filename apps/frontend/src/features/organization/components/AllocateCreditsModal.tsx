import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore';
import { Coins, X, Loader2 } from 'lucide-react';

interface AllocateCreditsModalProps {
  orgId: string;
  teacherId: string;
  teacherName: string;
  maxAmount: number;
  onClose: () => void;
}

export const AllocateCreditsModal: React.FC<AllocateCreditsModalProps> = ({ orgId, teacherId, teacherName, maxAmount, onClose }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { allocateCredits } = useOrgStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    if (amount > maxAmount) {
      setError(`Amount cannot exceed the organization's available balance (${maxAmount}).`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await allocateCredits(orgId, teacherId, amount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate credits');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Coins className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Allocate Credits</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Transfer AI credits from the college wallet to <strong>{teacherName}</strong>.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount to Transfer
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-900 font-bold text-lg"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                  Max: {maxAmount}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !amount || amount <= 0 || amount > maxAmount}
              className="w-full mt-4 flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Allocation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
