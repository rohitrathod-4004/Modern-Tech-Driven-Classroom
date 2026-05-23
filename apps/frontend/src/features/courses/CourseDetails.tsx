import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { Loader2, ArrowLeft, Settings, Users, Trash2, Video, Clock, CheckCircle2, Play, CircleDot, Radio, Calendar, Upload, Plus, FileText, AlertTriangle, X, BookOpen } from 'lucide-react';
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
  const [isStartingVideo, setIsStartingVideo] = useState(false);

  // Assignments Tab States
  const [activeTab, setActiveTab] = useState<'lectures' | 'assignments'>('lectures');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Form states (Teacher only)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMaxSize, setNewMaxSize] = useState('10');

  // Submissions states
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, any>>({}); // assignmentId -> submission
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([]);
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);
  const [isViewingSubmissions, setIsViewingSubmissions] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editMaxSize, setEditMaxSize] = useState('10');

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

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
    let timeoutId: any;
    
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

  // Fetch assignments & submissions
  const fetchAssignments = async () => {
    if (!courseId) return;
    try {
      setIsLoadingAssignments(true);
      const { data } = await api.get(`/api/courses/${courseId}/assignments`);
      setAssignments(data.data);

      // If student, fetch their submissions
      const isTeacher = user?.id === activeCourse?.teacherId;
      if (!isTeacher && data.data.length > 0) {
        const subs: Record<string, any> = {};
        await Promise.all(
          data.data.map(async (asg: any) => {
            try {
              const res = await api.get(`/api/assignments/${asg._id}/submissions/my`);
              if (res.data.data) {
                subs[asg._id] = res.data.data;
              }
            } catch (err) {
              console.error(`Failed to fetch submission for ${asg._id}`, err);
            }
          })
        );
        setStudentSubmissions(subs);
      }
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeTab, courseId, activeCourse]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      await api.post(`/api/courses/${courseId}/assignments`, {
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate,
        maxSizeMb: newMaxSize
      });
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewMaxSize('10');
      fetchAssignments();
    } catch (err) {
      console.error("Failed to create assignment", err);
      alert("Failed to create assignment");
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignmentId) return;
    if (!editTitle.trim() || !editDescription.trim() || !editDueDate) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      await api.put(`/api/assignments/${editingAssignmentId}`, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
        maxSizeMb: editMaxSize
      });
      setEditingAssignmentId(null);
      fetchAssignments();
    } catch (err) {
      console.error("Failed to update assignment", err);
      alert("Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment? All submissions will also be deleted.")) return;
    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      fetchAssignments();
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to delete assignment");
    }
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    try {
      setViewingAssignmentId(assignmentId);
      setIsViewingSubmissions(true);
      setTeacherSubmissions([]);
      const { data } = await api.get(`/api/assignments/${assignmentId}/submissions`);
      setTeacherSubmissions(data.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      alert("Failed to fetch submissions");
    }
  };

  const handleFileChange = (assignmentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const assignment = assignments.find(a => a._id === assignmentId);
    const limitMb = assignment?.maxSizeMb || 10;

    if (file.size > limitMb * 1024 * 1024) {
      setUploadErrors(prev => ({
        ...prev,
        [assignmentId]: `File size exceeds the limit of ${limitMb}MB. Selected file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      }));
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
    } else {
      setUploadErrors(prev => ({
        ...prev,
        [assignmentId]: ''
      }));
      setSelectedFiles(prev => ({
        ...prev,
        [assignmentId]: file
      }));
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    const file = selectedFiles[assignmentId];
    if (!file) {
      alert("Please select a file to submit.");
      return;
    }

    setIsUploading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/api/assignments/${assignmentId}/submissions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
      fetchAssignments();
    } catch (err: any) {
      console.error("Failed to submit assignment", err);
      alert(err.response?.data?.error || "Failed to submit assignment");
    } finally {
      setIsUploading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

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
            onClick={() => {
              if (liveStatus.isVideo) {
                navigate(`/video-lecture/${liveStatus._id}`, {
                  state: { courseId, isTeacher: false }
                });
              } else {
                navigate(`/courses/${courseId}/live`);
              }
            }}
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
              <>
                <button
                  onClick={() => navigate('/record', { state: { courseId: activeCourse.id } })}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
                >
                  <Video className="w-4 h-4" />
                  Start New Lecture
                </button>
                <button
                  disabled={isStartingVideo}
                  onClick={async () => {
                    try {
                      setIsStartingVideo(true);
                      const { data } = await api.post('/api/video/rooms', { courseId: activeCourse.id });
                      navigate(`/video-lecture/${data.data.lectureId}`, {
                        state: { courseId: activeCourse.id, isTeacher: true },
                      });
                    } catch (err: any) {
                      alert(err?.response?.data?.message ?? 'Failed to start video lecture');
                    } finally {
                      setIsStartingVideo(false);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-purple-500/20"
                >
                  {isStartingVideo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                  Start Video Lecture
                </button>
              </>
            )}
            <div className="bg-surface border border-border px-4 py-2 rounded-lg flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Code</span>
              <span className="font-mono text-sm font-semibold text-foreground tracking-widest">{activeCourse.enrollmentCode}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 mt-8">
          {/* Main Operational Area - Lecture Feed / Assignments */}
          <div className="space-y-6">
            
            {/* Tab navigation */}
            <div className="flex border-b border-border/40 pb-px">
              <button
                onClick={() => setActiveTab('lectures')}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === 'lectures'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Video className="w-4 h-4" />
                Lecture History ({lectures.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === 'assignments'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Assignments ({assignments.length})
              </button>
            </div>

            {activeTab === 'lectures' ? (
              <div className="space-y-4">
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
                        
                        <div className="shrink-0 pl-4 flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium border hidden md:inline-block",
                            lecture.status === 'ready' || lecture.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            lecture.status === 'ai_processing' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            lecture.isLive ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-secondary text-muted-foreground border-border"
                          )}>
                            {lecture.isLive ? 'LIVE RECORDING' : lecture.status === 'ai_processing' ? 'PROCESSING AI' : 'READY'}
                          </span>
                          {isTeacher && (lecture.isLive || lecture.status === 'recording') && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm("Are you sure you want to end/complete this live lecture?")) return;
                                try {
                                  await api.post(`/api/lectures/${lecture._id}/end`);
                                  // Fetch lectures again
                                  const { data } = await api.get(`/api/courses/${courseId}/lectures`);
                                  setLectures(data.data);
                                } catch (err) {
                                  alert("Failed to end lecture.");
                                }
                              }}
                              className="px-2.5 py-1 text-blue-500 hover:text-white hover:bg-blue-600 rounded-md border border-blue-500/20 mr-2 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                              title="End Lecture"
                            >
                              <CircleDot className="w-3.5 h-3.5 text-blue-500 animate-pulse group-hover:text-white" />
                              End Lecture
                            </button>
                          )}
                          {isTeacher && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm("Are you sure you want to delete this lecture? This action cannot be undone.")) return;
                                try {
                                  await api.delete(`/api/courses/${courseId}/lectures/${lecture._id}`);
                                  // Fetch lectures again
                                  const { data } = await api.get(`/api/courses/${courseId}/lectures`);
                                  setLectures(data.data);
                                } catch (err) {
                                  alert("Failed to delete lecture.");
                                }
                              }}
                              className="p-1.5 text-destructive hover:bg-destructive/15 rounded-md border border-destructive/20 flex items-center transition-colors ml-2"
                              title="Delete Lecture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assignments Sub-Module */}
                {isTeacher && (
                  <div className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-md font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      Create New Assignment
                    </h4>
                    <form onSubmit={handleCreateAssignment} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Assignment Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. Midterm Essay"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Due Date & Time *</label>
                          <input
                            type="datetime-local"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Prompt *</label>
                        <textarea
                          placeholder="Provide assignment description, prompt, required format..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          rows={3}
                          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Maximum File Size Limit (MB) *</label>
                        <select
                          value={newMaxSize}
                          onChange={(e) => setNewMaxSize(e.target.value)}
                          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="2">2 MB</option>
                          <option value="5">5 MB</option>
                          <option value="10">10 MB (Default)</option>
                          <option value="25">25 MB</option>
                          <option value="50">50 MB</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg transition-all"
                      >
                        Publish Assignment
                      </button>
                    </form>
                  </div>
                )}

                {/* List of active assignments */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Active Assignments</h4>
                  {isLoadingAssignments ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : assignments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm bg-card/30 border border-border/30 rounded-xl">
                      No assignments have been published for this course yet.
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {assignments.map((asg) => {
                        const isOverdue = new Date() > new Date(asg.dueDate);
                        const file = selectedFiles[asg._id];
                        const err = uploadErrors[asg._id];
                        const submission = studentSubmissions[asg._id];
                        const uploading = isUploading[asg._id];

                        if (editingAssignmentId === asg._id) {
                          return (
                            <div key={`edit-${asg._id}`} className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-base text-foreground flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-blue-500" />
                                  Edit Assignment
                                </h5>
                                <button onClick={() => setEditingAssignmentId(null)} className="p-1 hover:bg-secondary/40 rounded-full text-muted-foreground transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <form onSubmit={handleUpdateAssignment} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Title *</label>
                                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Due Date *</label>
                                    <input type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description *</label>
                                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div className="space-y-2 max-w-xs">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Max Size (MB) *</label>
                                  <select value={editMaxSize} onChange={e => setEditMaxSize(e.target.value)} className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="2">2 MB</option>
                                    <option value="5">5 MB</option>
                                    <option value="10">10 MB</option>
                                    <option value="25">25 MB</option>
                                    <option value="50">50 MB</option>
                                  </select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button type="button" onClick={() => setEditingAssignmentId(null)} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm rounded-lg transition-all border border-border/40">Cancel</button>
                                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all">Save Changes</button>
                                </div>
                              </form>
                            </div>
                          );
                        }

                        return (
                          <div key={asg._id} className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm space-y-4 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-border transition-all">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h5 className="font-bold text-base text-foreground">{asg.title}</h5>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                  isOverdue ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                )}>
                                  {isOverdue ? "Overdue" : "Active"}
                                </span>
                                <span className="bg-secondary text-muted-foreground border border-border/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  Limit: {asg.maxSizeMb}MB
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asg.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Due: {new Date(asg.dueDate).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Submissions panel (Right side) */}
                            <div className="shrink-0 flex flex-col gap-3 min-w-[200px] md:self-stretch justify-center pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 pl-0 md:pl-6">
                              {isTeacher ? (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => handleViewSubmissions(asg._id)}
                                    className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    View Submissions
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAssignmentId(asg._id);
                                      setEditTitle(asg.title);
                                      setEditDescription(asg.description);
                                      setEditDueDate(new Date(asg.dueDate).toISOString().slice(0, 16));
                                      setEditMaxSize(asg.maxSizeMb?.toString() || '10');
                                    }}
                                    className="w-full px-3 py-2 border border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500/15 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                    Edit Assignment
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAssignment(asg._id)}
                                    className="w-full px-3 py-2 border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/15 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Assignment
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {submission ? (
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>Submitted</span>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground truncate" title={submission.fileName}>
                                        {submission.fileName}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(submission.submittedAt).toLocaleDateString()}
                                      </div>
                                      
                                      {/* Resubmit form */}
                                      <div className="pt-2 border-t border-border/20">
                                        <label className="block text-[10px] text-muted-foreground hover:text-foreground cursor-pointer underline">
                                          Resubmit new file
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(asg._id, e)}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-[11px] text-muted-foreground">
                                        Select a file under {asg.maxSizeMb}MB to submit.
                                      </div>
                                      <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border/60 hover:border-primary rounded-lg cursor-pointer transition-colors text-xs font-semibold bg-background hover:bg-secondary/20">
                                        <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                                        {file ? "Change File" : "Choose File"}
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => handleFileChange(asg._id, e)}
                                        />
                                      </label>
                                    </div>
                                  )}

                                  {/* Error notification */}
                                  {err && (
                                    <div className="text-[11px] text-red-400 flex items-start gap-1 p-2 bg-red-500/5 border border-red-500/10 rounded-md">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                      <span>{err}</span>
                                    </div>
                                  )}

                                  {/* Selected File Details & Submission CTA */}
                                  {file && (
                                    <div className="space-y-2">
                                      <div className="text-[11px] bg-secondary/40 p-2 rounded border border-border/40 truncate text-muted-foreground" title={file.name}>
                                        Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
                                      </div>
                                      <button
                                        disabled={uploading}
                                        onClick={() => handleSubmitAssignment(asg._id)}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                      >
                                        {uploading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        )}
                                        {uploading ? "Uploading..." : "Submit File"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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

        {/* Submissions Viewer Modal Overlay (Teacher only) */}
        {isViewingSubmissions && viewingAssignmentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-border/60 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between flex-shrink-0">
                <div>
                  <h4 className="text-lg font-bold text-foreground">
                    Submissions List
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {assignments.find(a => a._id === viewingAssignmentId)?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewingSubmissions(false);
                    setViewingAssignmentId(null);
                  }}
                  className="p-1.5 hover:bg-secondary/40 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {teacherSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl">
                    No student submissions yet.
                  </div>
                ) : (
                  <div className="bg-background/40 border border-border/40 rounded-xl overflow-hidden divide-y divide-border/40">
                    {teacherSubmissions.map((sub: any) => {
                      const limit = assignments.find(a => a._id === viewingAssignmentId)?.dueDate;
                      const isLate = limit ? new Date(sub.submittedAt) > new Date(limit) : false;

                      return (
                        <div key={sub._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">{sub.studentId?.name || "Student"}</span>
                              <span className="text-xs text-muted-foreground font-mono">({sub.studentId?.email})</span>
                              {isLate && (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase rounded">
                                  Late Submission
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={sub.fileName}>
                                {sub.fileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {(sub.fileSize / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                            <a
                              href={api.defaults.baseURL + sub.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <footer className="px-6 py-4 border-t border-border/40 flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setIsViewingSubmissions(false);
                    setViewingAssignmentId(null);
                  }}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-lg transition-colors border border-border/40"
                >
                  Close
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
