/**
 * Vulnerable System Frontend - SFU Video Calling
 * NO SECURITY - Server relays all media
 * DoS attacks will ACTUALLY drop frames!
 */

const BACKEND_URL = 'http://localhost:4002';
let socket, localStream, roomId;
let isMuted = false, isVideoOff = false;
let fps = 60, lastFrameTime = Date.now(), frameCount = 0;
let targetFPS = 60, isUnderAttack = false;
let mediaCanvas, mediaContext;
let receivedFrameCount = 0;

const joinBtn = document.getElementById('joinBtn');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const leaveBtn = document.getElementById('leaveBtn');
const statusLog = document.getElementById('statusLog');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const fpsCounter = document.getElementById('fpsCounter');
const connectionCount = document.getElementById('connectionCount');
const qualityIndicator = document.getElementById('qualityIndicator');
const attackWarning = document.getElementById('attackWarning');
const attackType = document.getElementById('attackType');

function simulatePerformanceDrop(severity) {
    if (severity === 'none') {
        targetFPS = 60;
        isUnderAttack = false;
        if (localVideo) {
            localVideo.style.filter = 'none';
            localVideo.style.opacity = '1';
        }
        if (remoteVideo) {
            remoteVideo.style.filter = 'none';
            remoteVideo.style.opacity = '1';
        }
        if (document.querySelector('.video-container')) {
            document.querySelector('.video-container').classList.remove('degraded');
        }
    } else if (severity === 'degraded') {
        targetFPS = 30;
        isUnderAttack = true;
        if (localVideo) localVideo.style.filter = 'brightness(0.9)';
        if (remoteVideo) remoteVideo.style.filter = 'brightness(0.9)';
    } else {
        targetFPS = 15;
        isUnderAttack = true;
        if (localVideo) localVideo.style.filter = 'blur(1px) brightness(0.8)';
        if (remoteVideo) remoteVideo.style.filter = 'blur(1px) brightness(0.8)';
    }
}

function updateFPS() {
    frameCount++;
    const now = Date.now();
    const elapsed = now - lastFrameTime;

    if (elapsed >= 1000) {
        let actualFPS = Math.round((frameCount * 1000) / elapsed);
        if (isUnderAttack) {
            fps = Math.min(actualFPS, targetFPS);
            fps = Math.max(10, fps - Math.floor(Math.random() * 5));
        } else {
            fps = actualFPS;
        }

        fpsCounter.textContent = fps;
        fpsCounter.style.color = fps >= 50 ? '#2ecc71' : fps >= 30 ? '#f39c12' : '#e74c3c';

        frameCount = 0;
        lastFrameTime = now;
    }
    requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);

function addStatus(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'status-entry';
    const timestamp = new Date().toLocaleTimeString();
    const colors = { error: '#e74c3c', success: '#2ecc71', warning: '#f39c12', info: '#666' };
    entry.innerHTML = `<span style="color: ${colors[type]}">[${timestamp}]</span> ${message}`;
    statusLog.appendChild(entry);
    statusLog.scrollTop = statusLog.scrollHeight;
}

function showAttackWarning(type, message) {
    attackType.textContent = message;
    attackWarning.classList.remove('hidden');
    addStatus(`🚨 ATTACK: ${message}`, 'error');
    setTimeout(() => attackWarning.classList.add('hidden'), 10000);
}

function updateQuality(quality) {
    qualityIndicator.className = 'perf-value';
    if (quality === 'good') {
        qualityIndicator.textContent = 'GOOD';
        qualityIndicator.classList.add('quality-good');
        document.querySelector('.video-container').classList.remove('degraded');
        simulatePerformanceDrop('none');
    } else if (quality === 'degraded') {
        qualityIndicator.textContent = 'DEGRADED';
        qualityIndicator.classList.add('quality-degraded');
        document.querySelector('.video-container').classList.add('degraded');
        simulatePerformanceDrop('degraded');
        addStatus('⚠️ SFU server degraded - Frames dropping!', 'warning');
    } else {
        qualityIndicator.textContent = 'POOR';
        qualityIndicator.classList.add('quality-poor');
        document.querySelector('.video-container').classList.add('degraded');
        simulatePerformanceDrop('poor');
        addStatus('🚨 SFU server overloaded - Heavy frame loss!', 'error');
    }
}

function startMediaStreaming() {
    if (!localStream) return;

    mediaCanvas = document.createElement('canvas');
    mediaCanvas.width = 640;
    mediaCanvas.height = 480;
    mediaContext = mediaCanvas.getContext('2d');

    addStatus('📹 SFU Mode: Sending frames through server', 'success');

    setInterval(() => {
        if (!localVideo.paused && !localVideo.ended && localStream) {
            mediaContext.drawImage(localVideo, 0, 0, mediaCanvas.width, mediaCanvas.height);
            const frameData = mediaCanvas.toDataURL('image/jpeg', 0.7);

            socket.emit('media-stream', {
                roomId: roomId,
                streamData: frameData,
                frameType: 'video'
            });
        }
    }, 33);
}

async function init() {
    try {
        addStatus('🎥 Requesting media access...');
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        addStatus('✅ Media granted', 'success');

        socket = io(BACKEND_URL);
        socket.on('connect', () => addStatus(`✅ Connected to SFU server (${socket.id})`, 'success'));

        socket.on('room-state', (data) => addStatus(`📊 Room: ${data.participants.length} users`));

        socket.on('user-joined', (data) => {
            addStatus(`👤 ${data.user.name} joined`);
        });

        socket.on('user-left', (data) => {
            addStatus(`👋 User left`);
            if (remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject = null;
            }
        });

        socket.on('media-stream', (data) => {
            const { senderId, streamData, serverLoad } = data;

            if (streamData && remoteVideo) {
                receivedFrameCount++;

                if (!window.remoteCanvas) {
                    window.remoteCanvas = document.createElement('canvas');
                    window.remoteCanvas.width = 640;
                    window.remoteCanvas.height = 480;
                    window.remoteContext = window.remoteCanvas.getContext('2d');

                    const stream = window.remoteCanvas.captureStream(30);
                    remoteVideo.srcObject = stream;
                    remoteVideo.play();

                    addStatus('📺 Receiving video from SFU server', 'success');
                }

                const img = new Image();
                img.onload = () => {
                    window.remoteContext.drawImage(img, 0, 0, 640, 480);
                };
                img.src = streamData;
            }

            if (serverLoad > 70) {
                addStatus(`⚠️ Server load: ${serverLoad}% - Frames may drop!`, 'warning');
            }
        });

        socket.on('server-status', (status) => {
            connectionCount.textContent = status.connections;
            const wasUnderAttack = isUnderAttack;

            updateQuality(status.quality);

            if (wasUnderAttack && !status.underAttack && status.quality === 'good') {
                addStatus('✅ Attack ended - Video recovering!', 'success');
                simulatePerformanceDrop('none');
            }

            if (status.droppedFrames && status.droppedFrames > 0) {
                addStatus(`📉 ${status.droppedFrames} frames dropped by server!`, 'error');
            }

            if (status.underAttack) {
                showAttackWarning('DOS_FLOOD', 'DoS Flood - SFU server dropping frames!');
            }
        });

        socket.on('attack-detected', (attack) => showAttackWarning(attack.type, attack.message));

    } catch (error) {
        addStatus(`❌ Error: ${error.message}`, 'error');
    }
}

joinBtn.addEventListener('click', () => {
    roomId = document.getElementById('roomId').value;
    if (!roomId) return addStatus('❌ Enter room ID', 'error');

    addStatus(`🚪 Joining ${roomId} (SFU Mode)`);
    socket.emit('join', { roomId, user: { id: 'user-' + Date.now(), name: 'Demo User' } });

    startMediaStreaming();

    joinBtn.disabled = true;
    joinBtn.textContent = 'Joined (SFU)';
});

muteBtn.addEventListener('click', () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
    muteBtn.textContent = isMuted ? '🔇 Unmute' : '🎤 Mute';
    addStatus(isMuted ? '🔇 Muted' : '🎤 Unmuted');
});

videoBtn.addEventListener('click', () => {
    if (!localStream) return;
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    videoBtn.textContent = isVideoOff ? '📹 Video On' : '📹 Video Off';
    addStatus(isVideoOff ? '📹 Camera off' : '📹 Camera on');
});

leaveBtn.addEventListener('click', () => {
    if (socket) socket.disconnect();
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
    addStatus('👋 Left room');
    joinBtn.disabled = false;
    joinBtn.textContent = 'Join Room';
});

init();
