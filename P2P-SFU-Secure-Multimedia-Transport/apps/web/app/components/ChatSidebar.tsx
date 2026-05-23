import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { formatTimestamp } from "@/lib/formatTimestamp";

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
}

export default function ChatSidebar({ isOpen, onClose, messages, onSendMessage }: ChatSidebarProps) {
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText("");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full absolute right-0 top-0 z-20 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">In-call messages</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No messages yet.</p>
                        <p className="text-sm">Messages can only be seen by people in the call.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{msg.senderName}</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 break-words">{msg.text}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send a message"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 disabled:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
