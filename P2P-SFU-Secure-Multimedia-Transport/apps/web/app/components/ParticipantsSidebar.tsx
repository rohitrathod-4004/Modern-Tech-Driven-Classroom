import React from "react";
import { X, Mic, MicOff } from "lucide-react";

interface Participant {
    id: string;
    name: string;
    isMuted?: boolean;
}

interface ParticipantsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Participant[];
}

export default function ParticipantsSidebar({ isOpen, onClose, participants }: ParticipantsSidebarProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full absolute right-0 top-0 z-20 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">People ({participants.length})</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                        </div>
                        <div className="text-gray-500">
                            {p.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
