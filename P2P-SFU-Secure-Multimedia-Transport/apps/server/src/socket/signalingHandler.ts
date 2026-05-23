import { Server, Socket } from "socket.io";
import { RoomManager } from "../services/RoomManager";
import { SHARED_CONSTANTS, SignalingEvents, JoinPayload, P2PSignalPayload, UserNameChangePayload } from "@p2p-sfu/shared";
import pino from "pino";

const logger = pino();

export class SignalingHandler {
    private roomManager: RoomManager;
    private io: Server;
    // Track migration ACKs: roomId -> Set<socketId>
    private migrationAcks: Map<string, Set<string>> = new Map();

    constructor(io: Server, roomManager: RoomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }

    handleConnection(socket: Socket) {
        socket.on(SignalingEvents.JOIN, (payload: JoinPayload) => this.handleJoin(socket, payload));

        // P2P Signaling
        socket.on(SignalingEvents.P2P_OFFER, (payload: P2PSignalPayload) => this.handleP2PSignal(socket, payload, SignalingEvents.P2P_OFFER));
        socket.on(SignalingEvents.P2P_ANSWER, (payload: P2PSignalPayload) => this.handleP2PSignal(socket, payload, SignalingEvents.P2P_ANSWER));
        socket.on(SignalingEvents.P2P_ICE_CANDIDATE, (payload: P2PSignalPayload) => this.handleP2PSignal(socket, payload, SignalingEvents.P2P_ICE_CANDIDATE));

        // Chat and Controls
        socket.on(SignalingEvents.CHAT_MESSAGE, (message: any) => this.handleChatMessage(socket, message));
        socket.on(SignalingEvents.RAISE_HAND, (payload: any) => this.handleRaiseHand(socket, payload));
        socket.on(SignalingEvents.TRACK_MUTED, (payload: any) => this.handleTrackMuted(socket, payload));
        socket.on(SignalingEvents.TRACK_VIDEO_OFF, (payload: any) => this.handleTrackVideoOff(socket, payload));
        socket.on(SignalingEvents.USER_NAME_CHANGED, (payload: UserNameChangePayload) => this.handleNameChange(socket, payload));

        // Migration
        socket.on(SignalingEvents.MIGRATION_ACK, () => this.handleMigrationAck(socket));

        socket.on(SignalingEvents.LEAVE, () => this.handleDisconnect(socket));
        socket.on("disconnect", () => this.handleDisconnect(socket));
    }

    private handleJoin(socket: Socket, payload: JoinPayload) {
        const { roomId, user } = payload;

        // TODO: Validate Token (Security Module)
        // if (!validateToken(payload.token)) {
        //    socket.emit(SignalingEvents.SECURITY_INVALID_TOKEN);
        //    socket.disconnect();
        //    return;
        // }

        socket.join(roomId);

        const participant = {
            id: user.id,
            name: user.name,
            socketId: socket.id,
            isPublishingToSFU: false
        };

        const room = this.roomManager.addParticipant(roomId, participant);

        logger.info(`User ${user.name} joined room ${roomId}. Mode: ${room.mode}. Count: ${room.participants.length}`);

        // Broadcast to others that a user joined
        socket.to(roomId).emit(SignalingEvents.USER_JOINED, participant);

        // Send current room state to the new user
        socket.emit(SignalingEvents.ROOM_STATE, room);

        // Check for Migration Trigger
        this.checkMigration(roomId);
    }

    private handleP2PSignal(socket: Socket, payload: P2PSignalPayload, eventType: SignalingEvents) {
        const { targetSocketId, signal } = payload;

        // Security: Ensure target is in the same room? (Optional but good)

        // Forward signal to specific target
        this.io.to(targetSocketId).emit(eventType, {
            signal,
            senderSocketId: socket.id
        });
    }

    private handleMigrationAck(socket: Socket) {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room) return;

        if (!this.migrationAcks.has(room.roomId)) {
            this.migrationAcks.set(room.roomId, new Set());
        }
        this.migrationAcks.get(room.roomId)?.add(socket.id);

        logger.info(`Migration ACK from ${socket.id} in room ${room.roomId}`);

        // Check if all participants have ACKed
        const acks = this.migrationAcks.get(room.roomId)!;
        const allAcked = room.participants.every((p: any) => acks.has(p.socketId));

        if (allAcked && room.mode === "SFU") {
            logger.info(`All participants ACKed migration to SFU in room ${room.roomId}. Dropping P2P.`);
            this.io.to(room.roomId).emit(SignalingEvents.DROP_P2P);
            this.migrationAcks.delete(room.roomId); // Cleanup
        }
    }

    private handleDisconnect(socket: Socket) {
        const room = this.roomManager.removeParticipant(socket.id);
        if (room) {
            logger.info(`User disconnected from room ${room.roomId}. Remaining: ${room.participants.length}`);
            socket.to(room.roomId).emit(SignalingEvents.USER_LEFT, { socketId: socket.id });
            this.checkMigration(room.roomId);
        }
    }

    private checkMigration(roomId: string) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const count = room.participants.length;

        // P2P -> SFU
        if (count > SHARED_CONSTANTS.MAX_P2P_PARTICIPANTS && room.mode === "P2P") {
            logger.info(`Room ${roomId} migrating to SFU (Count: ${count})`);
            this.roomManager.updateRoomMode(roomId, "SFU");
            this.io.to(roomId).emit(SignalingEvents.MIGRATE_TO_SFU);

            // Initialize ACK tracking
            this.migrationAcks.set(roomId, new Set());

            // Timeout fallback
            setTimeout(() => {
                const currentRoom = this.roomManager.getRoom(roomId);
                if (currentRoom && currentRoom.mode === "SFU" && this.migrationAcks.has(roomId)) {
                    logger.warn(`Migration timeout for room ${roomId}. Forcing DROP_P2P.`);
                    this.io.to(roomId).emit(SignalingEvents.DROP_P2P);
                    this.migrationAcks.delete(roomId);
                }
            }, SHARED_CONSTANTS.MIGRATION_TIMEOUT_MS);
        }
        // SFU -> P2P
        else if (count <= SHARED_CONSTANTS.MAX_P2P_PARTICIPANTS && room.mode === "SFU") {
            logger.info(`Room ${roomId} migrating to P2P (Count: ${count})`);
            this.roomManager.updateRoomMode(roomId, "P2P");
            this.io.to(roomId).emit(SignalingEvents.MIGRATE_TO_P2P);

            // Re-broadcast all participants to help clients re-establish P2P mesh
            // Each client will receive USER_JOINED for all OTHER participants
            room.participants.forEach((participant: any) => {
                this.io.to(roomId).except(participant.socketId).emit(
                    SignalingEvents.USER_JOINED,
                    participant
                );
            });

            // Wait for mesh establishment then drop SFU
            setTimeout(() => {
                this.io.to(roomId).emit(SignalingEvents.DROP_SFU_PUBLICATION);
            }, 3000); // Increased from 2000ms to 3000ms for better reliability
        }
    }

    private handleChatMessage(_socket: Socket, message: any) {
        const { roomId } = message;
        if (!roomId) return;

        logger.info(`Chat message in room ${roomId} from ${message.senderName}`);

        // Broadcast to all participants in the room (including sender for confirmation)
        this.io.to(roomId).emit(SignalingEvents.CHAT_MESSAGE, message);
    }

    private handleRaiseHand(_socket: Socket, payload: any) {
        const { roomId, socketId, isRaised } = payload;
        if (!roomId) return;

        logger.info(`Hand ${isRaised ? 'raised' : 'lowered'} in room ${roomId} by ${socketId}`);

        // Broadcast to all participants in the room
        this.io.to(roomId).emit(SignalingEvents.RAISE_HAND, { socketId, isRaised });
    }

    private handleTrackMuted(socket: Socket, payload: any) {
        const { roomId, isMuted } = payload;
        if (!roomId) return;

        logger.info(`Track muted in room ${roomId} by ${socket.id}: ${isMuted}`);

        // Broadcast to all participants in the room
        this.io.to(roomId).emit(SignalingEvents.TRACK_MUTED, {
            socketId: socket.id,
            isMuted
        });
    }

    private handleTrackVideoOff(socket: Socket, payload: any) {
        const { roomId, isVideoOff } = payload;
        if (!roomId) return;

        logger.info(`Video toggled in room ${roomId} by ${socket.id}: ${isVideoOff}`);

        // Broadcast to all participants in the room
        this.io.to(roomId).emit(SignalingEvents.TRACK_VIDEO_OFF, {
            socketId: socket.id,
            isVideoOff
        });
    }

    private handleNameChange(socket: Socket, payload: UserNameChangePayload) {
        const { roomId, newName } = payload;
        if (!roomId || !newName) return;

        // Validate name
        const trimmedName = newName.trim();
        if (trimmedName.length === 0 || trimmedName.length > 50) {
            logger.warn(`Invalid name change attempt in room ${roomId} by ${socket.id}`);
            return;
        }

        // Update participant name in room manager
        const room = this.roomManager.updateParticipantName(socket.id, trimmedName);
        if (!room) {
            logger.warn(`Failed to update name for ${socket.id} - room not found`);
            return;
        }

        logger.info(`Name changed in room ${roomId} by ${socket.id} to "${trimmedName}"`);

        // Broadcast name change to all participants in the room
        this.io.to(roomId).emit(SignalingEvents.USER_NAME_CHANGED, {
            socketId: socket.id,
            newName: trimmedName
        });
    }
}
