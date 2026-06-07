/**
 * useVideoTranscription — extracts audio from a MediaStream and sends chunks
 * to the Whisper transcription service, exactly as Recorder.tsx does but
 * driven by the live video stream rather than a standalone getUserMedia call.
 *
 * Returns { chunks, chunksProcessed } for display in the transcript panel.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadChunk } from '../../services/api';

export interface TranscriptEntry {
  chunk_index: number;
  text: string;
  status: 'live' | 'offline' | 'synced';
}

interface UseVideoTranscriptionOptions {
  lectureId: string | null;
  courseId: string;
  stream: MediaStream | null;   // The local MediaStream from the video room
  language?: string;
  enabled?: boolean;            // Set false to pause transcription (e.g. muted)
}

export function useVideoTranscription({
  lectureId,
  courseId,
  stream,
  language = 'en',
  enabled = true,
}: UseVideoTranscriptionOptions) {
  const [chunks, setChunks] = useState<TranscriptEntry[]>([]);
  const chunkIndexRef = useRef(0);
  const intervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isActiveRef = useRef(false);

  const addOrUpdateChunk = useCallback((index: number, text: string, status: TranscriptEntry['status']) => {
    setChunks((prev) => {
      const idx = prev.findIndex((c) => c.chunk_index === index);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { chunk_index: index, text, status };
        return updated;
      }
      return [...prev, { chunk_index: index, text, status }].sort((a, b) => a.chunk_index - b.chunk_index);
    });
  }, []);

  useEffect(() => {
    if (!stream || !lectureId || !enabled) return;

    isActiveRef.current = true;
    chunkIndexRef.current = 0;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('[useVideoTranscription] No audio tracks found in stream');
      return;
    }

    const audioStream = new MediaStream(audioTracks);

    const startChunkCycle = () => {
      if (!isActiveRef.current) return;
      try {
        const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (!e.data || e.data.size === 0 || !isActiveRef.current) return;
          const currentIndex = chunkIndexRef.current++;
          const blob = e.data;

          try {
            const result = await uploadChunk(blob, lectureId!, courseId, currentIndex, language);
            if (result?.text) {
              addOrUpdateChunk(currentIndex, result.text, 'synced');
            }
          } catch (err) {
            console.error('[useVideoTranscription] Error uploading chunk:', err);
            addOrUpdateChunk(currentIndex, '[Audio captured offline]', 'offline');
          }
        };

        recorder.start();
      } catch (err) {
        console.error('[useVideoTranscription] MediaRecorder error:', err);
      }
    };

    startChunkCycle();

    intervalRef.current = window.setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        startChunkCycle();
      }
    }, 3000);

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stream, lectureId, courseId, language, enabled, addOrUpdateChunk]);

  return {
    chunks,
    chunksProcessed: chunks.filter((c) => c.status === 'synced').length,
  };
}
