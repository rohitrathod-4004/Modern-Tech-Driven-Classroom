"use client";

import React, { useEffect, useRef, useState } from "react";
import { Video, Mic, MicOff, VideoOff, ArrowRight } from "lucide-react";

interface PreJoinScreenProps {
    roomId: string;
    onJoin: (name: string, stream: MediaStream) => void;
}

export default function PreJoinScreen({ roomId, onJoin }: PreJoinScreenProps) {
    const [name, setName] = useState("");
    const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to get media:", err);
                setError("Failed to access camera/microphone. Please check permissions.");
            }
        };

        initMedia();

        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleJoin = () => {
        if (name.trim() && localStream) {
            onJoin(name.trim(), localStream);
        }
    };

    const isNameValid = name.trim().length > 0 && name.trim().length <= 50;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Ready to join?</h1>
                    <p className="text-gray-400">Room: {roomId}</p>
                </div>

                <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Video Preview */}
                        <div className="space-y-4">
                            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                                {error ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
                                        {error}
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        {isVideoOff && (
                                            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl font-bold">
                                                        {name.charAt(0).toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Media Controls */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={toggleMute}
                                    disabled={!localStream}
                                    className={`p-4 rounded-full transition-all ${isMuted
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-gray-700 hover:bg-gray-600"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    disabled={!localStream}
                                    className={`p-4 rounded-full transition-all ${isVideoOff
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-gray-700 hover:bg-gray-600"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="flex flex-col justify-center space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && isNameValid && localStream) {
                                            handleJoin();
                                        }
                                    }}
                                    placeholder="Enter your name"
                                    maxLength={50}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <div className="mt-2 flex justify-between text-sm">
                                    <span className={name.trim().length === 0 ? "text-gray-500" : "text-gray-400"}>
                                        {name.trim().length === 0 ? "Name is required" : ""}
                                    </span>
                                    <span className="text-gray-500">{name.length}/50</span>
                                </div>
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={!isNameValid || !localStream}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-600/25 disabled:shadow-none"
                            >
                                Join Meeting
                                <ArrowRight size={20} />
                            </button>

                            <div className="pt-4 border-t border-gray-700">
                                <p className="text-sm text-gray-400">
                                    By joining, you agree to share your camera and microphone with other participants.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
