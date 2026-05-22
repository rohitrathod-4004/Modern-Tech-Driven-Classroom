# AI Classroom Platform: Architectural Deep Dive & Mental Model

This document serves as the complete architectural comprehension of the platform as it stands.

## 1. Overall Monorepo Architecture
**Structure:**
- `apps/frontend`: React 18, Vite, Zustand, Tailwind CSS, React-Router.
- `apps/backend`: Express.js, TypeScript, Mongoose (MongoDB), BullMQ (Redis), Multer, Pino.
- `python-services/whisper-service`: FastAPI wrapping the local OpenAI Whisper model.

**Why this architecture?**
This architecture separates fast, I/O-heavy API routing (Express) from heavy ML computation (Python/Whisper) and generative AI orchestration (BullMQ). This ensures that heavy audio processing or LLM rate limits do not block the main Express event loop, keeping the API responsive for the frontend.

**Isolation Boundaries & Performance Protections:**
- **AI Processing Isolation:** The `lecture.worker.ts` runs inside a BullMQ worker context, entirely separate from the HTTP request-response cycle.
- **State Isolation (Frontend):** Zustand stores (`timelineStore`, `courseStore`, etc.) are modularized by domain, preventing global re-renders.

## 2. Recording & Transcription Pipeline
**Lifecycle:**
1. **WebRTC Capture:** `MediaRecorder` captures audio in 3-second slices.
2. **Offline-First Storage:** Chunks are instantly saved to IndexedDB (`saveChunkOffline`) to protect against network drops.
3. **Queue Sync:** A local memory queue pops chunks and uploads them via `/upload-chunk`.
4. **Local Whisper:** The backend forwards the WAV chunk to the local FastAPI Python service, keeping audio transcription cost-free and private.
5. **Database Sync:** The chunk is saved to MongoDB. 
6. **Finalization:** When the lecture ends, `ffmpeg` concatenates all saved chunks into a single `audio.webm` file on disk.
7. **AI Trigger:** The backend enqueues a `process-lecture-ai` job into BullMQ.

## 3. Smart Timeline Architecture
**Deep Dive:**
The Smart Timeline uses `react-virtuoso` to virtualize the transcript list, ensuring the browser only renders elements currently in the viewport (preventing DOM bloat with long lectures).

**Playback Synchronization:**
- **`requestAnimationFrame` loop:** Instead of relying on React state updates (which are too slow/heavy for 60fps media sync), `usePlaybackSync` runs a bare-metal rAF loop.
- **Binary Search (`findActiveChunkIndex`):** During each frame, it finds the active transcript node in `O(log N)` time.
- **Rerender Isolation:** Zustand allows components to subscribe *only* to specific slice properties. When the active node changes, only the old active node and the new active node re-render. The list itself does not re-render.

**Known Stability Risks:**
- **Hook Ordering Violations:** Previously, placing conditional returns (e.g., `if (loading) return null`) *before* hooks like `useTranscriptSearch` or `useAutoScrollSync` caused React to crash. All hooks must execute unconditionally at the top of the file.

## 4. AI Pipeline Architecture
**BullMQ Worker Lifecycle:**
The worker processes lectures idempotently through 5 sequential stages, updating `aiStatus` in MongoDB at each step: `summarizing` -> `embedding` -> `indexing` -> `generating_study_materials` -> `completed`.

**LLM Strategy:**
- **`GeminiProvider`:** Wraps the Google Generative AI SDK.
- **Graceful Degradation:** If `generateQuiz` or `generateFlashcards` fails, the worker catches the error, logs it, and continues. The UI handles the resulting `404` by displaying a fallback message.
- **Structured Outputs:** Uses Zod schemas injected directly into the prompt text to force the LLM to return strictly typed JSON objects (e.g., `{ "questions": [...] }`), protecting the database from malformed data.

## 5. Frontend Product Features Implemented
**Fully Functional Features:**
- **Recording Flow:** Offline-capable audio chunking, IndexedDB queueing.
- **Lecture Viewer:** Virtualized playback timeline with synchronized text highlighting.
- **Study Workspace:** Flip-card animations for AI flashcards, interactive multiple-choice quiz panel, dynamic AI summaries.
- **Universal Search:** Debounced `O(n)` frontend text search across transcript nodes.
- **Dashboard & Course Management:** Basic CRUD routing and data fetching.

## 6. Current Known Bugs & Stability Problems
**Recently Resolved:**
- **Mongoose Validation Crashes:** The worker crashed trying to save `aiStatus: 'generating_study_materials'` because the enum was missing in the schema.
- **Gemini Free-Tier Exhaustion:** Heavy testing exhausted the `gemini-2.0-flash` quota. Switched to `gemini-flash-lite-latest`.
- **Zod Array vs Object Parsing:** Gemini returned raw arrays instead of object wrappers. Fixed by enforcing exact JSON schemas in the prompt string.
- **Static File Routing:** The Express static path mapped one folder too high, causing 404s for `audio.webm`.

**Current High-Risk Areas:**
- **Audio Concatenation Race Conditions:** If the user kills the server immediately after clicking "End Lecture", the background `ffmpeg` process might die before finishing.
- **IndexedDB Cleanup:** Needs robust garbage collection for old un-synced chunks if a user never reconnects.

## 7. Current Product Completion Status
**Fully Working:** Local audio chunking, Whisper integration, Gemini AI pipeline (Summaries, Topics, Quiz, Flashcards), Virtualized Playback, Basic Auth.
**Needs Polish:** UI state during long AI generations (graceful loading states).

**Remaining before "Complete" SaaS:** 
- Proper deployment pipelines (Dockerization).
- S3 integration instead of local filesystem uploads.

## 8. Runtime & Infrastructure Integration
- **MongoDB:** Source of truth for lecture metadata, states, and chunks.
- **Redis:** Coordinates the BullMQ jobs, handling retries and exponential backoff.
- **FastAPI (Whisper):** Local ML boundary for audio-to-text.
- **Express / Vite:** Primary full-stack communication layer.

## 9. Developer Workflow
- **`npm run dev`:** Starts Vite (frontend) and Nodemon + ts-node (backend) simultaneously.
- **Database:** Requires local MongoDB instance (`localhost:27017`) and Redis server.
- **Python:** Requires `uvicorn main:app` running in `python-services/whisper-service`.

## 10. Recommended Stabilization Priorities BEFORE New Features
1. **Solidify the Media Pipeline:** Add cleanup mechanisms for stray chunks in `/uploads/lectures/:id/chunks`.
2. **UI Resilience:** Add explicit "Regenerate" buttons on the Quiz and Flashcard panels in case they hit a silent AI validation failure.

> [!IMPORTANT]
> The architectural foundation is extremely solid. The choice to decouple AI generation into a Redis queue and audio processing into a Python service guarantees that the Node event loop remains fast. Proceeding with new features is safe now that the schema validation and rate-limit issues are patched.
