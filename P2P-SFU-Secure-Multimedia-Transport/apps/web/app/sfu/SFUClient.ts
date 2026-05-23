import { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, Track } from "livekit-client";

type SFUHandlers = {
    onConnected?: () => void;
    onPublished?: () => void;
    onRemoteTrack?: (track: Track, participant: RemoteParticipant) => void;
    onParticipantConnected?: (participant: RemoteParticipant) => void;
    onParticipantDisconnected?: (participant: RemoteParticipant) => void;
    onError?: (err: any) => void;
};

export default class SFUClient {
    private room: Room | null = null;
    private roomId: string | null = null;
    private handlers: SFUHandlers = {};
    private connected = false;

    constructor() {
        this.room = new Room();
    }

    subscribeHandlers(handlers: SFUHandlers) {
        this.handlers = handlers;
    }

    async connect(roomId: string, token: string, opts?: { wsUrl?: string, background?: boolean }) {
        if (!this.room) {
            this.room = new Room();
        }

        this.roomId = roomId;
        const wsUrl = opts?.wsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

        this.log({ event: "SFU:CONNECT_START", roomId, wsUrl });

        try {
            // Setup event listeners before connecting
            this.setupRoomEvents();

            // Connect to LiveKit room
            await this.room.connect(wsUrl, token);

            this.connected = true;
            this.log({ event: "SFU:CONNECTED", roomId, participants: this.room.numParticipants });
            this.handlers.onConnected?.();

        } catch (err) {
            this.log({ event: "SFU:CONNECT_ERROR", error: String(err) });
            this.handlers.onError?.(err);
            throw err;
        }
    }

    private setupRoomEvents() {
        if (!this.room) return;

        // Handle remote tracks
        this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            this.log({
                event: "SFU:TRACK_SUBSCRIBED",
                participantId: participant.identity,
                trackKind: track.kind
            });
            this.handlers.onRemoteTrack?.(track, participant);
        });

        // Handle participant connections
        this.room.on(RoomEvent.ParticipantConnected, (participant) => {
            this.log({ event: "SFU:PARTICIPANT_CONNECTED", participantId: participant.identity });
            this.handlers.onParticipantConnected?.(participant);
        });

        this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            this.log({ event: "SFU:PARTICIPANT_DISCONNECTED", participantId: participant.identity });
            this.handlers.onParticipantDisconnected?.(participant);
        });

        // Handle disconnection
        this.room.on(RoomEvent.Disconnected, () => {
            this.log({ event: "SFU:DISCONNECTED", roomId: this.roomId });
            this.connected = false;
        });

        // Handle errors
        this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
            this.log({ event: "SFU:CONNECTION_STATE", state });
        });
    }

    async publishTracks(stream: MediaStream) {
        if (!this.connected || !this.room) {
            throw new Error("SFU not connected");
        }

        this.log({ event: "SFU:PUBLISH_START", roomId: this.roomId });

        try {
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            if (videoTrack) {
                await this.room.localParticipant.publishTrack(videoTrack, {
                    name: "camera",
                    simulcast: true,
                });
                this.log({ event: "SFU:VIDEO_PUBLISHED" });
            }

            if (audioTrack) {
                await this.room.localParticipant.publishTrack(audioTrack, {
                    name: "microphone",
                });
                this.log({ event: "SFU:AUDIO_PUBLISHED" });
            }

            this.handlers.onPublished?.();
        } catch (err) {
            this.log({ event: "SFU:PUBLISH_ERROR", error: String(err) });
            this.handlers.onError?.(err);
            throw err;
        }
    }

    async unpublishAll() {
        if (!this.connected || !this.room) return;

        this.log({ event: "SFU:UNPUBLISH_START", roomId: this.roomId });

        try {
            const localParticipant = this.room.localParticipant;

            // Unpublish all tracks
            const trackPublications = Array.from(localParticipant.trackPublications.values());

            for (const publication of trackPublications) {
                if (publication.track) {
                    await localParticipant.unpublishTrack(publication.track);
                }
            }

            this.log({ event: "SFU:UNPUBLISHED", roomId: this.roomId });
        } catch (err) {
            this.log({ event: "SFU:UNPUBLISH_ERROR", error: String(err) });
        }
    }

    async close() {
        if (!this.room) return;

        this.log({ event: "SFU:CLOSE_START", roomId: this.roomId });

        try {
            await this.room.disconnect();
            this.connected = false;
            this.log({ event: "SFU:CLOSED", roomId: this.roomId });
        } catch (err) {
            this.log({ event: "SFU:CLOSE_ERROR", error: String(err) });
        }
    }

    getRoom(): Room | null {
        return this.room;
    }

    isConnected(): boolean {
        return this.connected;
    }

    private log(obj: any) {
        console.log(JSON.stringify({ ts: Date.now(), ...obj }));
    }
}
