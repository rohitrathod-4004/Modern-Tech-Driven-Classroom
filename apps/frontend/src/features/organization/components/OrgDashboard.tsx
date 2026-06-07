import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { api } from '../../../infrastructure/api';
import { Loader2, TrendingUp, Building2, Users, FileVideo } from 'lucide-react';
import { LiveOperationsPanel } from './LiveOperationsPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OrgDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics/organization');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch organization analytics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
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
            Organization Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational overview of {user?.name}'s workspace
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Remaining Pool</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.remainingCredits}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Credits Consumed</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.consumedCredits}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.activeTeachers}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FileVideo className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Lectures Processed</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.totalLectures}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-base font-semibold tracking-tight text-slate-900">7-Day Burn Rate</h3>
             </div>
             <div style={{ width: '100%', height: 300, minWidth: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.burnRateChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="credits" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCredits)" />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <LiveOperationsPanel />
        </div>
      </div>
    </div>
  );
};
