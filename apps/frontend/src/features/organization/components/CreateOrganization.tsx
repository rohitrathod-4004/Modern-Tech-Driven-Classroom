import React, { useState } from 'react';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useOrgStore } from '../store/orgStore';
import { Building, ArrowRight, Loader2 } from 'lucide-react';

export const CreateOrganization: React.FC = () => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const { createOrganization } = useOrgStore();
  const fetchProfile = useAuthStore(state => state.fetchProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsCreating(true);
    setError('');
    
    try {
      await createOrganization(name);
      await fetchProfile(); // This updates the global user state (accountType and organizationId)
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-10 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upgrade to a College Workspace</h1>
          <p className="text-slate-500 mt-3 text-lg max-w-lg mx-auto">
            Transform your account into an institutional workspace. Invite other teachers, pool AI credits, and manage department billing from one place.
          </p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="orgName" className="block text-sm font-semibold text-slate-700 mb-2">
                Institution Name
              </label>
              <input
                id="orgName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stanford University Dept of CS"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-900"
                required
              />
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-indigo-900">✨ Bonus: 100 Demo Credits</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Creating an institution workspace today instantly adds 100 free AI credits to your new organizational wallet.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full flex items-center justify-center px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
