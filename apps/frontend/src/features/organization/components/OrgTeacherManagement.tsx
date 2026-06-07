import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useOrgStore } from '../store/orgStore';
import { Crown, GraduationCap, Coins, Plus, Loader2 } from 'lucide-react';
import { InviteTeacherModal } from './InviteTeacherModal';
import { AllocateCreditsModal } from './AllocateCreditsModal';

export const OrgTeacherManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { organization, wallet, isLoading, fetchDashboard } = useOrgStore();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [allocationTeacher, setAllocationTeacher] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (user?.organizationId) {
      fetchDashboard(user.organizationId);
    }
  }, [user?.organizationId, fetchDashboard]);

  if (isLoading || !organization || !wallet) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 w-full max-w-5xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your workspace members and allocate credits.
          </p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-900">Workspace Members</h3>
          <span className="text-sm font-medium text-slate-500">Org Pool: {wallet.remainingCredits} Credits</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {[...((organization.admins as any) || []).map((a: any) => ({...a, isRole: 'admin'})), ...((organization.teachers as any) || []).map((t: any) => ({...t, isRole: 'teacher'}))].map((member: any) => (
            <li key={member._id || member.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center \${member.isRole === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {member.isRole === 'admin' ? <Crown className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                </div>
              </div>
              {member.isRole === 'teacher' && (
                <button 
                  onClick={() => setAllocationTeacher({ id: member._id || member.id, name: member.name })}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                >
                  <Coins className="w-3.5 h-3.5 mr-1.5" />
                  Allocate Credits
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isInviteOpen && (
        <InviteTeacherModal 
          orgId={organization.id || (organization as any)._id} 
          onClose={() => setIsInviteOpen(false)} 
        />
      )}

      {allocationTeacher && (
        <AllocateCreditsModal 
          orgId={organization.id || (organization as any)._id}
          teacherId={allocationTeacher.id}
          teacherName={allocationTeacher.name}
          maxAmount={wallet.remainingCredits}
          onClose={() => setAllocationTeacher(null)}
        />
      )}
    </div>
  );
};
