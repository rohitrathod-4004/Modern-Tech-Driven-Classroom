import SimplePeer from "simple-peer";
import io, { Socket } from "socket.io-client";
import { SignalingEvents, JoinPayload, P2PSignalPayload, Participant, SHARED_CONSTANTS, UserNameChangePayload } from "@p2p-sfu/shared";
import SFUClient from "./sfu/SFUClient";

type Callbacks = {
    onRemoteStream?: (socketId: string, stream: MediaStream) => void;
    onPeerConnected?: (socketId: string) => void;
    onPeerDisconnected?: (socketId: string) => void;
    onModeChange?: (mode: "P2P" | "SFU") => void;
    onChatMessage?: (message: { id: string; senderId: string; senderName: string; text: string; timestamp: number }) => void;
    onHandRaise?: (socketId: string, isRaised: boolean) => void;
    onTrackMuted?: (socketId: string, isMuted: boolean) => void;
    onTrackVideoOff?: (socketId: string, isVideoOff: boolean) => void;
    onNameChanged?: (socketId: string, newName: string) => void;
    onLog?: (obj: any) => void;
};

export class HybridManager {
    private socket: Socket;
    private localStream?: MediaStream;
    private user: { id: string; name: string };
    private peers: Map<string, SimplePeer.Instance> = new Map(); // key by remote socketId
    private sfuClient: SFUClient | null = null;
    private callbacks: Callbacks;
    private roomId: string | null = null;
    private connectedToSFU = false;
    private publishedToSFU = false;
    private iceServers: any[] = SHARED_CONSTANTS.DEFAULT_ICE_SERVERS;
    public selfSocketId: string | null = null;

    constructor(socketUrl: string, user: { id: string; name: string }, callbacks?: Callbacks) {
        this.socket = io(socketUrl, {
            autoConnect: false,
            transports: ["websocket"],
            extraHeaders: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        this.user = user;
        this.callbacks = callbacks || {};
        this.bindSocket();
    }

    private log(obj: any) {
        const wrapped = { ts: Date.now(), ...obj };
        console.log(JSON.stringify(wrapped));
        this.callbacks.onLog?.(wrapped);
    }

    setLocalStream(stream: MediaStream) {
        this.localStream = stream;
    }

    async joinRoom(roomId: string) {
        if (!this.localStream) throw new Error("Local stream not set");
        this.roomId = roomId;

        // Fetch TURN credentials first
        try {
            const res = await fetch("/api/turn-credentials");
            const data = await res.json();
            this.log({ event: "TURN:RESPONSE", data }); // Debug: see what we got
            if (data.iceServers && data.iceServers.length > 0) {
                this.iceServers = [...SHARED_CONSTANTS.DEFAULT_ICE_SERVERS, ...data.iceServers];
                this.log({ event: "TURN:FETCH_SUCCESS", count: data.iceServers.length, servers: this.iceServers });
            } else {
                this.log({ event: "TURN:NO_CREDENTIALS_RETURNED", data });
            }
        } catch (e) {
            this.log({ event: "TURN:FETCH_FAIL", error: String(e) });
            // Fallback is already set to DEFAULT_ICE_SERVERS in constructor
        }

        // Connect socket; the 'connect' handler will emit JOIN
        if (!this.socket.connected) {
            this.socket.connect();
        } else {
            // If already connected (rare), emit JOIN immediately
            this.emitJoin();
        }

        // Create background SFU client instance (not connected yet)
        this.sfuClient = new SFUClient();
        this.sfuClient.subscribeHandlers({
            onConnected: () => {
                this.connectedToSFU = true;
                this.log({ event: "SFU:CONNECTED", roomId });
                this.callbacks.onModeChange?.("SFU");
            },
            onPublished: () => {
                this.publishedToSFU = true;
                this.log({ event: "SFU:PUBLISHED", roomId });
            },
            onRemoteTrack: (track, participant) => {
                this.log({ event: "SFU:REMOTE_TRACK", participantId: participant.identity, kind: track.kind });

                // Attach track to MediaStream
                if (track.kind === "video" || track.kind === "audio") {
                    const mediaStreamTrack = track.mediaStreamTrack;

                    // Find or create MediaStream for this participant
                    let stream = this.getOrCreateSFUStream(participant.identity);
                    stream.addTrack(mediaStreamTrack);

                    // Notify callback with the stream
                    if (track.kind === "video") {
                        this.callbacks.onRemoteStream?.(participant.identity, stream);
                    }
                }
            },
            onParticipantConnected: (participant) => {
                this.log({ event: "SFU:PARTICIPANT_JOINED", participantId: participant.identity });
                this.callbacks.onPeerConnected?.(participant.identity);
            },
            onParticipantDisconnected: (participant) => {
                this.log({ event: "SFU:PARTICIPANT_LEFT", participantId: participant.identity });
                this.callbacks.onPeerDisconnected?.(participant.identity);
            },
            onError: (err) => {
                this.log({ event: "SFU:ERROR", error: String(err) });
            }
        });
    }

    // Helper to manage SFU participant streams
    private sfuStreams: Map<string, MediaStream> = new Map();

    private getOrCreateSFUStream(participantId: string): MediaStream {
        if (!this.sfuStreams.has(participantId)) {
            this.sfuStreams.set(participantId, new MediaStream());
        }
        return this.sfuStreams.get(participantId)!;
    }

    private emitJoin() {
        if (!this.roomId || !this.user) return;
        const payload: JoinPayload = { roomId: this.roomId, user: this.user };
        this.socket.emit(SignalingEvents.JOIN, payload);
        this.log({ event: "SIGNAL:JOIN_EMIT", roomId: this.roomId, userId: this.user.id });
    }

    private bindSocket() {
        this.socket.on("connect", () => {
            this.selfSocketId = this.socket.id || null;
            this.log({ event: "SOCKET:CONNECTED", socketId: this.selfSocketId });
            this.emitJoin(); // Auto-join on connect/reconnect
        });

        this.socket.on("connect_error", (err) => {
            this.log({ event: "SOCKET:CONNECT_ERROR", error: err.message });
        });

        this.socket.on(SignalingEvents.ROOM_STATE, (room: any) => {
            this.log({ event: "ROOM_STATE", roomId: room.roomId, mode: room.mode, count: room.participants.length });
            this.callbacks.onModeChange?.(room.mode);

            // FIX 4: New Client MUST start P2P with existing participants
            // We initiate connections to everyone already in the room
            if (room.mode === "P2P") {
                room.participants.forEach((p: Participant) => {
                    // Prevent connecting to self (use socket.id directly as selfSocketId might be delayed)
                    if (p.socketId !== this.socket.id && p.socketId !== this.selfSocketId) {
                        // We are the new joiner, so we initiate
                        this.createPeerAndOffer(p.socketId, true);
                    }
                });
            }
        });

        this.socket.on(SignalingEvents.USER_JOINED, (participant: Participant) => {
            this.log({ event: "SIGNAL:USER_JOINED", socketId: participant.socketId, name: participant.name });
            // FIX 1: Only create P2P offers if the local client joined BEFORE the new participant.
            // Since we are receiving USER_JOINED, we are the existing client (joined before).
            // However, per FIX 4, the NEW client (who receives ROOM_STATE) will initiate.
            // So we should NOT initiate here to avoid glare/duplicate offers.
            // We wait for their offer.
        });

        this.socket.on(SignalingEvents.USER_LEFT, ({ socketId }: { socketId: string }) => {
            this.log({ event: "SIGNAL:USER_LEFT", socketId });
            this.removePeer(socketId);
            this.callbacks.onPeerDisconnected?.(socketId);
        });

        // P2P signals
        this.socket.on(SignalingEvents.P2P_OFFER, async ({ signal, senderSocketId }: any) => {
            this.log({ event: "P2P:OFFER", from: senderSocketId });
            await this.handleOffer(senderSocketId, signal);
        });

        this.socket.on(SignalingEvents.P2P_ANSWER, ({ signal, senderSocketId }: any) => {
            this.log({ event: "P2P:ANSWER", from: senderSocketId });
            const peer = this.peers.get(senderSocketId);
            if (peer) peer.signal(signal);
        });

        this.socket.on(SignalingEvents.P2P_ICE_CANDIDATE, ({ signal, senderSocketId }: any) => {
            this.log({ event: "P2P:CANDIDATE", from: senderSocketId });
            const peer = this.peers.get(senderSocketId);
            if (peer) peer.signal(signal);
        });

        // Migration messages
        this.socket.on(SignalingEvents.MIGRATE_TO_SFU, async () => {
            this.log({ event: "MIGRATE:TO_SFU", roomId: this.roomId });
            await this.handleMigrationToSFU();
        });

        this.socket.on(SignalingEvents.DROP_P2P, async () => {
            this.log({ event: "MIGRATE:DROP_P2P", roomId: this.roomId });
            this.dropAllP2PPeers();
        });

        this.socket.on(SignalingEvents.MIGRATE_TO_P2P, async () => {
            this.log({ event: "MIGRATE:TO_P2P", roomId: this.roomId });
            await this.handleMigrationToP2P();
        });

        this.socket.on(SignalingEvents.DROP_SFU_PUBLICATION, async () => {
            this.log({ event: "MIGRATE:DROP_SFU_PUBLICATION", roomId: this.roomId });
            await this.unpublishFromSFU();
        });

        // Security signals (log)
        this.socket.on(SignalingEvents.SECURITY_INVALID_TOKEN, () => {
            this.log({ event: "SECURITY:INVALID_TOKEN" });
        });

        this.socket.on(SignalingEvents.SECURITY_RATE_LIMIT, () => {
            this.log({ event: "SECURITY:RATE_LIMIT" });
        });

        this.socket.on(SignalingEvents.SECURITY_MALFORMED_PACKET, () => {
            this.log({ event: "SECURITY:MALFORMED_PACKET" });
        });

        // Chat and Controls
        this.socket.on(SignalingEvents.CHAT_MESSAGE, (message: any) => {
            this.log({ event: "CHAT:RECEIVED", from: message.senderName });
            this.callbacks.onChatMessage?.(message);
        });

        this.socket.on(SignalingEvents.RAISE_HAND, ({ socketId, isRaised }: any) => {
            this.log({ event: "HAND:RECEIVED", socketId, isRaised });
            this.callbacks.onHandRaise?.(socketId, isRaised);
        });

        this.socket.on(SignalingEvents.TRACK_MUTED, ({ socketId, isMuted }: any) => {
            this.log({ event: "TRACK:MUTED_RECEIVED", socketId, isMuted });
            this.callbacks.onTrackMuted?.(socketId, isMuted);
        });

        this.socket.on(SignalingEvents.TRACK_VIDEO_OFF, ({ socketId, isVideoOff }: any) => {
            this.log({ event: "TRACK:VIDEO_OFF_RECEIVED", socketId, isVideoOff });
            this.callbacks.onTrackVideoOff?.(socketId, isVideoOff);
        });

        this.socket.on(SignalingEvents.USER_NAME_CHANGED, ({ socketId, newName }: any) => {
            this.log({ event: "NAME:CHANGED_RECEIVED", socketId, newName });
            this.callbacks.onNameChanged?.(socketId, newName);
        });
    }

    private setupPeerEvents(peer: SimplePeer.Instance, remoteSocketId: string) {
        peer.on("signal", (signal: any) => {
            this.log({ event: "P2P:SIGNAL_GENERATED", target: remoteSocketId, type: signal.type });

            const payload = {
                senderSocketId: this.socket.id,
                targetSocketId: remoteSocketId,
                roomId: this.roomId,
                signal
            };

            if (signal.type === 'offer') {
                this.socket.emit(SignalingEvents.P2P_OFFER, payload);
            } else if (signal.type === 'answer') {
                this.socket.emit(SignalingEvents.P2P_ANSWER, payload);
            } else if (signal.candidate) {
                this.log({
                    event: "P2P:ICE_CANDIDATE_GATHERED",
                    target: remoteSocketId,
                    candidateType: signal.candidate.candidate.split(" ")[7]
                });
                this.socket.emit(SignalingEvents.P2P_ICE_CANDIDATE, payload);
            }
        });

        peer.on("connect", () => {
            this.log({ event: "P2P:CONNECTED", peer: remoteSocketId });
            this.callbacks.onPeerConnected?.(remoteSocketId);
        });

        peer.on("stream", (remoteStream: MediaStream) => {
            this.log({ event: "P2P:STREAM", from: remoteSocketId });
            this.callbacks.onRemoteStream?.(remoteSocketId, remoteStream);
        });

        peer.on("error", (err) => {
            this.log({ event: "P2P:ERROR", peer: remoteSocketId, error: String(err) });
        });

        peer.on("close", () => {
            this.log({ event: "P2P:CLOSED", peer: remoteSocketId });
            this.peers.delete(remoteSocketId);
            this.callbacks.onPeerDisconnected?.(remoteSocketId);
        });
    }

    // --- P2P helpers ---
    private createPeerAndOffer(targetSocketId: string, initiator: boolean) {
        if (!this.localStream) {
            this.log({ event: "P2P:ERROR", error: "No local stream for P2P" });
            return;
        }
        if (targetSocketId === this.socket.id) return;
        if (this.peers.has(targetSocketId)) {
            this.log({ event: "P2P:WARN", message: "Peer already exists", target: targetSocketId });
            return;
        }

        this.log({ event: "P2P:CREATE_PEER", target: targetSocketId, initiator, iceServers: this.iceServers.length });

        // FIX 2: Use fetched TURN credentials
        try {
            const peer = new SimplePeer({
                initiator,
                trickle: true,
                stream: this.localStream,
                config: { iceServers: this.iceServers }
            });

            this.setupPeerEvents(peer, targetSocketId);

            // Debug ICE State
            const p = peer as any;
            if (p._pc) {
                p._pc.oniceconnectionstatechange = () => {
                    this.log({
                        event: "P2P:ICE_STATE_CHANGE",
                        target: targetSocketId,
                        state: p._pc.iceConnectionState
                    });
                };
            }

            this.peers.set(targetSocketId, peer);
        } catch (err) {
            this.log({ event: "P2P:CREATE_ERROR", error: String(err), target: targetSocketId });
        }
    }

    private async handleOffer(senderSocketId: string, offerSignal: any) {
        if (!this.localStream) return;
        if (this.peers.has(senderSocketId)) {
            this.log({ event: "P2P:SIGNAL_EXISTING", from: senderSocketId });
            const peer = this.peers.get(senderSocketId)!;
            peer.signal(offerSignal);
            return;
        }

        this.log({ event: "P2P:HANDLE_OFFER", from: senderSocketId, iceServers: this.iceServers.length });

        // FIX 2: Use fetched TURN credentials
        try {
            const peer = new SimplePeer({
                initiator: false,
                trickle: true,
                stream: this.localStream,
                config: { iceServers: this.iceServers }
            });

            this.setupPeerEvents(peer, senderSocketId);

            // Debug ICE State
            const p = peer as any;
            if (p._pc) {
                p._pc.oniceconnectionstatechange = () => {
                    this.log({
                        event: "P2P:ICE_STATE_CHANGE",
                        target: senderSocketId,
                        state: p._pc.iceConnectionState
                    });
                };
            }

            peer.signal(offerSignal);
            this.peers.set(senderSocketId, peer);

        } catch (err) {
            this.log({ event: "P2P:HANDLE_OFFER_ERROR", error: String(err), from: senderSocketId });
        }
    }

    private removePeer(socketId: string) {
        const peer = this.peers.get(socketId);
        if (peer) {
            try { peer.destroy(); } catch (e) { }
            this.peers.delete(socketId);
        }
    }
    private dropAllP2PPeers() {
        this.log({ event: "P2P:DROPPING_ALL", count: this.peers.size });
        for (const [id, p] of Array.from(this.peers.entries())) {
            try { p.destroy(); } catch (_) { }
            this.peers.delete(id);
        }
    }

    // --- Migration handlers ---
    private async handleMigrationToSFU() {
        if (!this.roomId || !this.sfuClient || !this.localStream) return;
        // Connect to SFU in background (muted) if not connected
        if (!this.connectedToSFU) {
            // Request token from backend
            try {
                const tokenRes = await fetch(`/api/livekit-token?roomId=${this.roomId}`);
                const tokenJson = await tokenRes.json();
                const { token, wsUrl } = tokenJson;
                await this.sfuClient.connect(this.roomId, token, { wsUrl, background: true });
            } catch (err) {
                this.log({ event: "SFU:CONNECT_FAIL", error: String(err) });
                return;
            }
        }
        // Publish local tracks (atomic publish)
        try {
            await this.sfuClient.publishTracks(this.localStream);
            // Notify server that we are ready (ACK)
            this.socket.emit(SignalingEvents.MIGRATION_ACK);
            this.log({ event: "MIGRATION:ACK_SENT", roomId: this.roomId });
        } catch (err) {
            this.log({ event: "SFU:PUBLISH_FAIL", error: String(err) });
        }
    }

    private async handleMigrationToP2P() {
        // Recreate P2P mesh with existing participants: server will send USER_JOINED events as peers appear,
        // but we proactively notify server via ROOM_STATE handling and allow USER_JOINED to trigger P2P offers.
        // After establishing P2P mesh, emit P2P_READY (server expects client P2P_READY via signaling? server uses timeout)
        // We'll simply log and allow server to drop SFU once mesh is formed
        this.log({ event: "MIGRATION:START_P2P", roomId: this.roomId });
        // Let server coordinate; after P2P connections are established clients will resume normal P2P flow.
    }

    private async unpublishFromSFU() {
        if (!this.sfuClient) return;
        await this.sfuClient.unpublishAll();
        this.log({ event: "SFU:UNPUBLISHED", roomId: this.roomId });
    }

    // --- Chat and Controls ---
    sendChatMessage(text: string) {
        if (!this.roomId || !this.user) return;

        const message = {
            id: Math.random().toString(36).substring(7),
            senderId: this.user.id,
            senderName: this.user.name,
            text,
            timestamp: Date.now(),
            roomId: this.roomId
        };

        this.socket.emit(SignalingEvents.CHAT_MESSAGE, message);
        this.log({ event: "CHAT:SENT", text });
    }

    raiseHand(isRaised: boolean) {
        if (!this.roomId) return;

        this.socket.emit(SignalingEvents.RAISE_HAND, {
            roomId: this.roomId,
            socketId: this.socket.id,
            isRaised
        });
        this.log({ event: "HAND:RAISED", isRaised });
    }

    toggleMute(isMuted: boolean) {
        if (!this.roomId) return;

        this.socket.emit(SignalingEvents.TRACK_MUTED, {
            roomId: this.roomId,
            isMuted
        });
        this.log({ event: "TRACK:MUTE_TOGGLED", isMuted });
    }

    toggleVideo(isVideoOff: boolean) {
        if (!this.roomId) return;

        this.socket.emit(SignalingEvents.TRACK_VIDEO_OFF, {
            roomId: this.roomId,
            isVideoOff
        });
        this.log({ event: "TRACK:VIDEO_TOGGLED", isVideoOff });
    }

    updateName(newName: string) {
        if (!this.roomId) return;

        const trimmedName = newName.trim();
        if (trimmedName.length === 0 || trimmedName.length > 50) {
            this.log({ event: "NAME:INVALID", newName });
            return;
        }

        // Update local user name
        this.user.name = trimmedName;

        // Emit to server
        const payload: UserNameChangePayload = {
            roomId: this.roomId,
            socketId: this.socket.id || "",
            newName: trimmedName
        };

        this.socket.emit(SignalingEvents.USER_NAME_CHANGED, payload);
        this.log({ event: "NAME:CHANGED", newName: trimmedName });
    }

    // --- Cleanup ---
    async leave() {
        try {
            this.dropAllP2PPeers();
            if (this.sfuClient) await this.sfuClient.close();
            this.socket.emit(SignalingEvents.LEAVE, { roomId: this.roomId, user: this.user });
            this.socket.disconnect();
            this.log({ event: "SIGNAL:LEFT", roomId: this.roomId });
        } catch (err) {
            this.log({ event: "LEAVE:ERROR", error: String(err) });
        }
    }
}
