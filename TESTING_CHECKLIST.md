# QA & Testing Checklist

## 1. Recording Cases
- [ ] **1 Minute Lecture**: Verify quick finish and AI triggering without timeouts.
- [ ] **5 Minute Lecture**: Verify chunk chunking happens correctly and doesn't overwhelm the backend.
- [ ] **15 Minute Lecture**: Check memory usage in the browser. Verify Virtuoso doesn't lag.
- [ ] **Lecture with Silence Gaps**: Verify VAD (Voice Activity Detection) handles pauses correctly and Whisper doesn't hallucinate.
- [ ] **Noisy Background**: Test Whisper robustness.
- [ ] **Fast Speaker**: Verify chunk boundaries remain intact and timeline aligns.
- [ ] **Network Disconnect**: Turn off Wi-Fi during recording. Ensure IndexedDB stores chunks safely. Turn Wi-Fi on and verify queue flushes gracefully.
- [ ] **Browser Refresh**: Refresh during processing and ensure the queue recovers.

## 2. Validation Points
- [ ] **IndexedDB Stability**: No chunks are lost.
- [ ] **No Duplicate Chunks**: Verify the backend deduplicates by sequence index.
- [ ] **Timeline Sync Accuracy**: Click a transcript chunk, ensure video/audio seeks perfectly.
- [ ] **Transcript Search Accuracy**: Search for keywords, verify highlighting and jumping.
- [ ] **No Browser Freezing**: UI threads remain unblocked during heavy IndexedDB operations.

## 3. AI Pipeline Stress
- [ ] **Malformed Gemini JSON**: Simulate invalid JSON. Ensure worker catches it and continues or retries.
- [ ] **Empty AI Responses**: Ensure graceful empty states on the frontend.
- [ ] **Redis Disconnect**: Kill Redis, verify BullMQ pauses and resumes smoothly upon reconnect.
- [ ] **AI Study Workspace Degrades Gracefully**: If flashcards fail to generate, the tab should show an empty state, not a crash.

## 4. UI/UX Verification
- [ ] **Empty States**: Ensure missing summaries/topics show "Generating..." or "Not available".
- [ ] **Dark Mode**: No glaring white backgrounds on flashcards or quizzes.
- [ ] **Study Mode Transitions**: Animating between timeline view and study workspace view must be smooth (60fps).
- [ ] **Sidebar Persistence**: Check if refreshing keeps the user on their previously selected tab.
