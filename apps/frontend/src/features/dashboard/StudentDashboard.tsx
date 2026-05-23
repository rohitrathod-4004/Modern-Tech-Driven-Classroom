import React from 'react';
import { BookOpen, Trophy, Clock, BrainCircuit } from 'lucide-react';
import { useAuthStore } from '../../infrastructure/stores/authStore';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pick up right where you left off.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Placeholder stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Enrolled Courses</p>
              <h3 className="text-2xl font-bold text-slate-900">{user?.enrolledCourses?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Study Streak</p>
              <h3 className="text-2xl font-bold text-slate-900">3 Days</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Flashcards Mastered</p>
              <h3 className="text-2xl font-bold text-slate-900">42</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Study Time</p>
              <h3 className="text-2xl font-bold text-slate-900">8.5h</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-base font-semibold text-slate-900">Continue Learning</h3>
             </div>
             <div className="p-8 text-center text-slate-500 text-sm">
                No active courses to display right now. Check back later!
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100">
               <h3 className="text-base font-semibold text-slate-900">Upcoming Live Classes</h3>
             </div>
             <div className="p-8 text-center text-slate-500 text-sm">
                No scheduled live classes.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
