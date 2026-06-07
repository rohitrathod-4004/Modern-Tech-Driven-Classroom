"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Keyboard, Plus } from "lucide-react";
import { generateMeetingId } from "@/lib/generateMeetingId";

export default function Home() {
    const router = useRouter();
    const [meetingId, setMeetingId] = useState("");

    const handleCreateMeeting = () => {
        const newId = generateMeetingId();
        router.push(`/prejoin/${newId}`);
    };

    const handleJoinMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        if (meetingId.trim()) {
            router.push(`/prejoin/${meetingId.trim()}`);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Secure P2P & SFU Video Conferencing
                        </h1>
                        <p className="text-xl text-gray-400">
                            Premium quality video meetings. Now free for everyone.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleCreateMeeting}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-600/25"
                        >
                            <Plus size={20} />
                            New Meeting
                        </button>

                        <form onSubmit={handleJoinMeeting} className="flex gap-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Keyboard size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter a code or link"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    className="pl-10 pr-4 py-3 rounded-lg border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!meetingId.trim()}
                                className="text-blue-400 hover:bg-blue-900/30 disabled:text-gray-600 disabled:hover:bg-transparent px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Join
                            </button>
                        </form>
                    </div>

                    <div className="pt-8 border-t border-gray-800">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-400">Learn more</span> about our
                            hybrid P2P/SFU architecture and security features.
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center justify-center">
                    {/* Abstract visual representation of P2P/SFU */}
                    <div className="relative w-80 h-80">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl rotate-3 opacity-20 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600 to-purple-600 rounded-2xl -rotate-3 opacity-20 animate-pulse delay-75"></div>
                        <div className="absolute inset-4 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center shadow-2xl">
                            <Video size={64} className="text-blue-400" />
                        </div>

                        {/* Orbiting nodes */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-green-400">P2P</span>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-blue-400">SFU</span>
                        </div>
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-purple-400">SEC</span>
                        </div>
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-yellow-400">LOG</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
