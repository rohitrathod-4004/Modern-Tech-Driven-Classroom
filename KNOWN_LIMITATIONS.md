# Known Limitations & Transparency Report

To ensure academic honesty and architectural transparency, the following limitations are documented for the current iteration of the AI Classroom Platform.

## 1. Whisper VAD (Voice Activity Detection) Limitations
- **Issue:** The local WebWorker Whisper implementation uses basic volume thresholding for chunking. If a speaker pauses for exactly 1.5 to 2.5 seconds mid-sentence, the VAD may aggressively split the sentence across two transcript chunks.
- **Impact:** Minor readability disruption in the timeline, though semantic search still functions normally.

## 2. LLM Rate Limits & Context Windows
- **Issue:** The platform currently utilizes the free tier of Google Gemini 1.5 Flash. Processing a 2-hour lecture can consume a large portion of the context window.
- **Impact:** If multiple teachers finalize long lectures simultaneously, the Gemini API may throw a `429 Too Many Requests`. 
- **Mitigation:** BullMQ handles automatic retries with exponential backoff. The `lecture.worker.ts` has try-catch isolation, meaning a failure in Quiz generation will not destroy the Summary generation.

## 3. Infrastructure Assumptions
- **Issue:** The system is optimized for localhost development (`concurrently`, in-memory rate limiting).
- **Impact:** It is not ready for horizontal scaling (Kubernetes/Docker). Deploying this codebase directly to AWS or Render would require transitioning the Express Rate Limiter to a Redis store and containerizing the worker separately from the API server.

## 4. FFmpeg Memory Constraints
- **Issue:** Audio extraction and compression rely on the Node process spawning `ffmpeg-static`.
- **Impact:** Uploading a massive video file (e.g., 4GB) might exceed Node's memory limits before streaming processing can begin. Future iterations should use AWS MediaConvert or pre-signed S3 streaming uploads.

## 5. React Virtuoso & DOM Limits
- **Issue:** While React Virtuoso safely handles 10,000+ transcript chunks without crashing the DOM, rapid scrolling combined with aggressive highlight searching can cause minor layout shifts (jank) on low-end devices (e.g., older Android tablets).
