# V1 Architecture Blueprint: AI Classroom Intelligence Platform

> [!IMPORTANT]
> This document freezes the core architecture, data models, and module boundaries for the v1 system. It adheres to a Modular Monolith design pattern, preserving the existing robust offline-first transcription pipeline while establishing a scalable foundation for advanced AI capabilities.

---

## 1. Complete Database Schema Relationships (MongoDB)

We use a denormalized document structure optimized for our primary read patterns.

*   **`User`**: The root identity.
    *   `_id`, `email` (unique), `passwordHash`, `name`, `role` (`'student' | 'teacher' | 'admin'`), `enrolledCourses` `[Course._id]`.
*   **`Course`**: The primary grouping entity.
    *   `_id`, `title`, `description`, `teacherId` (`User._id`), `enrollmentCode` (unique), `students` `[User._id]`, `lectures` `[Lecture._id]`, `isActive`.
    *   *Relationship*: 1-to-Many with Lectures. Many-to-Many with Users (Students). 1-to-1 with User (Teacher).
*   **`Lecture`**: The core event.
    *   `_id`, `courseId` (`Course._id`), `teacherId` (`User._id`), `title`, `status` (`'recording' | 'processing' | 'ready' | 'failed'`), `startedAt`, `endedAt`, `durationSeconds`, `chunkCount`, `aiProcessingStatus` (object tracking summary/quiz/embed progress).
*   **`TranscriptChunk`**: The raw transcription data.
    *   `_id`, `lectureId` (`Lecture._id`), `courseId` (`Course._id` - *denormalized for query perf*), `chunkIndex`, `text`, `startTime`, `endTime`, `isEmbedded`.
    *   *Constraint*: Compound unique index on `{ lectureId: 1, chunkIndex: 1 }` guarantees idempotency.
*   **`Summary` / `Quiz` / `Flashcards`**: Post-processed AI artifacts.
    *   Each has a 1-to-1 relationship with `Lecture` (e.g., `_id`, `lectureId`, `courseId`, and specific payload fields like `summaryText`, `questions[]`, `cards[]`).
*   **`ChatSession`**: Stores RAG conversation history.
    *   `_id`, `userId` (`User._id`), `courseId` (`Course._id`), `messages[]`.

## 2. Core Backend Module Structure

The Node.js backend strictly follows a layered architecture to prevent route-handler bloat and ensure testability.

*   **Routes (`*.routes.ts`)**: Binds HTTP paths to controllers and applies middleware (Auth, Validation).
*   **Controllers (`*.controller.ts`)**: Parses req/res, validates Zod schemas, delegates to services.
*   **Services (`*.service.ts`)**: Contains core business logic, orchestrates across domains.
*   **Repositories (`*.repository.ts`)**: Abstracts Mongoose/MongoDB interactions.
*   **Models (`*.model.ts`)**: Mongoose schema definitions.

*Domains*: `Auth`, `Course`, `Lecture`, `Transcript`, `AI`, `Search`.

## 3. API Contract Structure

All APIs follow strict RESTful conventions and a standard response envelope.

*   **Success Envelope**: `{ "data": T, "meta"?: { "page", "limit", "total" } }`
*   **Error Envelope**: `{ "error": "Error message", "code": "ERR_CODE", "details"?: {} }`
*   **Input Validation**: Enforced via Zod schemas at the controller level before hitting business logic.
*   **Security**: All non-auth endpoints require a `Bearer <token>` in the Authorization header.

## 4. Auth Flow Structure

Dual-token strategy optimized for SPA security.

1.  **Login/Register**: Client sends credentials. Server validates, hashes (bcrypt), and returns an Access Token in JSON and a Refresh Token in an `HttpOnly`, `Secure` cookie.
2.  **API Requests**: Client attaches the Access Token (TTL: 15 mins) from memory via Axios interceptor.
3.  **Token Refresh**: When the Access Token expires (401), the Axios interceptor transparently calls `POST /api/auth/refresh`. The server validates the HttpOnly cookie, issues a new Access Token, and the original request is retried.

## 5. Lecture Lifecycle Flow

1.  **Creation**: Teacher initiates a lecture in a specific Course. `Lecture` document created with status `'recording'`.
2.  **Streaming**: Frontend sends audio chunks. Backend processes them synchronously (WebM -> WAV -> Python AI -> Clean Text -> MongoDB).
3.  **Termination**: Teacher clicks "Stop". Frontend sends `POST /api/lectures/:id/end`. Lecture status changes to `'processing'`.
4.  **Async Handoff**: Backend enqueues a job in BullMQ to trigger the AI Pipeline.
5.  **Completion**: AI Pipeline finishes. Lecture status changes to `'ready'`.

## 6. Transcript Lifecycle Flow

1.  **Capture**: 3s audio chunk recorded via `MediaRecorder`.
2.  **Offline Queue**: Chunk saved to IndexedDB.
3.  **Upload**: Queue processor POSTs chunk to Backend (includes JWT).
4.  **Idempotency Check**: Backend queries MongoDB for `{ lectureId, chunkIndex }`. If exists, return cached text.
5.  **Processing**: FFmpeg memory stream -> Python `faster-whisper` -> Clean Text.
6.  **Persistence**: Save to MongoDB. Delete local IndexedDB chunk on successful 200 OK.

## 7. Smart Timeline Data Model

The Timeline is a derived, client-side view of `TranscriptChunk` data, not a separate database entity.

*   **Model**: `TimelineChunk { chunkIndex, text, startTime, endTime, isHighlighted, topicLabel? }`
*   **Flow**: Frontend fetches all `TranscriptChunks` for a lecture. The UI syncs the audio player's current time with the chunk whose `[startTime, endTime]` range encloses it, driving the visual highlighting and auto-scrolling.

## 8. Embedding / Vector Storage Strategy

*   **Engine**: Qdrant (Self-hosted via Docker).
*   **Model**: `sentence-transformers/all-MiniLM-L6-v2` (Fast, 384-dimensional).
*   **Chunking Strategy**: Raw 3s chunks are too small. The async pipeline groups transcripts into semantic blocks of ~300 tokens with a 50-token overlap before embedding.
*   **Payload**: Qdrant vectors store rich metadata: `chunk_mongo_id`, `lecture_id`, `course_id`, `text`. This allows filtering searches by course/lecture and avoids querying MongoDB for the raw text during retrieval.

## 9. RAG Assistant Retrieval Flow

1.  **Query**: Student asks a question in a Course Assistant context.
2.  **Embedding**: User query is embedded via Python AI service.
3.  **Retrieval**: Qdrant performs a vector similarity search, strictly filtered by `course_id`.
4.  **Context Assembly**: Top-K results' payload `text` and `timestamp` metadata are concatenated.
5.  **Generation**: LLM (GPT-4o-mini) receives system prompt, chat history, and retrieved context to generate a grounded answer with citations.

## 10. Frontend Application Architecture

Feature-sliced React/Vite SPA.

*   **`pages/`**: Route definitions and layout wrappers.
*   **`features/`**: Domain-specific logic, components, and hooks (e.g., `recording/`, `lecture-viewer/`).
*   **`infrastructure/`**: Global concerns (`api/` Axios client, `indexeddb/` storage).
*   **`stores/`**: Zustand state management (`useAuthStore`, `useLectureStore`).
*   **`shared/`**: Reusable UI components (Buttons, Modals) and utilities.

## 11. Shared TypeScript Contract Structure

A dedicated `shared/` directory (symlinked or npm workspace) ensures the Frontend and Backend use identical types.

*   `types/user.ts`: `IUser`, `AuthResponse`
*   `types/course.ts`: `ICourse`, `CreateCourseDto`
*   `types/lecture.ts`: `ILecture`, `LectureStatus`
*   `types/transcript.ts`: `ITranscriptChunk`
*   `types/api.ts`: `ApiResponse<T>`, `ApiError`

## 12. Folder Structure

```text
ai-classroom-platform/
├── frontend/                 # React SPA
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── modules/          # Domain slices (Auth, Course, etc.)
│   │   ├── middleware/
│   │   ├── config/
│   │   └── server.ts
├── ai-service/               # Python FastAPI
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   └── main.py
├── shared/                   # TypeScript interfaces
└── docker-compose.yml
```

## 13. Role-Based Permission Model

*   **Student**: Can view enrolled courses, view completed lectures, ask assistant questions, take quizzes. Cannot start recordings.
*   **Teacher**: Can create courses, manage enrolled students, initiate/end lecture recordings, view all analytics.
*   **Admin**: System-wide access, user management.

## 14. Lecture/Course Ownership Model

Enforced via Service-Layer guards (not just middleware).
*   **Course Ownership**: `Course.teacherId` must match `req.user._id` for modification.
*   **Lecture Recording**: Only the `Teacher` who owns the parent `Course` can upload chunks to a `Lecture`.
*   **Data Isolation**: Students can only fetch `Lecture` data if `req.user._id` is in `Course.students`.

## 15. Async AI Processing Architecture

Decoupled from the HTTP request cycle.

1.  Backend receives `/lectures/:id/end`.
2.  Backend enqueues `AIPipelineJob` with `lectureId` to BullMQ.
3.  BullMQ Worker picks up the job.
4.  Worker orchestrates sequential calls to Python AI Service:
    *   `/summarize` -> Save to MongoDB
    *   `/quiz` -> Save to MongoDB
    *   Semantic grouping -> `/embed` -> Save to Qdrant
5.  Worker marks `Lecture.status = 'ready'`.

## 16. Redis/BullMQ Integration Boundaries

*   **Redis**: Serves exclusively as the backing store for BullMQ and potential rate-limiting. Not used for persistent app data.
*   **BullMQ**: Handles job retries, backoff strategies, and concurrency control for the heavy AI pipelines, preventing Node.js event loop blocking.

## 17. Synchronous vs. Asynchronous Boundaries

*   **Synchronous (Blocking HTTP)**:
    *   Authentication & CRUD operations.
    *   Audio chunk upload, FFmpeg conversion, and Whisper transcription (`/upload-chunk`). *Note: Must be memory-streamed to keep latency < 1s.*
    *   RAG Assistant chat queries.
*   **Asynchronous (Background Queues)**:
    *   Lecture Summarization.
    *   Quiz / Flashcard generation.
    *   Semantic chunking and Vector Embedding.

## 18. Exact Phase Boundaries for Implementation

1.  **Phase 1: Foundation (Weeks 1-3)**
    *   *Scope*: Auth (JWT), User/Course/Lecture DB Models, API Contracts, basic Dashboard UI, update Chunk Uploader to use Auth.
2.  **Phase 2: Core UX (Weeks 4-6)**
    *   *Scope*: Smart Timeline, Transcript viewing, Local text search, Paginated APIs.
3.  **Phase 3: Async Intelligence (Weeks 7-10)**
    *   *Scope*: Redis/BullMQ integration, Python `/summarize` and `/quiz` endpoints, UI tabs for Summaries and Quizzes.
4.  **Phase 4: RAG & Production (Weeks 11-14)**
    *   *Scope*: Qdrant integration, Python `/embed` and `/chat` endpoints, Assistant UI, Dockerization.
