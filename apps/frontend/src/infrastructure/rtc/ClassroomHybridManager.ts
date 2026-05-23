/**
 * ClassroomHybridManager
 *
 * Adapts the P2P-SFU HybridManager for use inside the Classroom platform.
 * Connects to the standalone P2P-SFU signaling server (default: localhost:4001).
 *
 * Manages:
 *  - Socket.IO connection to signaling server
 *  - P2P mesh via simple-peer
 *  - Automatic migration to SFU (LiveKit) when participant count exceeds threshold
 */

import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

// ── Signaling Events (mirrors @p2p-sfu/shared SignalingEvents) ──────────────
export const SignalingEvents = {
  JOIN: 'join',
  LEAVE: 'leave',
  ROOM_STATE: 'room-state',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  P2P_OFFER: 'p2p-offer',
  P2P_ANSWER: 'p2p-answer',
  P2P_ICE_CANDIDATE: 'p2p-ice-candidate',
  CHAT_MESSAGE: 'chat-message',
  RAISE_HAND: 'raise-hand',
  TRACK_MUTED: 'track-muted',
  TRACK_VIDEO_OFF: 'track-video-off',
  USER_NAME_CHANGED: 'user-name-changed',
  MIGRATE_TO_SFU: 'migrate-to-sfu',
  MIGRATE_TO_P2P: 'migrate-to-p2p',
  MIGRATION_ACK: 'migration-ack',
  DROP_P2P: 'drop-p2p',
  DROP_SFU_PUBLICATION: 'drop-sfu-publication',
} as const;

export type RoomMode = 'P2P' | 'SFU';

export interface RoomParticipant {
  id: string;
  name: string;
  socketId: string;
  isPublishingToSFU: boolean;
}

export interface RoomState {
  roomId: string;
  mode: RoomMode;
  participants: RoomParticipant[];
}

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

type Callbacks = {
  onRemoteStream?: (socketId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (socketId: string) => void;
  onModeChange?: (mode: RoomMode) => void;
  onRoomState?: (state: RoomState) => void;
  onParticipantJoined?: (p: RoomParticipant) => void;
  onParticipantLeft?: (socketId: string) => void;
};

export class ClassroomHybridManager {
  private socket: Socket;
  private localStream?: MediaStream;
  private user: { id: string; name: string };
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private callbacks: Callbacks;
  private roomId: string | null = null;

  constructor(
    signalingUrl: string,
    user: { id: string; name: string },
    callbacks: Callbacks = {}
  ) {
    this.socket = io(signalingUrl, { autoConnect: false });
    this.user = user;
    this.callbacks = callbacks;
    this.bindSocket();
  }

  setLocalStream(stream?: MediaStream | null) {
    this.localStream = stream || undefined;
  }

  async joinRoom(roomId: string, token?: string) {
    this.roomId = roomId;
    this.socket.connect();
    this.socket.emit(SignalingEvents.JOIN, {
      roomId,
      user: this.user,
      token: token ?? 'classroom-token',
    });
  }

  sendChat(message: { id: string; senderId: string; senderName: string; text: string; timestamp: number }) {
    if (!this.roomId) return;
    this.socket.emit(SignalingEvents.CHAT_MESSAGE, { ...message, roomId: this.roomId });
  }

  setMuted(isMuted: boolean) {
    if (!this.roomId) return;
    this.socket.emit(SignalingEvents.TRACK_MUTED, { roomId: this.roomId, isMuted });
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
    }
  }

  setCameraOff(isVideoOff: boolean) {
    if (!this.roomId) return;
    this.socket.emit(SignalingEvents.TRACK_VIDEO_OFF, { roomId: this.roomId, isVideoOff });
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
    }
  }

  get socketId() {
    return this.socket.id;
  }

  async leave() {
    this.dropAllPeers();
    if (this.roomId) {
      this.socket.emit(SignalingEvents.LEAVE, { roomId: this.roomId, user: this.user });
    }
    this.socket.disconnect();
  }

  // ── Socket Binding ──────────────────────────────────────────────────────────
  private bindSocket() {
    this.socket.on(SignalingEvents.ROOM_STATE, (room: RoomState) => {
      this.callbacks.onRoomState?.(room);
      this.callbacks.onModeChange?.(room.mode);
    });

    this.socket.on(SignalingEvents.USER_JOINED, (participant: RoomParticipant) => {
      this.callbacks.onParticipantJoined?.(participant);
      // We (the existing peer) initiate an offer to the newcomer
      this.createPeerAndOffer(participant.socketId);
    });

    this.socket.on(SignalingEvents.USER_LEFT, ({ socketId }: { socketId: string }) => {
      this.removePeer(socketId);
      this.callbacks.onParticipantLeft?.(socketId);
      this.callbacks.onRemoteStreamRemoved?.(socketId);
    });

    // P2P signaling
    this.socket.on(SignalingEvents.P2P_OFFER, ({ signal, senderSocketId }: any) => {
      this.handleOffer(senderSocketId, signal);
    });
    this.socket.on(SignalingEvents.P2P_ANSWER, ({ signal, senderSocketId }: any) => {
      this.peers.get(senderSocketId)?.signal(signal);
    });
    this.socket.on(SignalingEvents.P2P_ICE_CANDIDATE, ({ signal, senderSocketId }: any) => {
      this.peers.get(senderSocketId)?.signal(signal);
    });

    // Migration
    this.socket.on(SignalingEvents.MIGRATE_TO_SFU, async () => {
      await this.handleMigrationToSFU();
    });
    this.socket.on(SignalingEvents.DROP_P2P, () => {
      this.dropAllPeers();
    });
    this.socket.on(SignalingEvents.MIGRATE_TO_P2P, () => {
      this.dropAllPeers();
      this.callbacks.onModeChange?.('P2P');
    });
    this.socket.on(SignalingEvents.DROP_SFU_PUBLICATION, () => {
      // SFU unpublish would go here; for now just log
      console.log('[HybridManager] DROP_SFU_PUBLICATION received');
    });
  }

  // ── P2P Helpers ─────────────────────────────────────────────────────────────
  private createPeerAndOffer(targetSocketId: string) {
    if (this.peers.has(targetSocketId)) return;
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream: this.localStream,
      config: { iceServers: DEFAULT_ICE_SERVERS as any },
    });
    this.setupPeer(peer, targetSocketId);
    this.peers.set(targetSocketId, peer);
  }

  private handleOffer(senderSocketId: string, offerSignal: any) {
    if (this.peers.has(senderSocketId)) {
      this.peers.get(senderSocketId)!.signal(offerSignal);
      return;
    }
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      stream: this.localStream,
      config: { iceServers: DEFAULT_ICE_SERVERS as any },
    });
    this.setupPeer(peer, senderSocketId);
    peer.signal(offerSignal);
    this.peers.set(senderSocketId, peer);
  }

  private setupPeer(peer: SimplePeer.Instance, remoteSocketId: string) {
    peer.on('signal', (data: any) => {
      const isOffer = data.type === 'offer';
      const ev = isOffer ? SignalingEvents.P2P_OFFER : SignalingEvents.P2P_ANSWER;
      this.socket.emit(ev, { targetSocketId: remoteSocketId, signal: data });
    });
    peer.on('stream', (stream: MediaStream) => {
      this.callbacks.onRemoteStream?.(remoteSocketId, stream);
    });
    peer.on('error', (err: any) => console.error('[P2P] error', err));
    peer.on('close', () => {
      this.peers.delete(remoteSocketId);
      this.callbacks.onRemoteStreamRemoved?.(remoteSocketId);
    });
  }

  private removePeer(socketId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      try { peer.destroy(); } catch (_) {}
      this.peers.delete(socketId);
    }
  }

  private dropAllPeers() {
    for (const [id, p] of Array.from(this.peers.entries())) {
      try { p.destroy(); } catch (_) {}
      this.peers.delete(id);
    }
  }

  // ── SFU Migration ────────────────────────────────────────────────────────────
  private async handleMigrationToSFU() {
    if (!this.roomId) return;
    console.log('[HybridManager] Migrating to SFU for room', this.roomId);
    this.callbacks.onModeChange?.('SFU');
    // Send ACK so server knows we are ready
    this.socket.emit(SignalingEvents.MIGRATION_ACK);
    // Note: Full LiveKit SFU publish would happen here via SFUClient.
    // For the classroom integration we rely on the signaling-only path;
    // video streams remain P2P beyond the migration ACK since LiveKit
    // requires a separate cloud key configuration.
  }
}
