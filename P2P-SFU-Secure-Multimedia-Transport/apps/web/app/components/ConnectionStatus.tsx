import React from "react";
import { Network } from "lucide-react";

interface ConnectionStatusProps {
    mode: "P2P" | "SFU";
    iceConnectionState?: string;
    usingTurn?: boolean;
}

export default function ConnectionStatus({ mode, iceConnectionState, usingTurn }: ConnectionStatusProps) {
    return (
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <Network size={16} className={mode === "P2P" ? "text-green-400" : "text-blue-400"} />
            <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{mode} MODE</span>
                <span className="text-[10px] text-gray-300">
                    {usingTurn ? "TURN RELAY" : "DIRECT/STUN"} • {iceConnectionState || "Connected"}
                </span>
            </div>
        </div>
    );
}
