import React, { useRef, useEffect } from 'react';
import { usePlaybackSync } from '../../../hooks/usePlaybackSync';
import { useTimelineStore } from '../../../infrastructure/stores/timelineStore';

interface MediaContainerProps {
  audioUrl?: string;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({ audioUrl }) => {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const pendingSeekTime = useTimelineStore(state => state.pendingSeekTime);
  const clearPendingSeek = useTimelineStore(state => state.clearPendingSeek);
  const [isMetadataLoaded, setIsMetadataLoaded] = React.useState(false);
  const [audioError, setAudioError] = React.useState(false);

  // Initialize the rAF playback synchronization loop
  usePlaybackSync(mediaRef);

  useEffect(() => {
    if (pendingSeekTime !== null && mediaRef.current && isMetadataLoaded) {
      mediaRef.current.currentTime = pendingSeekTime;
      clearPendingSeek();
      if (mediaRef.current.paused) {
        mediaRef.current.play().catch(e => console.error('Autoplay prevented', e));
      }
    }
  }, [pendingSeekTime, clearPendingSeek, isMetadataLoaded]);

  // Reset error state when navigating between lectures
  useEffect(() => {
    setAudioError(false);
    setIsMetadataLoaded(false);
  }, [audioUrl]);

  if (!audioUrl || audioError) {
    return (
      <div style={{ width: '100%', padding: '1rem', background: '#f9f9f9', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', color: '#9ca3af' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>🎙️ Audio playback unavailable — the recording file is not stored on this server.</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Transcript and timeline are still fully interactive.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '1rem', background: '#fcfcfc', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#555' }}>Lecture Audio</h4>
      <audio
        ref={mediaRef}
        controls
        onLoadedMetadata={() => setIsMetadataLoaded(true)}
        onError={() => setAudioError(true)}
        style={{ width: '100%' }}
        src={audioUrl}
      />
    </div>
  );
};
