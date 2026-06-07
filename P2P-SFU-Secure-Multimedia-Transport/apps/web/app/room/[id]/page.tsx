"use client";

import "../../polyfills"; // Must be first
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { HybridManager } from "../../HybridManager";
import VideoTile from "../../components/VideoTile";
import ControlBar from "../../components/ControlBar";
import ChatSidebar from "../../components/ChatSidebar";
import ParticipantsSidebar from "../../components/ParticipantsSidebar";
import ConnectionStatus from "../../components/ConnectionStatus";
import AttackerPanel from "../../components/AttackerPanel";
import RenameDialog from "../../components/RenameDialog";

interface RemoteStream {
    id: string;
    stream: MediaStream;
    name: string;
}

interface LogEntry {
    ts: number;
    event: string;
    [key: string]: any;
}

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    // State
    const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
    const [mode, setMode] = useState<"P2P" | "SFU">("P2P");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);

    // User State (Client-only to avoid hydration mismatch)
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);

    // UI State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);

    // Refs
    const managerRef = useRef<HybridManager | null>(null);

    // Get search params for name
    const searchParams = useSearchParams();

    // 1. Generate User ID on Mount (Client Only)
    useEffect(() => {
        const id = uuidv4();
        const nameFromUrl = searchParams.get('name');
        const userName = nameFromUrl || `User-${id.slice(0, 4)}`;
        setUser({ id, name: userName });
    }, [searchParams]);

    // 2. Initialize HybridManager once User & RoomId are ready
    useEffect(() => {
        if (!user || !roomId || managerRef.current) return;

        const init = async () => {
            try {
                // Get User Media
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);

                // Initialize HybridManager
                const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
                const manager = new HybridManager(
                    socketUrl,
                    user,
                    {
                        onRemoteStream: (socketId, stream) => {
                            setRemoteStreams((prev) => {
                                if (prev.find((s) => s.id === socketId)) return prev;
                                return [...prev, { id: socketId, stream, name: `User ${socketId.slice(0, 4)}` }];
                            });
                        },
                        onPeerConnected: (socketId) => {
                            setParticipants(prev => [...prev, { id: socketId, name: `User ${socketId.slice(0, 4)}` }]);
                        },
                        onPeerDisconnected: (socketId) => {
                            setRemoteStreams((prev) => prev.filter((s) => s.id !== socketId));
                            setParticipants(prev => prev.filter(p => p.id !== socketId));
                        },
                        onModeChange: (newMode) => {
                            setMode(newMode);
                        },
                        onChatMessage: (message) => {
                            setChatMessages((prev) => [...prev, message]);
                        },
                        onHandRaise: (socketId, isRaised) => {
                            setParticipants(prev => prev.map(p =>
                                p.id === socketId ? { ...p, handRaised: isRaised } : p
                            ));
                        },
                        onTrackMuted: (socketId, isMuted) => {
                            setParticipants(prev => prev.map(p =>
                                p.id === socketId ? { ...p, isMuted } : p
                            ));
                        },
                        onTrackVideoOff: (socketId, isVideoOff) => {
                            setParticipants(prev => prev.map(p =>
                                p.id === socketId ? { ...p, isVideoOff } : p
                            ));
                        },
                        onNameChanged: (socketId, newName) => {
                            setUser(prevUser => {
                                if (prevUser && managerRef.current?.selfSocketId === socketId) {
                                    return { ...prevUser, name: newName };
                                }
                                return prevUser;
                            });
                            setParticipants(prev => prev.map(p =>
                                p.id === socketId ? { ...p, name: newName + (p.isLocal ? " (You)" : "") } : p
                            ));
                            setRemoteStreams(prev => prev.map(s =>
                                s.id === socketId ? { ...s, name: newName } : s
                            ));
                        },
                        onLog: (log) => {
                            setLogs((prev) => [...prev, log]);
                        },
                    }
                );

                manager.setLocalStream(stream);
                await manager.joinRoom(roomId);
                managerRef.current = manager;

                // Add local participant
                setParticipants([{ id: user.id, name: user.name + " (You)", isLocal: true }]);

            } catch (err) {
                console.error("Failed to join room:", err);
                alert("Failed to access camera/microphone or join room.");
                router.push("/");
            }
        };

        init();

        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
            managerRef.current?.leave();
            managerRef.current = null;
        };
    }, [user, roomId, router]);

    // Toggle Functions
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            managerRef.current?.toggleMute(newMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
            const newVideoOff = !isVideoOff;
            setIsVideoOff(newVideoOff);
            managerRef.current?.toggleVideo(newVideoOff);
        }
    };

    const toggleHand = () => {
        const newState = !isHandRaised;
        setIsHandRaised(newState);
        managerRef.current?.raiseHand(newState);
    };

    const handleRename = (newName: string) => {
        if (!managerRef.current || !user) return;
        managerRef.current.updateName(newName);
        setUser({ ...user, name: newName });
        setParticipants(prev => prev.map(p =>
            p.isLocal ? { ...p, name: newName + " (You)" } : p
        ));
    };

    const handleSendMessage = (text: string) => {
        if (!managerRef.current) return;
        managerRef.current.sendChatMessage(text);
    };

    const handleSimulateAttack = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
            await fetch(`${backendUrl}/api/simulate-attacker`, {
                method: "POST",
            });
            // Log manually for immediate feedback in UI
            setLogs(prev => [...prev, { ts: Date.now(), event: "SECURITY:SIMULATION_TRIGGERED", details: "Manual trigger from UI" }]);
        } catch (e) {
            console.error("Attack simulation failed", e);
        }
    };

    const handleLeave = async () => {
        await managerRef.current?.leave();
        router.push("/");
    };

    if (!user) {
        return <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-16 flex items-center justify-between px-6 bg-transparent absolute top-0 left-0 right-0 z-10 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">
                    <div className="text-lg font-medium">{roomId}</div>
                    <ConnectionStatus mode={mode} usingTurn={false} /> {/* TODO: Get TURN status from manager */}
                </div>
                <div className="pointer-events-auto">
                    {/* Clock or other top-right items */}
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                <div className={`grid gap-4 w-full max-w-7xl ${remoteStreams.length === 0 ? "grid-cols-1" :
                    remoteStreams.length === 1 ? "grid-cols-2" :
                        "grid-cols-2 md:grid-cols-3"
                    }`}>
                    {/* Local Video */}
                    <VideoTile
                        stream={localStream}
                        name={user.name}
                        isLocal={true}
                        isMuted={isMuted}
                        isHandRaised={isHandRaised}
                        isVideoOff={isVideoOff}
                        onRename={() => setShowRenameDialog(true)}
                    />

                    {/* Remote Videos */}
                    {remoteStreams.map((remote) => {
                        const participant = participants.find(p => p.id === remote.id);
                        return (
                            <VideoTile
                                key={remote.id}
                                stream={remote.stream}
                                name={remote.name}
                                isMuted={participant?.isMuted}
                                isVideoOff={participant?.isVideoOff}
                                isHandRaised={participant?.handRaised}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Sidebars */}
            <ChatSidebar
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
            />

            <ParticipantsSidebar
                isOpen={false} // Hidden for now, can add toggle later
                onClose={() => setShowParticipants(false)}
                participants={participants}
            />

            <AttackerPanel
                isOpen={showSecurity}
                onClose={() => setShowSecurity(false)}
                logs={logs}
                onSimulateAttack={handleSimulateAttack}
            />

            {/* Rename Dialog */}
            <RenameDialog
                isOpen={showRenameDialog}
                currentName={user?.name || ""}
                onClose={() => setShowRenameDialog(false)}
                onRename={handleRename}
            />

            {/* Control Bar */}
            <ControlBar
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isHandRaised={isHandRaised}
                showChat={showChat}
                showSecurity={showSecurity}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onToggleHand={toggleHand}
                onToggleChat={() => setShowChat(!showChat)}
                onToggleSecurity={() => setShowSecurity(!showSecurity)}
                onLeave={handleLeave}
            />
        </div>
    );
}
