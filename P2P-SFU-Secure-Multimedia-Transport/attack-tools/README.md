# Attack Tools - Security Demonstration Scripts

⚠️ **FOR EDUCATIONAL PURPOSES ONLY**

These scripts demonstrate common security vulnerabilities in WebRTC video calling systems.

## Prerequisites

```bash
cd attack-tools
npm install
```

## Available Attacks

### 1. ICE Injection Attack

Demonstrates how fake ICE candidates can redirect media streams.

**Run:**
```bash
npm run ice-injection
# OR
node ice-injection-attack.js [room-name]
```

**What it does:**
- Connects to a room as an attacker
- Injects fake ICE candidates pointing to attacker-controlled servers
- Shows if the server accepts the fake candidates

**Expected Result:**
- **Vulnerable System**: Fake candidates accepted ❌
- **Secure System**: Fake candidates rejected ✅

---

### 2. DoS Flood Attack

Overwhelms the server with connection requests.

**Run:**
```bash
npm run dos-flood
# OR
node dos-flood-attack.js [number-of-connections]
```

**What it does:**
- Creates hundreds of simultaneous connections
- Floods server with join requests
- Measures server's ability to handle load

**Expected Result:**
- **Vulnerable System**: Server crashes or becomes unresponsive ❌
- **Secure System**: Rate limiter blocks excessive requests ✅

---

### 3. Session Hijacking Attack

Steals and reuses session tokens to impersonate users.

**Run:**
```bash
npm run session-hijack
# OR
node session-hijack-attack.js
```

**What it does:**
- Captures a legitimate user's session token
- Attempts to join rooms using the stolen token
- Tests if server validates sessions properly

**Expected Result:**
- **Vulnerable System**: Attacker gains unauthorized access ❌
- **Secure System**: Stolen token rejected ✅

---

### 4. Packet Sniffing (MITM)

Demonstrates traffic interception using Wireshark.

**Manual Steps:**
1. Install Wireshark
2. Start packet capture on your network interface
3. Apply filter: `udp.port >= 50000 && udp.port <= 60000`
4. Start a video call
5. Observe packets

**Expected Result:**
- **Vulnerable System**: Unencrypted RTP packets visible ❌
- **Secure System**: Encrypted SRTP packets (gibberish) ✅

---

## Running Against Different Systems

### Vulnerable Version
```bash
# Terminal 1: Start vulnerable backend
cd apps/server
npm run dev

# Terminal 2: Run attack
cd attack-tools
npm run ice-injection
```

### Secure Version
```bash
# Switch to secure branch
git checkout Sanskar

# Terminal 1: Start secure backend
cd apps/server
npm run dev

# Terminal 2: Run same attack
cd attack-tools
npm run ice-injection
```

---

## For Your Project Report

### Screenshots to Capture

1. **ICE Injection**
   - Terminal showing attack script output
   - Server logs showing fake candidate
   - Comparison: accepted vs rejected

2. **DoS Attack**
   - Attack progress (connections established)
   - Server CPU/memory usage
   - Rate limiter blocking requests

3. **Session Hijacking**
   - Stolen token being used
   - Unauthorized access granted/denied
   - Security logs

4. **Packet Sniffing**
   - Wireshark showing unencrypted RTP
   - Wireshark showing encrypted SRTP
   - Hex dump comparison

### Comparison Table

| Attack | Vulnerable System | Secure System | Defense Mechanism |
|--------|------------------|---------------|-------------------|
| ICE Injection | ❌ Succeeds | ✅ Blocked | Candidate validation |
| DoS Flood | ❌ Server crashes | ✅ Blocked | Rate limiting |
| Session Hijack | ❌ Access granted | ✅ Rejected | Token validation |
| Packet Sniffing | ❌ Data visible | ✅ Encrypted | DTLS-SRTP |

---

## Safety Notes

- ⚠️ Only run these attacks against your own test servers
- ⚠️ Never use these scripts on production systems
- ⚠️ These are for educational demonstration only
- ⚠️ Unauthorized access to computer systems is illegal

---

## Troubleshooting

**Connection Errors:**
- Ensure backend server is running
- Check `BACKEND_URL` environment variable
- Verify firewall settings

**Attack Not Working:**
- Make sure you're on the correct branch (vulnerable-demo)
- Check that security features are actually removed
- Review server logs for errors

**No Visible Impact:**
- Increase attack intensity (for DoS)
- Ensure multiple users in room (for ICE injection)
- Check network configuration

---

## Environment Variables

```bash
# Set custom backend URL
export BACKEND_URL=http://localhost:4000

# Or use .env file
echo "BACKEND_URL=http://localhost:4000" > .env
```

---

## Understanding the Results

### Successful Attack (Vulnerable System)
```
🚨 ATTACK SUCCESSFUL! 🚨
Server accepted malicious input
System is vulnerable to this attack
```

### Blocked Attack (Secure System)
```
✅ ATTACK BLOCKED
Server rejected malicious input
Security measures working correctly
```

---

## Next Steps

1. Run each attack on vulnerable version
2. Capture screenshots and logs
3. Switch to secure version
4. Run same attacks
5. Document differences
6. Create comparison charts for report

---

## Questions?

These scripts are designed to be educational. If you don't understand what an attack does, review the comments in the source code or check the main documentation.

**Remember:** Understanding security vulnerabilities helps you build more secure systems! 🛡️
