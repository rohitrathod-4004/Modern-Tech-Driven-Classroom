import React, { useEffect, useState } from 'react';
import { Presentation, Users, Clock, Zap, Loader2 } from 'lucide-react';
import { api } from '../../infrastructure/api';

export const TeacherDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/analytics/teacher');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch teacher analytics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Teacher Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your courses, lectures, and AI generation status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Presentation className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Courses</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.activeCourses || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.totalStudents || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Lectures</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.totalLectures || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">AI Jobs Pending</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.pendingJobs || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Lectures</h3>
          </div>
          <div className="p-4 text-sm text-slate-600 divide-y divide-slate-100">
            {data.recentLectures && data.recentLectures.length > 0 ? (
              data.recentLectures.map((lecture: any) => (
                <div key={lecture._id} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{lecture.title || 'Untitled'}</span>
                  <span className="text-xs px-2 py-1 bg-slate-100 rounded-md capitalize">{lecture.status.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">
                No recent lectures found. Start recording a new session!
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">AI Processing Queue</h3>
          </div>
          <div className="p-8 text-center text-slate-500 text-sm">
            All AI generation jobs are complete.
          </div>
        </div>
      </div>
    </div>
  );
};
