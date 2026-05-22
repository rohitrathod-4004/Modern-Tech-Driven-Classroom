import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { api } from '../../infrastructure/api';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, Clock, Activity, ArrowRight, Users, GraduationCap } from 'lucide-react';
import { useDashboardStore } from '../../infrastructure/stores/dashboardStore';
import { cn } from '../../design-system/utils';

export const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { stats, fetchStats, isLoading: statsLoading, error: statsError } = useDashboardStore();
  const [isStarting, setIsStarting] = useState(false);
  const [recentLectures, setRecentLectures] = useState<any[]>([]);

  const defaultCourseId = user?.enrolledCourses?.[0] || '';

  useEffect(() => {
    const fetchRecentLectures = async () => {
      try {
        const { data } = await api.get('/api/dashboard/recent-lectures?limit=3');
        
        const formattedLectures = data.data.map((lec: any) => {
          return {
            id: lec.id,
            title: lec.title,
            courseId: lec.courseId,
            duration: lec.durationSeconds ? `${Math.floor(lec.durationSeconds / 60)}m ${lec.durationSeconds % 60}s` : 'Unknown',
            status: ['ready', 'completed'].includes(lec.status) ? 'ready' : (['ai_processing', 'transcribing'].includes(lec.status) ? 'processing' : 'recording'),
            date: new Date(lec.startedAt).toLocaleDateString()
          };
        });
        
        setRecentLectures(formattedLectures);
      } catch (err) {
        console.error('Failed to fetch recent lectures:', err);
      }
    };
    fetchStats();
    fetchRecentLectures();
  }, [fetchStats]);

  const handleStartLecture = (courseId: string) => {
    navigate('/record', {
      state: {
        courseId: courseId
      }
    });
  };


  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex items-center justify-between space-y-2 relative z-10">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {user?.role === 'teacher' && (
            <button
              onClick={() => handleStartLecture(defaultCourseId)}
              disabled={isStarting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Play className="mr-2 h-4 w-4" />
              {isStarting ? 'Starting...' : 'Start New Lecture'}
            </button>
          )}
        </div>
      </div>

      {statsError ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">Failed to load analytics: {statsError}</div>
      ) : statsLoading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-surface/50 border border-border"></div>)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          <div className="rounded-lg border border-border/40 bg-card/80 backdrop-blur text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-5 flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{user?.role === 'teacher' ? 'Total Students' : 'Active Courses'}</h3>
              {user?.role === 'teacher' ? <Users className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" /> : <BookOpen className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />}
            </div>
            <div className="p-5 pt-0 relative z-10">
              <div className="text-2xl font-semibold tracking-tight">{user?.role === 'teacher' ? stats.totalStudents : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground/70 mt-1">{user?.role === 'teacher' ? `Across ${stats.totalCourses} courses` : 'Enrolled this semester'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/80 backdrop-blur text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-5 flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{user?.role === 'teacher' ? 'Total Lectures' : 'Hours Recorded'}</h3>
              <Clock className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <div className="p-5 pt-0 relative z-10">
              <div className="text-2xl font-semibold tracking-tight">{user?.role === 'teacher' ? stats.totalLectures : `${stats.totalHoursRecorded}h`}</div>
              <p className="text-xs text-muted-foreground/70 mt-1">{user?.role === 'teacher' ? 'Across all courses' : 'Total duration across courses'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/80 backdrop-blur text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-emerald-500/30 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-5 flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Study Materials</h3>
              <GraduationCap className="h-4 w-4 text-muted-foreground/50 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="p-5 pt-0 relative z-10">
              <div className="text-2xl font-semibold tracking-tight">{stats.totalStudyMaterials}</div>
              <p className="text-xs text-muted-foreground/70 mt-1">Topics and Flashcards ready</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/80 backdrop-blur text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-purple-500/30 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-5 flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">AI Processing</h3>
              <Activity className="h-4 w-4 text-muted-foreground/50 group-hover:text-purple-500 transition-colors" />
            </div>
            <div className="p-5 pt-0 relative z-10">
              <div className="text-2xl font-semibold tracking-tight">{stats.aiProcessingReady}</div>
              <p className="text-xs text-muted-foreground/70 mt-1">Lectures fully processed by AI</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <div className="col-span-4 flex flex-col">
          <div className="flex flex-col space-y-1.5 pb-4 border-b border-border/40">
            <h3 className="font-semibold tracking-tight text-lg">Recent Lectures</h3>
            <p className="text-sm text-muted-foreground">Your most recently processed recordings.</p>
          </div>
          <div className="pt-4 flex-1 relative z-10">
            <div className="space-y-1.5">
              {recentLectures.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center bg-card/30 border border-border/20 rounded-xl">
                  No recent lectures found. Start a new lecture to see it here!
                </div>
              )}
              {recentLectures.map(lecture => (
                <div 
                  key={lecture.id} 
                  className="flex items-center p-3 rounded-lg hover:bg-card/80 hover:shadow-md hover:border-primary/20 border border-transparent transition-all cursor-pointer group"
                  onClick={() => navigate(`/courses/${lecture.courseId}/lectures/${lecture.id}`)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{lecture.title}</p>
                    <p className="text-[13px] text-muted-foreground flex items-center gap-2">
                        {lecture.courseId && (
                          <>
                            <span className="hover:text-foreground transition-colors cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${lecture.courseId}`);
                            }}>
                              View Course
                            </span>
                            <span className="text-border">•</span>
                          </>
                        )}
                        <span>{lecture.date}</span>
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <span className="text-sm text-muted-foreground font-mono tabular-nums">{lecture.duration}</span>
                    <div className="w-[84px] flex justify-end">
                      <div className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase transition-colors",
                        lecture.status === 'ready' ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : 
                        lecture.status === 'processing' ? "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20" : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
                      )}>
                        {lecture.status === 'ready' ? 'Ready' : lecture.status === 'processing' ? 'Processing' : 'Recording'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3 flex flex-col relative z-10">
          <div className="flex flex-col space-y-1.5 pb-4 border-b border-border/40">
            <h3 className="font-semibold tracking-tight text-lg">Quick Actions</h3>
          </div>
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => navigate('/courses')}
              className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card/50 backdrop-blur p-4 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 transition-all text-left group"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">View All Courses</p>
                <p className="text-[13px] text-muted-foreground">Manage your enrolled courses</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button 
              onClick={() => navigate('/workspace')}
              className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card/50 backdrop-blur p-4 hover:-translate-y-0.5 hover:shadow-lg hover:border-purple-500/30 transition-all text-left group"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Workspace</p>
                <p className="text-[13px] text-muted-foreground">Monitor background AI processing</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
