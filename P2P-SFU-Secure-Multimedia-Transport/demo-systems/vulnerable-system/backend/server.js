/**
 * VULNERABLE VIDEO CALLING BACKEND - SFU MODE
 * 
 * ⚠️ WARNING: This server has NO SECURITY FEATURES
 * Server relays ALL media streams (SFU mode)
 * DoS attacks will VISIBLY affect video quality
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ⚠️ VULNERABLE: Allow all origins (no CORS protection)
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8 // 100MB for video streams
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

// Store rooms and participants with their streams
const rooms = new Map();
let totalConnections = 0;
let attackDetected = false;
let serverLoad = 0; // Track server load (0-100)
let droppedFrames = 0;

// ⚠️ VULNERABLE: No rate limiting

io.on('connection', (socket) => {
    totalConnections++;
    console.log(`[VULNERABLE SFU] Client connected: ${socket.id} (Total: ${totalConnections})`);

    // Detect flood attacks
    if (totalConnections > 50) {
        attackDetected = true;
        serverLoad = Math.min(100, (totalConnections / 2)); // Load increases with connections
        console.log('⚠️  [VULNERABLE SFU] FLOOD ATTACK DETECTED! Server under stress!');
        console.log(`   ${totalConnections} connections - Server load: ${serverLoad}%`);
    }

    // ⚠️ VULNERABLE: No authentication

    socket.on('join', (data) => {
        const { roomId, user } = data;

        // ⚠️ VULNERABLE: No input validation
        console.log(`[VULNERABLE SFU] User ${user?.name} joining room ${roomId}`);

        // Detect attacker by name
        if (user?.name && (user.name.includes('ATTACKER') || user.name.includes('HIJACKER') || user.name.includes('Bot'))) {
            console.log(`🚨 [VULNERABLE SFU] ATTACK DETECTED! Malicious user: ${user.name}`);
            console.log(`   ⚠️  No security to block them!`);
        }

        socket.join(roomId);

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }

        const room = rooms.get(roomId);
        room.set(socket.id, {
            socketId: socket.id,
            userId: user?.id,
            name: user?.name,
            streamActive: false
        });

        const participants = Array.from(room.values());
        socket.emit('room-state', { participants });

        socket.to(roomId).emit('user-joined', {
            socketId: socket.id,
            user: user
        });
    });

    // SFU MODE: Relay media streams through server
    socket.on('media-stream', (data) => {
        const { roomId, streamData, frameType } = data;

        // ⚠️ VULNERABLE: No bandwidth limiting, no priority
        // Server relays ALL media - gets overwhelmed during DoS

        if (attackDetected && serverLoad > 50) {
            // Simulate frame dropping under load
            const dropProbability = (serverLoad - 50) / 50; // 0 to 1
            if (Math.random() < dropProbability) {
                droppedFrames++;
                if (droppedFrames % 10 === 0) {
                    console.log(`⚠️  [SFU] Dropped ${droppedFrames} frames due to server overload!`);
                }
                return; // DROP THE FRAME!
            }
        }

        // Forward stream to all other participants in room
        socket.to(roomId).emit('media-stream', {
            senderId: socket.id,
            streamData,
            frameType,
            serverLoad // Send load info to clients
        });
    });

    // Handle WebRTC offer (for initial connection)
    socket.on('webrtc-offer', (data) => {
        console.log(`[VULNERABLE SFU] WebRTC offer from ${socket.id}`);
        io.to(data.targetSocketId).emit('webrtc-offer', {
            senderSocketId: socket.id,
            offer: data.offer
        });
    });

    socket.on('webrtc-answer', (data) => {
        console.log(`[VULNERABLE SFU] WebRTC answer from ${socket.id}`);
        io.to(data.targetSocketId).emit('webrtc-answer', {
            senderSocketId: socket.id,
            answer: data.answer
        });
    });

    socket.on('webrtc-ice', (data) => {
        // ⚠️ VULNERABLE: No ICE candidate validation
        const candidate = String(data.candidate?.candidate || '');

        if (candidate.includes('FAKE') || candidate.includes('666')) {
            console.log(`🚨 [VULNERABLE SFU] FAKE ICE CANDIDATE DETECTED!`);
            console.log(`   ⚠️  ACCEPTING ANYWAY - No validation!`);

            io.emit('attack-detected', {
                type: 'ICE_INJECTION',
                message: 'Fake ICE candidates detected!',
                severity: 'high'
            });
        }

        io.to(data.targetSocketId).emit('webrtc-ice', {
            senderSocketId: socket.id,
            candidate: data.candidate
        });
    });

    socket.on('chat-message', (data) => {
        // ⚠️ VULNERABLE: No input sanitization
        if (data.text && data.text.includes('SPAM')) {
            console.log(`🚨 [VULNERABLE SFU] SPAM MESSAGE DETECTED!`);
            console.log(`   ⚠️  No filtering - accepting spam!`);
        }

        const roomsArray = Array.from(socket.rooms);
        roomsArray.forEach(roomId => {
            if (roomId !== socket.id) {
                socket.to(roomId).emit('chat-message', {
                    ...data,
                    senderId: socket.id
                });
            }
        });
    });

    socket.on('disconnect', () => {
        totalConnections--;
        console.log(`[VULNERABLE SFU] Client disconnected: ${socket.id} (Total: ${totalConnections})`);

        // Update server load
        serverLoad = Math.max(0, Math.min(100, (totalConnections / 2)));

        if (attackDetected && totalConnections < 50) {
            attackDetected = false;
            serverLoad = 0;
            droppedFrames = 0;
            console.log('✅ [VULNERABLE SFU] Attack ended - server back to normal');

            io.emit('server-status', {
                connections: totalConnections,
                underAttack: false,
                quality: 'good',
                serverLoad: 0
            });
        }

        rooms.forEach((room, roomId) => {
            if (room.has(socket.id)) {
                room.delete(socket.id);
                socket.to(roomId).emit('user-left', { socketId: socket.id });

                if (room.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

// Broadcast server status every 1 second
setInterval(() => {
    const quality = totalConnections > 100 ? 'poor' :
        totalConnections > 50 ? 'degraded' : 'good';

    io.emit('server-status', {
        connections: totalConnections,
        underAttack: attackDetected,
        quality: quality,
        serverLoad: serverLoad,
        droppedFrames: droppedFrames
    });
}, 1000);

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        connections: totalConnections,
        underAttack: attackDetected,
        rooms: rooms.size,
        serverLoad: serverLoad,
        droppedFrames: droppedFrames,
        security: 'NONE - VULNERABLE SFU MODE'
    });
});

server.listen(PORT, () => {
    console.log('\n' + '═'.repeat(60));
    console.log('  ⚠️  VULNERABLE SFU BACKEND SERVER  ⚠️');
    console.log('═'.repeat(60));
    console.log(`  Port: ${PORT}`);
    console.log('  Mode: SFU (Server Forwards Unit)');
    console.log('  Status: NO SECURITY FEATURES');
    console.log('');
    console.log('  How it works:');
    console.log('  📹 Server relays ALL video/audio streams');
    console.log('  ⚠️  DoS attacks WILL drop frames visibly');
    console.log('  ⚠️  No bandwidth limiting or QoS');
    console.log('');
    console.log('  Missing Security:');
    console.log('  ❌ No rate limiting');
    console.log('  ❌ No token validation');
    console.log('  ❌ No ICE validation');
    console.log('  ❌ No bandwidth management');
    console.log('═'.repeat(60) + '\n');
});
