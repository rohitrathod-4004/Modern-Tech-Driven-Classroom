export enum SignalingEvents {
    // Connection
    JOIN = "join",
    LEAVE = "leave",

    // Room State
    ROOM_STATE = "room-state",
    USER_JOINED = "user-joined",
    USER_LEFT = "user-left",

    // P2P Signaling (Mesh)
    P2P_OFFER = "p2p-offer",
    P2P_ANSWER = "p2p-answer",
    P2P_ICE_CANDIDATE = "p2p-ice-candidate",

    // Features
    CHAT_MESSAGE = "chat-message",
    RAISE_HAND = "raise-hand",
    TRACK_MUTED = "track-muted",
    TRACK_VIDEO_OFF = "track-video-off",
    USER_NAME_CHANGED = "user-name-changed",

    // Migration
    MIGRATE_TO_SFU = "migrate-to-sfu",
    MIGRATE_TO_P2P = "migrate-to-p2p",
    MIGRATION_ACK = "migration-ack",
    PUBLISH_READY = "publish-ready",
    DROP_P2P = "drop-p2p",
    SFU_READY = "sfu-ready",
    DROP_SFU_PUBLICATION = "drop-sfu-publication",

    // Security / Errors
    SECURITY_INVALID_TOKEN = "security-invalid-token",
    SECURITY_RATE_LIMIT = "security-rate-limit",
    SECURITY_MALFORMED_PACKET = "security-malformed-packet",
}

export const SHARED_CONSTANTS = {
    APP_NAME: "P2P-SFU-Secure-Transport",
    MAX_P2P_PARTICIPANTS: 3,
    MIGRATION_TIMEOUT_MS: 7000,
    DEFAULT_ICE_SERVERS: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

export type RoomMode = "P2P" | "SFU";

export interface Participant {
    id: string;
    name: string;
    socketId: string;
    isPublishingToSFU: boolean;
}

export interface Room {
    roomId: string;
    mode: RoomMode;
    participants: Participant[];
}

export type RoomState = Room; // Alias for backward compatibility

export interface JoinPayload {
    roomId: string;
    user: { id: string; name: string; photoUrl?: string };
    token?: string;
}

export interface P2PSignalPayload {
    targetSocketId: string;
    signal: any;
}

// Payload received by clients (server adds senderSocketId, removes targetSocketId)
export interface P2PSignalReceivedPayload {
    senderSocketId: string;
    signal: any;
}

export interface ChatMessagePayload {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface MigrationAckPayload {
    roomId: string;
    mode: RoomMode;
}

export interface SecurityEventPayload {
    reason: string;
    timestamp: number;
}

export interface UserNameChangePayload {
    roomId: string;
    socketId: string;
    newName: string;
}
