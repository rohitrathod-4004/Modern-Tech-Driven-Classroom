"use client";

import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { HybridManager } from "@/lib/rtc/HybridManager";
import { RoomState } from "@p2p-sfu/shared";

interface VideoRoomProps {
    roomId: string;
    userId: string;
    userName: string;
}

export default function VideoRoom({ roomId, userId, userName }: VideoRoomProps) {
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const hybridManagerRef = useRef<HybridManager | null>(null);

    useEffect(() => {
        const init = async () => {
            // Get User Media
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Connect Socket
            const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

            // Join Room
            socket.emit("join", {
                roomId,
                user: { id: userId, name: userName },
                token: "dummy-token", // TODO: Auth
            });

            // Init Hybrid Manager
            const manager = new HybridManager(
                socket,
                roomId,
                (state) => setRoomState(state),
                (stream, peerId) => {
                    setRemoteStreams((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(peerId, stream);
                        return newMap;
                    });
                }
            );

            await manager.init(stream);
            hybridManagerRef.current = manager;
        };

        init();

        return () => {
            hybridManagerRef.current?.cleanup();
        };
    }, [roomId, userId, userName]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Room: {roomId}</h1>
                <div className="bg-gray-800 px-3 py-1 rounded">
                    Mode: <span className="font-bold text-green-400">{roomState?.mode || "Connecting..."}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                {/* Local Video */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2 border-blue-500">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">You</div>
                </div>

                {/* Remote Videos */}
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
                ))}
            </div>
        </div>
    );
}

function RemoteVideo({ peerId, stream }: { peerId: string; stream: MediaStream }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">Peer: {peerId.slice(0, 4)}</div>
        </div>
    );
}
