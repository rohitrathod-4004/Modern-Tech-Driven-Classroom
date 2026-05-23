import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrgStore } from '../store/orgStore';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const { acceptInvite } = useOrgStore();
  const fetchProfile = useAuthStore(state => state.fetchProfile);

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid or missing invitation token.');
      return;
    }

    const processInvite = async () => {
      try {
        await acceptInvite(token);
        await fetchProfile(); // Refresh profile so UI reacts to new accountType immediately
        setStatus('success');
        
        // Redirect to org dashboard after 2 seconds
        setTimeout(() => {
          navigate('/organization');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setErrorMsg(error.message || 'Failed to accept invitation.');
      }
    };

    processInvite();
  }, [token, acceptInvite, fetchProfile, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Joining Workspace...</h2>
            <p className="text-slate-500 mt-2">Please wait while we verify your invitation.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Success!</h2>
            <p className="text-slate-500 mt-2">You have successfully joined the organization.</p>
            <p className="text-sm text-slate-400 mt-4 animate-pulse">Redirecting to your workspace...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Invitation Failed</h2>
            <p className="text-slate-500 mt-2">{errorMsg}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
