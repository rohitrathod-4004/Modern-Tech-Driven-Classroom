import React, { useEffect, useState } from 'react';
import { api } from '../../../infrastructure/api';
import { Loader2, Radio, Video } from 'lucide-react';
import { cn } from '../../../design-system/utils';

export const LiveOperationsPanel: React.FC = () => {
  const [data, setData] = useState<{ liveLectures: any[] }>({ liveLectures: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    const fetchOps = async () => {
      try {
        const res = await api.get('/api/analytics/organization/live-operations');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch live operations");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchOps();

    // Poll every 10 seconds if the tab is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOps();
        intervalId = setInterval(fetchOps, 10000);
      } else {
        clearInterval(intervalId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    intervalId = setInterval(fetchOps, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500" />
          Live Operations
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-500">System Nominal</span>
        </div>
      </div>
      
      <div className="divide-y divide-slate-100">
        {data.liveLectures.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No active classrooms or processing jobs.</p>
          </div>
        ) : (
          data.liveLectures.map((lecture) => (
            <div key={lecture._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  lecture.status === 'recording' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                )}>
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{lecture.title || 'Untitled Lecture'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lecture.teacherId?.name || 'Unknown Teacher'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lecture.status === 'recording' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                    Recording Live
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    Processing AI
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
