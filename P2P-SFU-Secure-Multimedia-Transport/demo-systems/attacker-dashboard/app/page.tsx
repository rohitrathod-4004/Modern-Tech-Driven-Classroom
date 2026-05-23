'use client';

import { useState, useEffect } from 'react';

type TargetSystem = 'vulnerable' | 'secure';
type AttackType = 'ice-injection' | 'dos-flood' | 'session-hijack' | 'packet-sniff';
type AttackStatus = 'idle' | 'running' | 'success' | 'blocked';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface CapturedPacket {
    timestamp: string;
    type: string;
    src: string;
    dst: string;
    payload: string;
    data: string;
    videoFrame?: string; // Base64 encoded image
}

export default function AttackerDashboard() {
    const [target, setTarget] = useState<TargetSystem>('vulnerable');
    const [attackStatus, setAttackStatus] = useState<AttackStatus>('idle');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentAttack, setCurrentAttack] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [capturedPackets, setCapturedPackets] = useState<CapturedPacket[]>([]);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const launchAttack = async (attackType: AttackType) => {
        setAttackStatus('running');
        setCurrentAttack(attackType);
        setProgress(0);

        const targetUrl = target === 'vulnerable'
            ? 'http://localhost:4002'
            : 'http://localhost:4000';

        addLog(`🎯 Target: ${target === 'vulnerable' ? 'Vulnerable System (Port 4002)' : 'Secure System (Port 4000)'}`, 'info');
        addLog(`🚀 Launching ${attackType.toUpperCase()} attack...`, 'warning');
        addLog(`⏳ Connecting to target server...`, 'info');

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const response = await fetch('http://localhost:4001/attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attackType, targetUrl })
            });

            clearInterval(progressInterval);
            setProgress(100);

            const result = await response.json();

            if (result.success) {
                setAttackStatus('success');
                addLog(`✅ ATTACK SUCCESSFUL!`, 'success');
                addLog(`📊 ${result.message}`, 'success');

                // Store captured packets if available
                if (result.packets) {
                    setCapturedPackets(result.packets);
                    addLog(`📦 ${result.packets.length} packets captured!`, 'success');
                }

                // Add dramatic effect messages
                if (attackType === 'ice-injection') {
                    addLog(`🚨 Media streams redirected to attacker IP!`, 'success');
                    addLog(`⚠️  Connection integrity compromised!`, 'warning');
                } else if (attackType === 'dos-flood') {
                    addLog(`💥 Server overwhelmed with requests!`, 'success');
                    addLog(`⚠️  System performance degraded!`, 'warning');
                } else if (attackType === 'session-hijack') {
                    addLog(`🎭 Unauthorized access to private room!`, 'success');
                    addLog(`⚠️  User data exposed!`, 'warning');
                } else if (attackType === 'packet-sniff') {
                    addLog(`👁️ Video/audio streams intercepted!`, 'success');
                    addLog(`⚠️  Unencrypted data captured!`, 'warning');
                }
            } else {
                setAttackStatus('blocked');
                addLog(`❌ ATTACK BLOCKED!`, 'error');
                addLog(`🛡️ ${result.message}`, 'error');
                addLog(`✅ Security measures working correctly!`, 'info');

                // Show encrypted packets if available
                if (result.packets) {
                    setCapturedPackets(result.packets);
                    addLog(`📦 ${result.packets.length} encrypted packets captured`, 'info');
                }
            }
        } catch (error) {
            clearInterval(progressInterval);
            setAttackStatus('blocked');
            addLog(`❌ Attack failed: Connection error`, 'error');
            addLog(`⚠️  Make sure attack simulator is running on port 4001`, 'warning');
        }

        setTimeout(() => {
            setAttackStatus('idle');
            setProgress(0);
        }, 5000);
    };

    const getStatusColor = () => {
        switch (attackStatus) {
            case 'running': return 'text-yellow-400 animate-pulse';
            case 'success': return 'text-green-400';
            case 'blocked': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusText = () => {
        switch (attackStatus) {
            case 'running': return `⚡ ${currentAttack.toUpperCase()} in progress... ${progress}%`;
            case 'success': return '✅ Attack successful - System compromised!';
            case 'blocked': return '❌ Attack blocked - Security active!';
            default: return '🟢 Ready to attack';
        }
    };

    const getAttackDescription = (type: AttackType) => {
        switch (type) {
            case 'ice-injection':
                return 'Inject fake ICE candidates to redirect media streams';
            case 'dos-flood':
                return 'Overwhelm server with 200+ connections';
            case 'session-hijack':
                return 'Steal session tokens and impersonate users';
            case 'packet-sniff':
                return 'Intercept and decode network traffic';
        }
    };

    return (
        <div className="min-h-screen bg-hacker-bg p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-danger-red mb-2 animate-pulse">
                        🔴 ATTACKER DASHBOARD
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">Security Attack Demonstration System</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Controls */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Target Selection */}
                        <div className="status-box">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-accent">
                                🎯 TARGET SELECTION
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setTarget('vulnerable')}
                                    disabled={attackStatus === 'running'}
                                    className={`flex-1 py-4 px-6 rounded-lg font-bold transition-all ${target === 'vulnerable'
                                        ? 'bg-danger-red text-white scale-105 shadow-lg shadow-red-500/50'
                                        : 'bg-hacker-secondary text-gray-400 hover:bg-gray-700'
                                        } disabled:opacity-50`}
                                >
                                    <div className="text-lg">⚠️ Vulnerable System</div>
                                    <div className="text-sm mt-1">Port 4002 - No Security</div>
                                </button>
                                <button
                                    onClick={() => setTarget('secure')}
                                    disabled={attackStatus === 'running'}
                                    className={`flex-1 py-4 px-6 rounded-lg font-bold transition-all ${target === 'secure'
                                        ? 'bg-success-green text-white scale-105 shadow-lg shadow-green-500/50'
                                        : 'bg-hacker-secondary text-gray-400 hover:bg-gray-700'
                                        } disabled:opacity-50`}
                                >
                                    <div className="text-lg">🛡️ Secure System</div>
                                    <div className="text-sm mt-1">Port 4000 - Full Security</div>
                                </button>
                            </div>
                        </div>

                        {/* Attack Types */}
                        <div className="status-box">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-accent">
                                💥 ATTACK TYPES
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => launchAttack('ice-injection')}
                                    disabled={attackStatus === 'running'}
                                    className="attack-btn attack-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <div className="text-lg font-bold">🧊 ICE Injection</div>
                                    <div className="text-xs mt-1 opacity-80">{getAttackDescription('ice-injection')}</div>
                                </button>

                                <button
                                    onClick={() => launchAttack('dos-flood')}
                                    disabled={attackStatus === 'running'}
                                    className="attack-btn attack-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <div className="text-lg font-bold">💣 DoS Flood</div>
                                    <div className="text-xs mt-1 opacity-80">{getAttackDescription('dos-flood')}</div>
                                </button>

                                <button
                                    onClick={() => launchAttack('session-hijack')}
                                    disabled={attackStatus === 'running'}
                                    className="attack-btn attack-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <div className="text-lg font-bold">🎭 Session Hijack</div>
                                    <div className="text-xs mt-1 opacity-80">{getAttackDescription('session-hijack')}</div>
                                </button>

                                <button
                                    onClick={() => launchAttack('packet-sniff')}
                                    disabled={attackStatus === 'running'}
                                    className="attack-btn attack-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <div className="text-lg font-bold">👁️ Packet Sniff</div>
                                    <div className="text-xs mt-1 opacity-80">{getAttackDescription('packet-sniff')}</div>
                                </button>
                            </div>
                        </div>

                        {/* Attack Status */}
                        <div className="status-box">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-accent">
                                📊 ATTACK STATUS
                            </h2>
                            <div className={`text-xl md:text-2xl font-bold ${getStatusColor()}`}>
                                {getStatusText()}
                            </div>

                            {/* Progress Bar */}
                            {attackStatus === 'running' && (
                                <div className="mt-4">
                                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentAttack && attackStatus !== 'idle' && (
                                <div className="mt-2 text-gray-400 text-sm">
                                    Attack Type: {currentAttack.toUpperCase().replace('-', ' ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Logs */}
                    <div className="status-box h-fit">
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-accent">
                            📝 ATTACK LOGS
                        </h2>
                        <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
                            {logs.length === 0 ? (
                                <div className="text-gray-500 text-center mt-8">
                                    No attacks launched yet...
                                    <div className="mt-2 text-xs">Select a target and click an attack button</div>
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="log-entry py-2">
                                        <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                        <span className={
                                            log.type === 'success' ? 'text-green-400 font-bold' :
                                                log.type === 'error' ? 'text-red-400 font-bold' :
                                                    log.type === 'warning' ? 'text-yellow-400' :
                                                        'text-gray-300'
                                        }>
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setLogs([])}
                            className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>

                {/* Captured Packets Display */}
                {capturedPackets.length > 0 && (
                    <div className="mt-6 lg:col-span-3">
                        <div className="status-box">
                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-accent">
                                📦 CAPTURED PACKETS - VIDEO FRAMES
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {capturedPackets.map((packet, index) => (
                                    <div key={index} className="bg-hacker-secondary rounded-lg p-4 border border-gray-700 hover:border-hacker-accent transition-colors">
                                        {/* Video Frame Preview */}
                                        {packet.videoFrame && (
                                            <div className="mb-3">
                                                <img
                                                    src={packet.videoFrame}
                                                    alt="Captured frame"
                                                    className="w-full rounded border-2 border-gray-600"
                                                />
                                            </div>
                                        )}

                                        {/* Packet Details */}
                                        <div className="space-y-2 text-xs font-mono">
                                            <div>
                                                <span className="text-gray-500">Time:</span>{' '}
                                                <span className="text-gray-300">{new Date(packet.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Type:</span>{' '}
                                                <span className={packet.type.includes('ENCRYPTED') || packet.type.includes('DTLS') || packet.type.includes('WSS')
                                                    ? 'text-green-400 font-bold'
                                                    : 'text-red-400 font-bold'}>
                                                    {packet.type}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Route:</span>{' '}
                                                <span className="text-blue-400">{packet.src}</span>
                                                {' → '}
                                                <span className="text-purple-400">{packet.dst}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Payload:</span>{' '}
                                                <span className={packet.payload.includes('UNENCRYPTED') || packet.payload.includes('PLAIN')
                                                    ? 'text-red-400'
                                                    : 'text-green-400'}>
                                                    {packet.payload.substring(0, 40)}...
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Data:</span>{' '}
                                                <span className="text-yellow-400">{packet.data}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setCapturedPackets([])}
                                className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Clear Packets
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-xs md:text-sm">
                    ⚠️ For Educational Purposes Only - Security Demonstration System
                </div>
            </div>
        </div>
    );
}
