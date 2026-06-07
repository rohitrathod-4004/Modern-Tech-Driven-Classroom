import { RoomState, RoomMode, Participant } from "@p2p-sfu/shared";

export class RoomManager {
    private rooms: Map<string, RoomState> = new Map();
    private socketToRoom: Map<string, string> = new Map();

    createRoom(roomId: string): RoomState {
        const room: RoomState = {
            roomId,
            mode: "P2P",
            participants: [],
        };
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): RoomState | undefined {
        return this.rooms.get(roomId);
    }

    getRoomBySocketId(socketId: string): RoomState | undefined {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId) return undefined;
        return this.rooms.get(roomId);
    }

    addParticipant(roomId: string, participant: Participant): RoomState {
        let room = this.rooms.get(roomId);
        if (!room) {
            room = this.createRoom(roomId);
        }
        // Avoid duplicates by removing any previous connection session for the same user ID
        const existing = room.participants.find(p => p.id === participant.id);
        if (existing) {
            this.socketToRoom.delete(existing.socketId);
            room.participants = room.participants.filter(p => p.id !== participant.id);
        }
        room.participants.push(participant);
        this.socketToRoom.set(participant.socketId, roomId);
        // Mode update is handled by SignalingHandler via checkMigration, 
        // but we can keep state consistent here too.
        return room;
    }

    removeParticipant(socketId: string): RoomState | undefined {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId) return undefined;

        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        room.participants = room.participants.filter((p) => p.socketId !== socketId);
        this.socketToRoom.delete(socketId);

        if (room.participants.length === 0) {
            this.rooms.delete(roomId);
            return undefined;
        }

        return room;
    }

    updateRoomMode(roomId: string, mode: RoomMode) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.mode = mode;
        }
    }

    updateParticipantName(socketId: string, newName: string): RoomState | undefined {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId) return undefined;

        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        const participant = room.participants.find(p => p.socketId === socketId);
        if (participant) {
            participant.name = newName;
        }

        return room;
    }
}
