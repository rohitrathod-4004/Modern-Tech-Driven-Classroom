import React, { useEffect } from 'react';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useBillingStore } from '../store/billingStore';
import { BILLING_PACKAGES } from '@classroom/shared';
import { CreditCard, CheckCircle, AlertCircle, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { history, walletBalance, currentPage, totalPages, isLoadingHistory, rechargeStatus, error, fetchHistory, initiateRecharge, setRechargeStatus } = useBillingStore();

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  if (!user) return null;

  const isOrg = user.accountType === 'organization_member';
  const displayPackages = Object.values(BILLING_PACKAGES).filter(p => p.purchaserType === (isOrg ? 'organization' : 'individual'));

  const handleRecharge = (pkgId: string) => {
    initiateRecharge(pkgId);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 font-sans">
      
      {/* Header & Wallet */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Billing & Usage</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isOrg ? "Manage your organization's AI credits and view consumption." : "Manage your personal AI credits and view your consumption."}
          </p>
        </div>
        <div className="mt-6 md:mt-0 bg-white border border-slate-200 px-6 py-4 rounded-xl shadow-sm text-right">
          <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Wallet Balance</p>
          <p className="text-3xl font-bold text-indigo-500 mt-1">{walletBalance} <span className="text-lg text-slate-400 font-medium">Credits</span></p>
        </div>
      </div>

      {/* Status Alerts */}
      {rechargeStatus === 'recharge_success' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center shadow-sm">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-600" />
          <div className="flex-1 text-sm font-medium">Payment verified successfully! Your wallet has been recharged.</div>
          <button onClick={() => setRechargeStatus('idle')} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Dismiss</button>
        </div>
      )}
      {rechargeStatus === 'recharge_failed' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
          <div className="flex-1 text-sm font-medium">{error || "Payment verification failed. Please contact support if you were charged."}</div>
          <button onClick={() => setRechargeStatus('idle')} className="text-red-600 hover:text-red-800 text-sm font-medium">Dismiss</button>
        </div>
      )}
      {rechargeStatus === 'canceled' && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl flex items-center shadow-sm">
          <Clock className="w-5 h-5 mr-3 text-slate-400" />
          <div className="flex-1 text-sm font-medium">Checkout was canceled.</div>
          <button onClick={() => setRechargeStatus('idle')} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Dismiss</button>
        </div>
      )}
      {['opening_checkout', 'payment_pending', 'verifying'].includes(rechargeStatus) && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl flex items-center shadow-sm">
          <div className="w-5 h-5 mr-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="flex-1 text-sm font-medium">
            {rechargeStatus === 'opening_checkout' && 'Initializing secure checkout...'}
            {rechargeStatus === 'payment_pending' && 'Waiting for payment completion...'}
            {rechargeStatus === 'verifying' && 'Verifying payment securely with server...'}
          </div>
        </div>
      )}

      {/* Credit Packages */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-slate-400" /> Purchase Credits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayPackages.map(pkg => (
            <div 
              key={pkg.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-indigo-400">{pkg.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{pkg.credits} AI Credits</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900">₹{pkg.amountInr}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 flex-1">
                Equivalent to {Math.floor(pkg.credits / 60)} hours of AI processing.
              </p>
              <button
                onClick={() => handleRecharge(pkg.id)}
                disabled={rechargeStatus !== 'idle' && rechargeStatus !== 'recharge_success' && rechargeStatus !== 'recharge_failed' && rechargeStatus !== 'canceled'}
                className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex justify-center items-center"
              >
                Buy {pkg.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-slate-400" /> Transaction History
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-medium">
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingHistory ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">No transactions found.</td>
                </tr>
              ) : (
                history.map(tx => (
                  <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-sm text-slate-900">{tx.description}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono bg-slate-50 rounded px-2 py-1 max-w-fit">{tx.source}</td>
                    <td className="p-4 text-sm font-bold text-right text-slate-900">
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchHistory(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fetchHistory(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
};
