# Phase 1B Implementation Plan: Real Lecture Integration Layer (Updated)

This plan outlines the strategy to properly connect the existing real-time transcription engine with the new authenticated classroom domain architecture, strictly adhering to your architectural corrections to avoid technical debt.

## 1. Data Model & Architecture Constraints

### Single Source of Truth
*   The backend will immediately treat `lectureId` as the primary identifier. We will **not** dual-write into `session_id`.
*   The `TranscriptChunk` schema will receive an immediate primary compound unique index: `{ lectureId: 1, chunk_index: 1 }`. The old `session_id` index will be deprecated/removed for new records.

### Future-Proof Metadata
The `Lecture` schema will be extended now to support future async boundaries without implementing the async queues themselves:
*   `latestChunkReceivedAt?: Date`
*   `processingStartedAt?: Date`
*   `processingCompletedAt?: Date`
*   `averageLatencyMs?: number`

### State Transition Guards
`LectureService` will implement strict state machine guards:
*   `recording` -> `processing`
*   `processing` -> `ready`
*   `processing` -> `failed`
(Transitions like `ready` -> `recording` will explicitly throw an `AppError`).

## 2. Backend Implementation Strategy

### 1. Lecture APIs & Service Validation
*   **Create Lecture**: `POST /api/courses/:courseId/lectures` (Teacher only, validates course ownership). Sets status to `recording` and `startedAt`.
*   **End Lecture**: `POST /api/lectures/:lectureId/end` (Teacher only). Validates transition (`recording` -> `processing`), sets `endedAt` and `processingStartedAt`, computes `durationSeconds`.
*   **Service Layer Validation**: All business logic (e.g., `LectureService.validateLectureUpload()`) will live inside `LectureService.ts`. Controllers will remain thin.

### 2. Upload Endpoint Integration
*   The `uploadRouter` will be placed behind `authenticate` middleware.
*   **Performance Optimization**: Inside the upload route, `LectureService.validateLectureUpload()` will use `.select('teacherId status').lean()` to ensure the DB hit adds virtually zero latency to the 3-second chunk cycle.
*   **Upload Metrics**: As chunks arrive, we will perform lightweight updates to the parent `Lecture` (incrementing `chunkCount`, updating `latestChunkReceivedAt`).

### 3. Lecture Viewer Access Control
*   `GET /api/courses/:courseId/lectures/:lectureId` will strictly validate data isolation: `Student ∈ Course.students` or `Teacher === Course.teacherId`. No anonymous lecture fetching.

## 3. Frontend Implementation Strategy

### 1. Recorder Stability Rule
*   `Recorder.tsx` will remain structurally untouched.
*   We will only replace the `sessionId` prop variable with `lectureId` and update the `uploadChunk` API payload.
*   IndexedDB logic, `MediaRecorder` lifecycle, and retry queueing will remain exactly as they are to guarantee stability.

### 2. Dashboard Lecture Creation Flow
*   The Dashboard will feature a "Start Lecture" button inside a Course context that triggers the `POST` creation flow and navigates the user to the `/record` view with the actual `lectureId`.

### 3. Lecture Viewer Page
*   A new page for viewing completed/processing lectures.
*   It will reuse the existing `Transcript.tsx` component.
*   It will display metadata (title, teacher, timestamps, status, duration).
*   *Note: No Smart Timeline will be built in this phase.*

## 4. Final Implementation Order

Execution will strictly follow this sequence:
1.  **Lecture Backend APIs**: Create Course/Lecture schemas, Routes, Controllers, and empty Services.
2.  **Lecture Service Validation Layer**: Implement strict state guards, ownership checks, and `validateLectureUpload`.
3.  **Upload Endpoint Integration**: Connect the Service validation to the upload route using `.lean()`, track metrics, switch to `lectureId`.
4.  **Recorder Migration**: Update the frontend `Recorder.tsx` props and IndexedDB variables.
5.  **Dashboard Flow**: Build the frontend UI to create a lecture and navigate to the recording screen.
6.  **Lecture Viewer**: Build the frontend read-only view with strict enrollment guards.
7.  **Final Lifecycle Handling**: Ensure `end` properly transitions state.

## User Review Required
Please review the updated plan. If it satisfies all 10 architectural corrections, I will begin execution sequentially, starting with the backend APIs.
