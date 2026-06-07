import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useVideoRoom } from './useVideoRoom';
import { useVideoTranscription } from './useVideoTranscription';
import { useLiveTranscriptPolling } from '../lecture/hooks/useLiveTranscriptPolling';
import { api } from '../../infrastructure/api';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  Radio, Users, Loader2, AlertCircle, Wifi, Zap, Copy, Check
} from 'lucide-react';

// ── Video Tile ───────────────────────────────────────────────────────────────
function VideoTile({
  stream,
  label,
  isSelf = false,
  isCameraOff = false,
}: {
  stream: MediaStream | null;
  label: string;
  isSelf?: boolean;
  isCameraOff?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && !isCameraOff) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOff]);

  const showVideo = stream && !isCameraOff;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-card/40 border backdrop-blur-md transition-all duration-300 ${
      isSelf ? 'border-primary/50 shadow-[0_0_25px_-5px_rgba(59,130,246,0.2)]' : 'border-border/60'
    } aspect-video group flex items-center justify-center`}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isSelf}
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/30 to-muted/10 relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 via-purple-500/10 to-blue-500/20 flex items-center justify-center shadow-inner border border-primary/10">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {label.trim().charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-3 font-medium">Camera is disabled</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/40 text-foreground text-xs font-semibold shadow-sm">
        {isSelf ? (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        )}
        {label}
      </div>
    </div>
  );
}

// ── Transcript Panel ──────────────────────────────────────────────────────────
function TranscriptPanel({ chunks }: { chunks: Array<{ chunk_index: number; text: string; status: string }> }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chunks]);

  return (
    <div className="flex flex-col h-full bg-surface/30 backdrop-blur-md border-l border-border/40">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-background/50">
        <Radio className="w-4 h-4 text-primary animate-pulse" />
        <h3 className="text-sm font-semibold tracking-wide text-foreground">Live Transcript</h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
          {chunks.length} segments
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <Radio className="w-8 h-8 mb-2 text-primary/40 animate-pulse" />
            <p className="text-xs leading-relaxed max-w-[200px]">
              Transcribing live audio... speak to see updates here.
            </p>
          </div>
        ) : (
          chunks.map((c) => (
            <div
              key={c.chunk_index}
              className={`p-3.5 rounded-xl border transition-all duration-300 leading-relaxed ${
                c.status === 'synced'
                  ? 'bg-primary/5 border-primary/10 text-foreground'
                  : 'bg-amber-500/5 border-amber-500/10 text-amber-500/90 italic'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground/80">
                  Segment #{c.chunk_index + 1}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  c.status === 'synced' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`} />
              </div>
              <p className="text-sm font-medium">{c.text}</p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Main VideoLectureRoom Page ────────────────────────────────────────────────
export function VideoLectureRoom() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { activeCourse, fetchCourseById } = useCourseStore();

  const [isCopied, setIsCopied] = useState(false);

  const initialCourseId: string = location.state?.courseId ?? '';
  const isTeacher: boolean = location.state?.isTeacher ?? (user?.role === 'teacher');

  const {
    localStream,
    remoteStreams,
    roomMode,
    participants,
    isMuted,
    isCameraOff,
    isConnecting,
    error,
    toggleMute,
    toggleCamera,
    leave,
    courseId: fetchedCourseId,
  } = useVideoRoom({
    roomId: lectureId ?? '',
    userId: user?.id ?? 'unknown',
    userName: user?.name ?? user?.email ?? 'Participant',
  });

  const courseId = initialCourseId || fetchedCourseId;

  // Fetch course details dynamically to get the enrollment code
  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [courseId, fetchCourseById]);

  // Local state to store pooled & sorted transcript chunks
  const [transcriptChunks, setTranscriptChunks] = useState<Array<{ chunk_index: number; text: string; status: string }>>([]);

  // Teacher uploads raw WebM audio clips to Whisper API
  const { chunksProcessed } = useVideoTranscription({
    lectureId: lectureId ?? null,
    courseId,
    stream: isTeacher ? localStream : null,
    enabled: !isMuted && isTeacher,
  });

  // Handler for receiving newly transcribed segments via DB polling
  const handleNewChunks = useCallback((newNodes: any[]) => {
    const validNodes = newNodes.filter((n) => n.text && n.text.trim().length > 0);
    setTranscriptChunks((prev) => {
      const merged = [...prev];
      validNodes.forEach((node) => {
        if (!merged.some((c) => c.chunk_index === node.chunkIndex)) {
          merged.push({
            chunk_index: node.chunkIndex,
            text: node.text,
            status: 'synced',
          });
        }
      });
      return merged.sort((a, b) => a.chunk_index - b.chunk_index);
    });
  }, []);

  const handleLectureEnded = useCallback(() => {
    console.log('[VideoLectureRoom] Lecture ended detected.');
    if (!isTeacher) {
      alert("The teacher has concluded this video lecture.");
      leave().catch(console.error);
      navigate(courseId ? `/courses/${courseId}` : '/dashboard');
    }
  }, [isTeacher, courseId, navigate, leave]);

  // Both teachers and students poll the DB to display synced transcripts
  useLiveTranscriptPolling({
    courseId,
    lectureId: lectureId ?? null,
    isActive: !isConnecting && !!lectureId,
    onNewChunks: handleNewChunks,
    onLectureEnded: handleLectureEnded,
  });

  const handleLeave = async () => {
    if (isTeacher && lectureId) {
      const confirmEnd = window.confirm("Do you want to end this lecture for everyone?");
      if (confirmEnd) {
        try {
          await api.post(`/api/lectures/${lectureId}/end`);
        } catch (err) {
          console.error("Failed to end lecture session:", err);
        }
      }
    }
    await leave();
    navigate(courseId ? `/courses/${courseId}` : '/dashboard');
  };

  const copyCode = () => {
    if (activeCourse?.enrollmentCode) {
      navigator.clipboard.writeText(activeCourse.enrollmentCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isConnecting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse border border-primary/20">
            <VideoIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-semibold">Configuring hybrid WebRTC connection...</p>
          <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Connection Failed</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl font-semibold text-sm transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allStreams = [
    { id: 'local', stream: localStream, label: `${user?.name ?? 'You'} (You)`, isSelf: true, isCamOff: isCameraOff },
    ...remoteStreams.map((rs) => ({
      id: rs.socketId,
      stream: rs.stream,
      label: participants.find((p) => p.socketId === rs.socketId)?.name ?? 'Participant',
      isSelf: false,
      isCamOff: false, // In simple-peer setup, track state changes can be handled if needed
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative font-sans">
      {/* Ambient glassmorphic blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-xl z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground leading-tight">
              {activeCourse?.title ? `${activeCourse.title} — Video Lecture` : 'Video Lecture'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 inline" />
              {allStreams.length} active connection{allStreams.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Dynamic Course Code Display */}
        {activeCourse?.enrollmentCode && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-border/60 shadow-sm">
            <span className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">Course Code</span>
            <span className="font-mono text-xs font-bold text-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border/40">
              {activeCourse.enrollmentCode}
            </span>
            <button
              onClick={copyCode}
              className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Copy enrollment code"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
            roomMode === 'SFU'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {roomMode === 'SFU' ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <Wifi className="w-3.5 h-3.5" />}
            {roomMode} Mode
          </div>

          {isTeacher && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-extrabold uppercase tracking-wider text-primary">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {chunksProcessed} Chunks
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Video grid */}
        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
          <div className={`grid gap-4 w-full max-w-5xl ${
            allStreams.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' :
            allStreams.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            allStreams.length <= 4 ? 'grid-cols-2' :
            'grid-cols-2 lg:grid-cols-3'
          }`}>
            {allStreams.map((s) => (
              <VideoTile
                key={s.id}
                stream={s.stream}
                label={s.label}
                isSelf={s.isSelf}
                isCameraOff={s.isCamOff}
              />
            ))}
          </div>
        </div>

        {/* Transcript sidebar */}
        <aside className="w-80 shrink-0 flex flex-col">
          <TranscriptPanel chunks={transcriptChunks} />
        </aside>
      </div>

      {/* ── Controls Bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-5 px-6 py-4 border-t border-border/40 bg-background/60 backdrop-blur-xl z-20 shadow-md">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isMuted
              ? 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'bg-secondary/60 text-foreground border border-border/50 hover:bg-secondary hover:scale-105'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Button */}
        <button
          onClick={toggleCamera}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isCameraOff
              ? 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'bg-secondary/60 text-foreground border border-border/50 hover:bg-secondary hover:scale-105'
          }`}
          title={isCameraOff ? 'Enable camera' : 'Disable camera'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </button>

        {/* Separation border */}
        <div className="h-6 w-px bg-border/60 mx-1" />

        {/* Leave/End Call Button */}
        <button
          onClick={handleLeave}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-[0_0_20px_-3px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_-3px_rgba(239,68,68,0.6)] hover:scale-105"
          title={isTeacher ? 'End lecture for everyone' : 'Leave room'}
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
