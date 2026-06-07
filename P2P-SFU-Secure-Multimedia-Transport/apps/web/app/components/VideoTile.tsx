import React, { useEffect, useRef } from "react";
import { MicOff, Hand, VideoOff, Pencil } from "lucide-react";

interface VideoTileProps {
    stream?: MediaStream;
    name: string;
    isLocal?: boolean;
    isMuted?: boolean;
    isHandRaised?: boolean;
    isVideoOff?: boolean;
    onRename?: () => void;
}

export default function VideoTile({
    stream,
    name,
    isLocal = false,
    isMuted = false,
    isHandRaised = false,
    isVideoOff = false,
    onRename,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Get initials for avatar
    const getInitials = (name: string) => {
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-lg group">
            {stream && !isVideoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // Always mute local video to prevent feedback
                    className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    {/* Avatar Circle */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg">
                        {getInitials(name)}
                    </div>

                    {/* Camera Off Icon */}
                    {isVideoOff && (
                        <div className="mt-4 flex items-center gap-2 text-gray-400 text-sm">
                            <VideoOff size={16} />
                            <span>Camera is off</span>
                        </div>
                    )}
                </div>
            )}

            {/* Name Label with Rename Button */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <div className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                    {name}
                </div>
                {isLocal && onRename && (
                    <button
                        onClick={onRename}
                        className="bg-black/50 hover:bg-black/70 p-1.5 rounded backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Change name"
                    >
                        <Pencil size={14} />
                    </button>
                )}
            </div>

            {/* Status Indicators (Top Right) */}
            <div className="absolute top-2 right-2 flex gap-2">
                {isMuted && (
                    <div className="bg-red-500/90 p-1.5 rounded-full text-white shadow-lg" title="Microphone muted">
                        <MicOff size={16} />
                    </div>
                )}
                {isHandRaised && (
                    <div className="bg-yellow-500/90 p-1.5 rounded-full text-white animate-pulse shadow-lg" title="Hand raised">
                        <Hand size={16} />
                    </div>
                )}
            </div>
        </div>
    );
}
