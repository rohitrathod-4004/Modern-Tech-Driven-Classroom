# ⚠️ VULNERABLE VERSION - FOR EDUCATIONAL PURPOSES ONLY

## 🚨 CRITICAL WARNING

This is an **intentionally insecure** version of the P2P-SFU video calling system created for:
- **Security research and education**
- **Comparative security analysis**
- **Academic project demonstrations**
- **Penetration testing practice**

**🛑 DO NOT USE THIS IN PRODUCTION!**  
**🛑 DO NOT DEPLOY THIS TO PUBLIC SERVERS!**

---

## What is This?

This branch (`vulnerable-demo`) contains a deliberately weakened version of the secure video calling system. Security features have been systematically removed to demonstrate common vulnerabilities in WebRTC applications.

---

## Security Features REMOVED

### 1. ❌ Rate Limiting
- **Location**: `apps/server/src/server.ts`
- **Impact**: Server can be overwhelmed with requests
- **Attack**: DoS (Denial of Service)
- **Demo**: `attack-tools/dos-flood-attack.js`

### 2. ❌ Token Validation
- **Location**: `apps/server/src/socket/signalingHandler.ts`
- **Impact**: Anyone can join any room without authorization
- **Attack**: Unauthorized access
- **Demo**: `attack-tools/session-hijack-attack.js`

### 3. ❌ ICE Candidate Validation
- **Location**: `apps/server/src/socket/signalingHandler.ts`
- **Impact**: Fake ICE candidates can redirect media streams
- **Attack**: ICE injection / Media hijacking
- **Demo**: `attack-tools/ice-injection-attack.js`

### 4. ❌ Encryption (DTLS-SRTP)
- **Location**: `apps/web/app/HybridManager.ts`
- **Impact**: Traffic can be intercepted and read
- **Attack**: Man-in-the-Middle (MITM)
- **Demo**: Use Wireshark to capture packets

### 5. ❌ Input Sanitization
- **Location**: Multiple files
- **Impact**: Malformed packets can crash the system
- **Attack**: Packet manipulation
- **Demo**: Send corrupted signaling data

---

## How to Use This Version

### Prerequisites
```bash
# Install dependencies
npm install

# Install attack tools
cd attack-tools
npm install
```

### Running the Vulnerable System

**Terminal 1 - Backend:**
```bash
cd apps/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

**Terminal 3 - Attack Scripts:**
```bash
cd attack-tools
npm run ice-injection
# OR
npm run dos-flood
# OR
npm run session-hijack
```

---

## Switching Between Versions

### To Vulnerable Version (Current):
```bash
git checkout vulnerable-demo
npm install
```

### To Secure Version:
```bash
git checkout Sanskar  # or main/master
npm install
```

### View All Branches:
```bash
git branch -a
```

---

## Attack Demonstrations

See `attack-tools/README.md` for detailed instructions on running each attack.

### Quick Start:
```bash
# 1. Start vulnerable backend
cd apps/server && npm run dev

# 2. In another terminal, run attack
cd attack-tools
node ice-injection-attack.js
```

---

## For Your Academic Project

### Comparison Methodology

1. **Run attack on vulnerable version** → Capture results
2. **Switch to secure version** → Run same attack
3. **Document differences** → Create comparison table
4. **Take screenshots** → For project report
5. **Record demo video** → For presentation

### Suggested Comparison Table

| Security Feature | Vulnerable | Secure | Attack Prevented |
|-----------------|-----------|--------|------------------|
| Rate Limiting | ❌ None | ✅ 100 req/15min | DoS attacks |
| Token Validation | ❌ None | ✅ JWT with expiry | Session hijacking |
| ICE Validation | ❌ None | ✅ Candidate verification | Media redirection |
| Encryption | ❌ Plain RTP | ✅ DTLS-SRTP | Eavesdropping |
| Input Sanitization | ❌ None | ✅ Full validation | Injection attacks |

---

## Project Report Sections

### 1. Introduction
- Problem statement
- Importance of WebRTC security
- Project objectives

### 2. System Architecture
- P2P mesh topology (≤3 users)
- SFU architecture (>3 users)
- Signaling flow diagrams

### 3. Vulnerability Analysis
For each vulnerability:
- Description
- Potential impact
- Exploitation method
- Attack demonstration results

### 4. Security Implementation
For each defense:
- Mechanism description
- Implementation details
- Effectiveness demonstration

### 5. Comparative Analysis
- Side-by-side attack results
- Performance metrics
- Security vs usability trade-offs

### 6. Conclusions
- Key findings
- Recommendations
- Future improvements

---

## Screenshots to Capture

### For Vulnerable System:
1. ✅ DoS attack succeeding (server overwhelmed)
2. ✅ ICE injection accepted (fake candidates)
3. ✅ Session hijacking successful
4. ✅ Wireshark showing unencrypted packets
5. ✅ Server logs showing no validation

### For Secure System:
1. ✅ DoS attack blocked (rate limiter)
2. ✅ ICE injection rejected (validation)
3. ✅ Session hijacking failed (token check)
4. ✅ Wireshark showing encrypted packets
5. ✅ Security logs showing blocked attacks

---

## Performance Metrics to Measure

### Latency
- P2P connection time
- SFU connection time
- Impact of encryption overhead

### Bandwidth
- Unencrypted vs encrypted traffic
- P2P mesh vs SFU bandwidth usage

### CPU Usage
- Server load during normal operation
- Server load during DoS attack
- Impact of security features

### Success Rates
- Attack success rate on vulnerable system
- Attack block rate on secure system

---

## Code Differences

### View Changes:
```bash
# Compare specific file
git diff Sanskar vulnerable-demo apps/server/src/server.ts

# Compare all changes
git diff Sanskar vulnerable-demo
```

### Key Files Modified:
- `apps/server/src/server.ts` - Rate limiting removed
- `apps/server/src/socket/signalingHandler.ts` - Validation removed
- `apps/web/app/HybridManager.ts` - Encryption disabled

---

## Safety Reminders

✅ **Your secure version is safe** - It's on a different branch  
✅ **Can switch back anytime** - `git checkout Sanskar`  
✅ **All changes tracked** - Git history preserved  
✅ **Attack tools are isolated** - Only in `attack-tools/` directory  

---

## Troubleshooting

**Q: Attack isn't working?**  
A: Make sure you're on `vulnerable-demo` branch and security features are actually removed.

**Q: Can't switch branches?**  
A: Commit or stash your changes first: `git stash`

**Q: Want to see what changed?**  
A: Use `git diff Sanskar vulnerable-demo`

**Q: Accidentally damaged secure version?**  
A: Impossible! It's on a separate branch. Just `git checkout Sanskar`

---

## Academic Integrity

This vulnerable version is created for:
- ✅ Educational purposes
- ✅ Security research
- ✅ Controlled demonstrations
- ✅ Academic projects

**NOT for:**
- ❌ Malicious use
- ❌ Unauthorized access
- ❌ Production deployment
- ❌ Public exposure

---

## Questions?

Review the documentation in:
- `attack-tools/README.md` - Attack demonstrations
- Main project README - System architecture
- Security explanation doc - Concepts explained

---

## Next Steps

1. ✅ Run attacks on this vulnerable version
2. ✅ Document results and take screenshots
3. ✅ Switch to secure version (`git checkout Sanskar`)
4. ✅ Run same attacks on secure version
5. ✅ Compare results
6. ✅ Create project report
7. ✅ Prepare presentation

**Good luck with your project!** 🎓🔒
