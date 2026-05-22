# Step 1: Shared Types, Schemas, & Backend Setup

This document outlines the exact structure, code, and integration strategy for Step 1 of Phase 1A, incorporating the architectural corrections you requested.

## 1. Exact Shared Folder Structure

We will create a `shared` package at the root level to serve as a single source of truth for types and validation schemas.

```text
ai-classroom-platform/
└── shared/
    ├── package.json          <-- Declares this as a workspace package
    ├── index.ts              <-- Exports everything
    ├── src/
    │   ├── types/
    │   │   ├── index.ts
    │   │   ├── user.ts       <-- Updated with tokenVersion
    │   │   ├── course.ts     <-- Removed lectures[] array
    │   │   ├── lecture.ts    <-- Added duration, chunkCount, etc.
    │   │   ├── transcript.ts <-- Added confidenceScore
    │   │   └── api.ts
    │   └── schemas/
    │       ├── index.ts
    │       ├── auth.schema.ts
    │       ├── course.schema.ts
    │       └── lecture.schema.ts
```

## 2. Shared TypeScript Interfaces

**`src/types/user.ts`**
```typescript
export type UserRole = 'student' | 'teacher' | 'admin';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  enrolledCourses: string[]; // Array of Course IDs
  tokenVersion: number;      // For refresh-token invalidation
  createdAt: Date;
}
```

**`src/types/course.ts`**
```typescript
export interface ICourse {
  _id: string;
  title: string;
  description?: string;
  teacherId: string;         // User ID
  enrollmentCode: string;
  students: string[];        // Array of User IDs
  isActive: boolean;
}
```

**`src/types/lecture.ts`**
```typescript
export type LectureStatus = 'recording' | 'processing' | 'ready' | 'failed';

export interface ILecture {
  _id: string;
  courseId: string;          // Course ID
  teacherId: string;         // User ID
  title: string;
  status: LectureStatus;
  startedAt: Date;
  endedAt?: Date;
  
  // Expanded fields
  durationSeconds?: number;
  chunkCount: number;
  transcriptionLanguage?: string;
  processingLatencyMs?: number;
  audioStoragePath?: string;
}
```

**`src/types/transcript.ts`**
```typescript
export interface ITranscriptChunk {
  _id: string;
  lectureId: string;         // Lecture ID (Backend generated)
  courseId: string;          // Course ID
  chunkIndex: number;
  text: string;
  startTime: number;
  endTime: number;
  confidenceScore?: number;  // Future AI quality handling
}
```

**`src/types/api.ts`**
```typescript
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details?: any;
}
```

## 3. Shared Zod Validation Schemas

**`src/schemas/auth.schema.ts`**
```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['student', 'teacher']).default('student')
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
```

**`src/schemas/course.schema.ts`**
```typescript
import { z } from 'zod';

export const CreateCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional()
});

export const JoinCourseSchema = z.object({
  enrollmentCode: z.string().min(1, "Enrollment code is required")
});
```

**`src/schemas/lecture.schema.ts`**
```typescript
import { z } from 'zod';

export const StartLectureSchema = z.object({
  title: z.string().min(1, "Lecture title is required")
});
```

## 4. Backend Package Dependency Updates

To implement the auth flow and modular routing in Step 2, we need the following packages in `apps/backend`:

**Dependencies to add:**
*   `bcrypt`: Password hashing
*   `jsonwebtoken`: JWT signing and verification
*   `cookie-parser`: Parsing HTTP-only refresh cookies
*   `zod`: Runtime request validation

**Dev Dependencies to add:**
*   `@types/bcrypt`
*   `@types/jsonwebtoken`
*   `@types/cookie-parser`

## 5. Integration Strategy

**How we will share the `shared` code:**
Instead of publishing an npm package or dealing with complex TypeScript path aliases that can break Vite/Node builds, we will set up the root directory as an **npm workspace**.

1.  We will create a `package.json` in the root directory (if it doesn't exist) defining `apps/*` and `shared` as workspaces.
2.  We will initialize a basic `package.json` inside the `shared` folder with `"name": "@classroom/shared"`.
3.  In both `apps/frontend/package.json` and `apps/backend/package.json`, we will add `"@classroom/shared": "*"` to their dependencies.
4.  This allows both the backend and frontend to seamlessly `import { IUser } from '@classroom/shared/types'` with full type-safety and auto-completion, without duplicating code.

## Review Request

Please review the provided schemas, interfaces, and integration strategy. If approved, I will proceed to physically generate these files, update the `package.json` files to establish the workspace, and install the backend dependencies.
