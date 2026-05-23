// apps/web/src/HybridManager.ts
/**
 * HybridManager
 * - Manages P2P mesh using simple-peer + migration to/from SFU (SFUClient)
 * - Matches server-side signaling contract (SignalingEvents).
 *
 * Usage:
 * const mgr = new HybridManager({ socket, localStream, user, onRemoteStream, onStateChange });
 * await mgr.joinRoom(roomId);
 */

import SimplePeer from "simple-peer";
import io, { Socket } from "socket.io-client";
import { SignalingEvents, JoinPayload, P2PSignalPayload, Participant, SHARED_CONSTANTS } from "@p2p-sfu/shared";
import SFUClient from "../app/sfu/SFUClient"; // Adjust path as needed based on file location

type Callbacks = {
    onRemoteStream?: (socketId: string, stream: MediaStream) => void;
    onPeerConnected?: (socketId: string) => void;
    onPeerDisconnected?: (socketId: string) => void;
    onModeChange?: (mode: "P2P" | "SFU") => void;
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

    constructor(socketUrl: string, user: { id: string; name: string }, callbacks?: Callbacks) {
        this.socket = io(socketUrl, { autoConnect: false });
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
        const payload: JoinPayload = { roomId, user: this.user };
        this.socket.connect();
        this.socket.emit(SignalingEvents.JOIN, payload);
        this.log({ event: "SIGNAL:JOINED", roomId, userId: this.user.id });
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
            onError: (err) => {
                this.log({ event: "SFU:ERROR", error: String(err) });
            }
        });
    }

    private bindSocket() {
        this.socket.on(SignalingEvents.ROOM_STATE, (room: any) => {
            this.log({ event: "ROOM_STATE", roomId: room.roomId, mode: room.mode, count: room.participants.length });
            this.callbacks.onModeChange?.(room.mode);
            // If server says SFU and we are not connected, it will send MIGRATE_TO_SFU next
        });

        this.socket.on(SignalingEvents.USER_JOINED, (participant: Participant) => {
            this.log({ event: "SIGNAL:USER_JOINED", socketId: participant.socketId, name: participant.name });
            // Initiate P2P offer to new participant (we will create initiator peer)
            this.createPeerAndOffer(participant.socketId);
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
    }

    // --- P2P helpers ---
    private createPeerAndOffer(targetSocketId: string) {
        if (!this.localStream) return;
        if (this.peers.has(targetSocketId)) return;

        const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            stream: this.localStream,
            config: { iceServers: SHARED_CONSTANTS.DEFAULT_ICE_SERVERS as any }
        });

        this.setupPeerEvents(peer, targetSocketId);

        this.peers.set(targetSocketId, peer);
    }

    private async handleOffer(senderSocketId: string, offerSignal: any) {
        if (!this.localStream) return;
        if (this.peers.has(senderSocketId)) {
            // Already have a peer; signal into it
            const peer = this.peers.get(senderSocketId)!;
            peer.signal(offerSignal);
            return;
        }

        const peer = new SimplePeer({
            initiator: false,
            trickle: true,
            stream: this.localStream,
            config: { iceServers: SHARED_CONSTANTS.DEFAULT_ICE_SERVERS as any }
        });

        this.setupPeerEvents(peer, senderSocketId);
        peer.signal(offerSignal);
        this.peers.set(senderSocketId, peer);
    }

    private setupPeerEvents(peer: SimplePeer.Instance, remoteSocketId: string) {
        peer.on("signal", (signalData: any) => {
            // Emit offer/answer or ICE via server
            const isOffer = (signalData.type === "offer");
            const ev = isOffer ? SignalingEvents.P2P_OFFER : SignalingEvents.P2P_ANSWER;
            // Note: simple-peer lumps ICE and SDP in signal events; always send to target
            const payload: P2PSignalPayload = {
                targetSocketId: remoteSocketId,
                signal: signalData
            };
            this.socket.emit(ev, payload);
            this.log({ event: "P2P:SIGNAL_EMIT", to: remoteSocketId, type: ev });
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
                const token = tokenJson.token;
                await this.sfuClient.connect(this.roomId, token, { background: true });
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
        this.log({ event: "MIGRATION:START_P2P", roomId: this.roomId });

        // The server will re-broadcast USER_JOINED events for all existing participants
        // Our existing USER_JOINED handler will create P2P connections automatically
        // We just need to ensure we're ready to accept P2P connections

        // Ensure local stream is still available
        if (!this.localStream) {
            this.log({ event: "MIGRATION:ERROR", error: "No local stream available" });
            return;
        }

        // Clear any stale P2P connections from before SFU migration
        this.dropAllP2PPeers();

        // Update mode callback
        this.callbacks.onModeChange?.("P2P");

        this.log({ event: "MIGRATION:P2P_READY", roomId: this.roomId });
    }

    private async unpublishFromSFU() {
        if (!this.sfuClient) return;
        await this.sfuClient.unpublishAll();
        this.log({ event: "SFU:UNPUBLISHED", roomId: this.roomId });
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

export default HybridManager;
