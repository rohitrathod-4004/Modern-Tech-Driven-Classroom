import React, { Suspense, lazy } from 'react';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { Loader2 } from 'lucide-react';

const StudentDashboard = lazy(() => import('./StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const TeacherDashboard = lazy(() => import('./TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const OrgDashboard = lazy(() => import('../organization/components/OrgDashboard').then(m => ({ default: m.OrgDashboard })));

const DashboardSkeleton = () => (
  <div className="flex-1 p-8 w-full flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
  </div>
);

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {user.role === 'org_admin' ? (
        <OrgDashboard />
      ) : user.role === 'teacher' || user.role === 'admin' ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Suspense>
  );
};
