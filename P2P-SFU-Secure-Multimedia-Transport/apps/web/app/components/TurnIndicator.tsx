import React from "react";
import { Wifi, WifiOff } from "lucide-react";

interface TurnIndicatorProps {
    usingTurn: boolean;
}

export default function TurnIndicator({ usingTurn }: TurnIndicatorProps) {
    if (!usingTurn) return null;

    return (
        <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/30 px-2 py-1 rounded-full text-xs text-yellow-200">
            <Wifi size={12} />
            <span>Relayed</span>
        </div>
    );
}
