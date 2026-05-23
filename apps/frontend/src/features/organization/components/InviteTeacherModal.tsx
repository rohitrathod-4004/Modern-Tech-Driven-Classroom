import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore';
import { Mail, Check, Copy, X, Loader2 } from 'lucide-react';

interface InviteTeacherModalProps {
  orgId: string;
  onClose: () => void;
}

export const InviteTeacherModal: React.FC<InviteTeacherModalProps> = ({ orgId, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'org_admin'>('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const { createInvite } = useOrgStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const { token: inviteToken } = await createInvite(orgId, email, role);
      const link = `${window.location.origin}/invite?token=${inviteToken}`;
      setInviteLink(link);
    } catch (err: any) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-2xl font-bold text-slate-900">Invite Team Member</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Send an invitation to a teacher or administrator to join your college workspace.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {!inviteLink ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-900 bg-white"
                >
                  <option value="teacher">Teacher (Can consume credits)</option>
                  <option value="org_admin">Organization Admin (Can manage billing)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full mt-2 flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Invite Link'}
              </button>
            </form>
          ) : (
            <div className="mt-6">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4">
                <p className="text-sm font-medium text-emerald-800 text-center">
                  Invite link generated successfully!
                </p>
                <p className="text-xs text-emerald-600 text-center mt-1">
                  Share this secure link with {email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
