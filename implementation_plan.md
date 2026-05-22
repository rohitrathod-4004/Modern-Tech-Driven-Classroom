# Implementation Plan: Phase 1A — Foundation Core

This plan outlines the strategy, architecture, and step-by-step execution to implement Phase 1A. It focuses exclusively on establishing a stable backend architecture, authentication, and the frontend shell, while strictly preserving the current audio transcription pipeline.

## 1. Implementation Strategy for Phase 1A

Our strategy is to build the "Modular Monolith" foundation. We will:
1. **Shared Contracts First**: Define TypeScript interfaces and Zod schemas in a shared package so both frontend and backend are tightly coupled to the same data shapes.
2. **Backend Restructuring**: Move from the current flat Express setup (`server.ts`, `routes/`) to a structured `modules/` pattern (Routes → Controllers → Services → Repositories → Models).
3. **Authentication Layer**: Implement JWT (Access + Refresh tokens), bcrypt hashing, and HTTP-only cookies for secure session management.
4. **Domain Modeling**: Create Mongoose schemas for `User`, `Course`, and `Lecture`. Update the existing `TranscriptChunk` schema to reference the new `Lecture` ID rather than an anonymous string session ID.
5. **Frontend Shell**: Implement Zustand stores for auth, an Axios interceptor to handle token refresh, protected React Router routes, and basic UI shells for Login, Register, and Dashboard.

**Crucial Constraint**: We will *not* implement any AI features, Redis, BullMQ, or Qdrant in this phase. The existing `/upload-chunk` flow will be preserved but protected behind auth middleware and associated with a specific `lectureId`.

## 2. Updated Folder Structure

```text
ai-classroom-platform/
├── shared/                       <-- NEW: Shared types & schemas
│   ├── types/
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── lecture.ts
│   │   └── api.ts
│   └── schemas/
│       └── auth.schema.ts
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── modules/          <-- NEW: Modular monolith structure
│   │   │   │   ├── auth/
│   │   │   │   ├── course/
│   │   │   │   └── lecture/
│   │   │   ├── middleware/       <-- NEW: Auth & Validation guards
│   │   │   ├── utils/
│   │   │   ├── db/
│   │   │   └── server.ts
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── features/         <-- NEW: Feature-sliced architecture
│   │   │   │   ├── auth/
│   │   │   │   └── dashboard/
│   │   │   ├── infrastructure/   <-- NEW: API clients & Stores
│   │   │   │   ├── api.ts
│   │   │   │   └── stores/
│   │   │   │       └── authStore.ts
│   │   │   ├── components/
│   │   │   └── App.tsx
└── python-services/
    └── whisper-service/          <-- UNCHANGED
```

## 3. Database Schemas

**User Schema**
```typescript
{
  _id: ObjectId,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: Date
}
```

**Course Schema**
```typescript
{
  _id: ObjectId,
  title: { type: String, required: true },
  description: String,
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentCode: { type: String, unique: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lectures: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }],
  isActive: { type: Boolean, default: true }
}
```

**Lecture Schema (Replaces existing simple Session)**
```typescript
{
  _id: ObjectId,
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['recording', 'processing', 'ready', 'failed'], default: 'recording' },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date
}
```

**TranscriptChunk Schema (Updated)**
```typescript
{
  _id: ObjectId,
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  startTime: Number,
  endTime: Number,
  // Compound index: { lectureId: 1, chunkIndex: 1 } (Unique)
}
```

## 4. API Contracts

**POST `/api/auth/register`**
*   Request: `{ name, email, password, role }`
*   Response: `{ data: { accessToken, user } }` + `HttpOnly` Refresh Cookie

**POST `/api/auth/login`**
*   Request: `{ email, password }`
*   Response: `{ data: { accessToken, user } }` + `HttpOnly` Refresh Cookie

**GET `/api/auth/me`** (Protected)
*   Response: `{ data: { user } }`

**POST `/api/courses`** (Protected, Teacher only)
*   Request: `{ title, description }`
*   Response: `{ data: { course } }`

**POST `/api/courses/:courseId/lectures`** (Protected, Teacher, Course Owner)
*   Request: `{ title }`
*   Response: `{ data: { lecture } }`

**POST `/api/upload-chunk`** (Protected, Preserved logic)
*   Request (FormData): `file`, `lectureId`, `courseId`, `chunkIndex`, `language`
*   Response: `{ data: { text, latency_ms, status } }`

## 5. Backend Step-by-Step Implementation

1.  **Shared Types**: Create `shared` folder at root, define `IUser`, `ICourse`, `ILecture`, `ITranscriptChunk` and Zod validation schemas. Link it to `apps/backend` and `apps/frontend` using npm workspaces or relative path imports.
2.  **Dependencies**: Install `bcrypt`, `jsonwebtoken`, `zod`, `cookie-parser` in backend.
3.  **Models**: Create `User`, `Course`, `Lecture` models. Update `TranscriptChunk` model.
4.  **Middleware**: Implement `authenticate` (verifies JWT), `authorize` (verifies role), and `validate` (validates body against Zod).
5.  **Auth Module**: Implement `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`.
6.  **Course & Lecture Modules**: Implement basic CRUD and ownership logic for creating courses and starting lectures.
7.  **Refactor Upload**: Move existing upload logic into `modules/lecture/lecture.controller.ts` or keep it isolated, but wrap it in `authenticate` middleware and update to use `lectureId` instead of `sessionId`.

## 6. Frontend Step-by-Step Implementation

1.  **Dependencies**: Install `react-router-dom`, `zustand`, `lucide-react` (icons).
2.  **State Management**: Create `useAuthStore` in `infrastructure/stores/authStore.ts`.
3.  **API Client**: Create Axios instance in `infrastructure/api.ts` with request (attach token) and response (handle 401 & refresh) interceptors.
4.  **Routing**: Setup React Router with a `ProtectedRoute` wrapper.
5.  **Pages - Auth**: Create `/login` and `/register` pages.
6.  **Pages - Dashboard**: Create basic shell for `/dashboard` listing user's courses and recent lectures.
7.  **Adapt Recorder**: Update `Recorder.tsx` to receive `lectureId` and `courseId` instead of generating a local `sessionId`, and ensure API calls use the authenticated Axios instance.

## User Review Required

Does this Phase 1A implementation plan align perfectly with your architectural blueprint? Please provide approval to begin Step 1 (Shared Types and Backend Setup).
