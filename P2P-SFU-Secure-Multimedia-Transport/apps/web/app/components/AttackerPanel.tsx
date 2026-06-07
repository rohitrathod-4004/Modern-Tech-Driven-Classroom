import React, { useState } from "react";
import { X, ShieldAlert, Activity, Terminal } from "lucide-react";
import { formatTimestamp } from "@/lib/formatTimestamp";

interface LogEntry {
    ts: number;
    event: string;
    [key: string]: any;
}

interface AttackerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
    onSimulateAttack: () => void;
}

export default function AttackerPanel({ isOpen, onClose, logs, onSimulateAttack }: AttackerPanelProps) {
    const [isAttacking, setIsAttacking] = useState(false);

    const handleAttack = async () => {
        setIsAttacking(true);
        await onSimulateAttack();
        setTimeout(() => setIsAttacking(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full absolute right-0 top-0 z-30 shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-red-900/20">
                <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert size={20} />
                    <h2 className="text-lg font-semibold">Security Panel</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Activity size={16} /> Attack Simulation
                </h3>
                <button
                    onClick={handleAttack}
                    disabled={isAttacking}
                    className={`w-full py-2 px-4 rounded font-medium transition-all ${isAttacking
                            ? "bg-red-800 text-red-200 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-900/50"
                        }`}
                >
                    {isAttacking ? "Simulating Attack..." : "Simulate ICE Injection"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                    Triggers a fake ICE candidate injection to test rate limiting and security logging.
                </p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-2 bg-black border-b border-gray-800 flex items-center gap-2 text-gray-400 text-xs font-mono uppercase tracking-wider">
                    <Terminal size={12} />
                    Security Logs
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-black text-green-400">
                    {logs.length === 0 ? (
                        <div className="text-gray-600 italic p-2">No logs captured yet...</div>
                    ) : (
                        logs.slice().reverse().map((log, i) => (
                            <div key={i} className="break-all border-b border-gray-900/50 pb-1 mb-1">
                                <span className="text-gray-500">[{formatTimestamp(log.ts)}]</span>{" "}
                                <span className={log.event.includes("SECURITY") ? "text-red-400 font-bold" : "text-blue-300"}>
                                    {log.event}
                                </span>
                                <div className="text-gray-400 pl-4 opacity-80">
                                    {JSON.stringify(log, (key, value) => {
                                        if (key === "ts" || key === "event") return undefined;
                                        return value;
                                    }).replace(/^{|}$/g, "")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
