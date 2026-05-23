import React from 'react';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { Building } from 'lucide-react';
import { CreateOrganization } from './CreateOrganization';
import { OrgTeacherManagement } from './OrgTeacherManagement';

export const OrganizationPage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  if (user.accountType === 'organization_member' && user.organizationId) {
    if (user.role === 'org_admin') {
      return <OrgTeacherManagement />;
    }
    return (
      <div className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">College Workspace</h2>
          <p className="text-slate-500 mt-2">You are a member of a College Workspace. Contact your administrator for assistance.</p>
        </div>
      </div>
    );
  }

  return <CreateOrganization />;
};
