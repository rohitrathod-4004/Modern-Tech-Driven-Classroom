/**
 * useVideoRoom — manages the WebRTC session lifecycle for a video lecture.
 *
 * Handles:
 *  - getUserMedia (camera + mic)
 *  - ClassroomHybridManager init and join
 *  - Room state (mode, participants, remote streams)
 *  - Controls: mute / camera off / leave
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ClassroomHybridManager } from '../../infrastructure/rtc/ClassroomHybridManager';
import type { RoomMode, RoomParticipant, RoomState } from '../../infrastructure/rtc/ClassroomHybridManager';
import { api } from '../../infrastructure/api';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL ?? 'http://localhost:4001';

export interface RemoteStream {
  socketId: string;
  stream: MediaStream;
}

export interface UseVideoRoomReturn {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  roomMode: RoomMode;
  participants: RoomParticipant[];
  isMuted: boolean;
  isCameraOff: boolean;
  isConnecting: boolean;
  error: string | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  leave: () => Promise<void>;
  courseId: string;
}

interface UseVideoRoomOptions {
  roomId: string;
  userId: string;
  userName: string;
}

export function useVideoRoom({ roomId, userId, userName }: UseVideoRoomOptions): UseVideoRoomReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [roomMode, setRoomMode] = useState<RoomMode>('P2P');
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>('');

  const managerRef = useRef<ClassroomHybridManager | null>(null);

  useEffect(() => {
    let ignore = false;
    let localMediaStream: MediaStream | null = null;
    let managerInstance: ClassroomHybridManager | null = null;

    const init = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // 1. Acquire camera + mic with graceful fallbacks if hardware is in use
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (mediaErr) {
          console.warn('[useVideoRoom] Full getUserMedia failed, trying audio-only:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!ignore) setIsCameraOff(true);
          } catch (audioErr) {
            console.warn('[useVideoRoom] Audio-only getUserMedia also failed. Joining as view-only:', audioErr);
            stream = null;
            if (!ignore) {
              setIsMuted(true);
              setIsCameraOff(true);
            }
          }
        }

        if (ignore) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        localMediaStream = stream;
        setLocalStream(localMediaStream);

        // 2. Fetch participant token from classroom backend
        const { data } = await api.get(`/api/video/rooms/${roomId}/token`);
        if (ignore) {
          localMediaStream?.getTracks().forEach((t) => t.stop());
          return;
        }

        const { token, courseId: fetchedCourseId } = data.data;
        if (fetchedCourseId) {
          setCourseId(fetchedCourseId);
        }

        // 3. Build the HybridManager
        const manager = new ClassroomHybridManager(SIGNALING_URL, { id: userId, name: userName }, {
          onModeChange: (mode: RoomMode) => {
            if (!ignore) setRoomMode(mode);
          },
          onRoomState: (state: RoomState) => {
            if (!ignore) setParticipants(state.participants);
          },
          onParticipantJoined: (p: RoomParticipant) => {
            if (!ignore) {
              setParticipants((prev) => {
                const filtered = prev.filter((x) => x.id !== p.id);
                return [...filtered, p];
              });
            }
          },
          onParticipantLeft: (socketId: string) => {
            if (!ignore) {
              setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
            }
          },
          onRemoteStream: (socketId: string, remoteStream: MediaStream) => {
            if (!ignore) {
              setRemoteStreams((prev) => {
                const filtered = prev.filter((s) => s.socketId !== socketId);
                return [...filtered, { socketId, stream: remoteStream }];
              });
            }
          },
          onRemoteStreamRemoved: (socketId: string) => {
            if (!ignore) {
              setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
            }
          },
        });

        manager.setLocalStream(localMediaStream);
        await manager.joinRoom(roomId, token);

        if (ignore) {
          manager.leave().catch(console.error);
          localMediaStream?.getTracks().forEach((t) => t.stop());
          return;
        }

        managerRef.current = manager;
        managerInstance = manager;
      } catch (err: any) {
        console.error('[useVideoRoom] init error:', err);
        if (!ignore) {
          setError(err?.message ?? 'Failed to join video room');
        }
      } finally {
        if (!ignore) {
          setIsConnecting(false);
        }
      }
    };

    init();

    return () => {
      ignore = true;
      managerInstance?.leave().catch(console.error);
      managerRef.current?.leave().catch(console.error);
      localMediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, userId, userName]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    managerRef.current?.setMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    managerRef.current?.setCameraOff(next);
  }, [isCameraOff]);

  const leave = useCallback(async () => {
    await managerRef.current?.leave();
    localStream?.getTracks().forEach((t) => t.stop());
  }, [localStream]);

  return {
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
    courseId,
  };
}
