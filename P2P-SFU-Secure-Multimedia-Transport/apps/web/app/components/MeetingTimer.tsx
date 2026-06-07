import React, { useState, useEffect } from "react";

interface MeetingTimerProps {
    startTime?: number;
}

export default function MeetingTimer({ startTime }: MeetingTimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = startTime || Date.now();

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const formatTime = () => {
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-mono">{formatTime()}</span>
        </div>
    );
}
