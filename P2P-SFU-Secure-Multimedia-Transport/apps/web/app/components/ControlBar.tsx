import React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Hand, MessageSquare, ShieldAlert } from "lucide-react";

interface ControlBarProps {
    isMuted: boolean;
    isVideoOff: boolean;
    isHandRaised: boolean;
    showChat: boolean;
    showSecurity: boolean;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onToggleHand: () => void;
    onToggleChat: () => void;
    onToggleSecurity: () => void;
    onLeave: () => void;
}

export default function ControlBar({
    isMuted,
    isVideoOff,
    isHandRaised,
    showChat,
    showSecurity,
    onToggleMute,
    onToggleVideo,
    onToggleHand,
    onToggleChat,
    onToggleSecurity,
    onLeave,
}: ControlBarProps) {
    return (
        <div className="h-16 md:h-20 bg-gray-900 flex items-center justify-center gap-2 md:gap-4 px-2 md:px-4 border-t border-gray-800">
            <button
                onClick={onToggleMute}
                className={`p-3 md:p-4 rounded-full transition-colors ${isMuted ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <MicOff size={20} className="md:w-6 md:h-6" /> : <Mic size={20} className="md:w-6 md:h-6" />}
            </button>

            <button
                onClick={onToggleVideo}
                className={`p-3 md:p-4 rounded-full transition-colors ${isVideoOff ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
                {isVideoOff ? <VideoOff size={20} className="md:w-6 md:h-6" /> : <Video size={20} className="md:w-6 md:h-6" />}
            </button>

            <button
                onClick={onToggleHand}
                className={`p-3 md:p-4 rounded-full transition-colors ${isHandRaised ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                title="Raise Hand"
            >
                <Hand size={20} className="md:w-6 md:h-6" />
            </button>

            <button
                onClick={onToggleChat}
                className={`p-3 md:p-4 rounded-full transition-colors ${showChat ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                title="Chat"
            >
                <MessageSquare size={20} className="md:w-6 md:h-6" />
            </button>

            {/* Hide security button on mobile to save space */}
            <button
                onClick={onToggleSecurity}
                className={`hidden sm:flex p-3 md:p-4 rounded-full transition-colors ${showSecurity ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                title="Security Panel"
            >
                <ShieldAlert size={20} className="md:w-6 md:h-6" />
            </button>

            <button
                onClick={onLeave}
                className="p-3 md:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white ml-2 md:ml-4"
                title="Leave Call"
            >
                <PhoneOff size={20} className="md:w-6 md:h-6" />
            </button>
        </div>
    );
}
