import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { Loader2, ArrowLeft, Settings, Users, Trash2, Video, Clock, CheckCircle2, Play, CircleDot } from 'lucide-react';
import { api } from '../../infrastructure/api';
import { cn } from '../../design-system/utils';

export function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courses, activeCourse, setActiveCourse, fetchCourseById, deleteCourse, isLoading } = useCourseStore();
  const { user } = useAuthStore();
  
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [isLoadingLectures, setIsLoadingLectures] = useState(true);

  useEffect(() => {
    if (courseId) {
      if (courses.length > 0) {
        setActiveCourse(courseId);
      } else {
        fetchCourseById(courseId);
      }
    }
  }, [courseId, setActiveCourse, fetchCourseById, courses.length]);

  // Poll for live status
  useEffect(() => {
    if (!courseId) return;
    let timeoutId: NodeJS.Timeout;
    
    const pollLiveStatus = async () => {
      if (document.visibilityState === 'hidden') {
        timeoutId = setTimeout(pollLiveStatus, 3000);
        return;
      }
      try {
        const { data } = await api.get(`/api/courses/${courseId}/live-status`);
        setLiveStatus(data.data);
      } catch (err) {
        console.error("Live status poll failed", err);
      }
      timeoutId = setTimeout(pollLiveStatus, 3000);
    };
    
    pollLiveStatus();
    return () => clearTimeout(timeoutId);
  }, [courseId]);

  // Fetch past lectures
  useEffect(() => {
    if (!courseId) return;
    const fetchLectures = async () => {
      try {
        setIsLoadingLectures(true);
        const { data } = await api.get(`/api/courses/${courseId}/lectures`);
        setLectures(data.data);
      } catch (err) {
        console.error("Failed to fetch lectures", err);
      } finally {
        setIsLoadingLectures(false);
      }
    };
    fetchLectures();
  }, [courseId]);

  if (isLoading && !activeCourse) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!activeCourse) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  const isTeacher = user?.id === activeCourse.teacherId;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await deleteCourse(activeCourse.id);
      navigate('/courses');
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      {/* Live Banner */}
      {liveStatus && (
        <div className="sticky top-0 z-40 w-full bg-blue-500/10 border-b border-blue-500/20 backdrop-blur-md px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <div>
              <span className="text-sm font-semibold text-blue-500 uppercase tracking-wider block">Class is Live</span>
              <span className="text-sm text-foreground font-medium">{liveStatus.title}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/courses/${courseId}/live`)}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            Join Live Class
          </button>
        </div>
      )}

      <div className="flex-1 p-8 pt-6 space-y-8 animate-in fade-in max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/courses')} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {activeCourse.title}
              <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold bg-primary/10 text-primary rounded-full border border-primary/20">
                Workspace
              </span>
            </h2>
            <p className="text-muted-foreground mt-1">{activeCourse.description || 'No description provided.'}</p>
          </div>
          <div className="flex gap-4">
            {isTeacher && (
              <button
                onClick={() => navigate('/record', { state: { courseId: activeCourse.id } })}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
              >
                <Video className="w-4 h-4" />
                Start New Lecture
              </button>
            )}
            <div className="bg-surface border border-border px-4 py-2 rounded-lg flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Code</span>
              <span className="font-mono text-sm font-semibold text-foreground tracking-widest">{activeCourse.enrollmentCode}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 mt-8">
          {/* Main Operational Area - Lecture Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-muted-foreground" />
              Lecture History
            </h3>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl overflow-hidden shadow-sm divide-y divide-border/40">
              {isLoadingLectures ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : lectures.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No lectures have been recorded for this course yet.
                </div>
              ) : (
                lectures.map(lecture => (
                  <div 
                    key={lecture._id}
                    onClick={() => navigate(`/courses/${courseId}/lectures/${lecture._id}`)}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        {lecture.status === 'ready' || lecture.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : lecture.status === 'ai_processing' ? (
                          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                        ) : lecture.isLive ? (
                          <CircleDot className="w-4 h-4 text-blue-500 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {lecture.title}
                          </h4>
                          {lecture.isLive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(lecture.startedAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{formatDuration(lecture.durationSeconds)}</span>
                          {lecture.chunkCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{lecture.chunkCount} chunks</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 pl-4 hidden md:flex items-center">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium border",
                        lecture.status === 'ready' || lecture.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        lecture.status === 'ai_processing' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        lecture.isLive ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        "bg-secondary text-muted-foreground border-border"
                      )}>
                        {lecture.isLive ? 'LIVE RECORDING' : lecture.status === 'ai_processing' ? 'PROCESSING AI' : 'READY'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar - Settings & Members */}
          <div className="space-y-6">
            <div className="bg-surface border border-border/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Members ({activeCourse.students.length})</h3>
              </div>
              
              {activeCourse.students.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No students enrolled yet.</p>
              ) : (
                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeCourse.students.map((studentId, idx) => (
                    <li key={studentId} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-background border border-border/40">
                      <span className="font-mono text-muted-foreground truncate w-24">ID: {studentId}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">Student {idx + 1}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface border border-border/60 rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Settings</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-muted-foreground">Status</span>
                   <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] uppercase font-bold rounded border border-green-500/20">
                     {activeCourse.isActive ? 'Active' : 'Inactive'}
                   </div>
                 </div>
                 {isTeacher && (
                   <div className="pt-2">
                     <button
                       onClick={handleDelete}
                       className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md text-xs font-semibold transition-colors"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                       Delete Course
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
