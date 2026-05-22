# Implementation Plan: Phase 6C - Product Completion & Navigation Wiring

## Goal
Eliminate all fake/dead UI, wire up the navigation system, build out the AI Workspace and Settings systems, and resolve the `SmartTimeline` crash. Make the product feel cohesive and real. 

## 1. Runtime Crash Resolution (Blocker)
**Problem:** The app crashes when opening READY lectures due to a reported hook-order violation or blank-screen error in `SmartTimeline` / `LectureViewer`.
**Plan:** 
- Inspect the frontend logs dynamically to trace the exact line causing the crash when a READY lecture loads.
- Verify `react-virtuoso`'s rendering interaction with `TimelineEntry` and `TimelineLoadingShell`.
- Ensure NO hooks (`useState`, `useEffect`, `useTimelineStore`, `useParams`, etc.) are hidden behind conditional logic or early returns in the component tree.
- **Verification:** Successfully open a fully processed lecture without a white screen.

## 2. Settings System Implementation
**Current State:** Settings button exists, but functionality is dead/placeholder.
**Plan:**
- Create a real `Settings` page with a professional SaaS layout (Sidebar tabs: Profile, Appearance, Account).
- Implement Profile editing (Name update) with form validation and API requests to `/api/auth/me`.
- Implement Password change flow.
- Ensure the user's `name` and `email` display accurately from `authStore`.
- Implement a clear "Logout" action.
- Add success/error toast notifications and loading indicators during saves.

## 3. AI Workspace Creation
**Current State:** AI Workspace is decorative.
**Plan:**
- Create an `AI Workspace` page that lists all lectures and their AI processing metadata.
- Display `aiStatus`, timestamps, and generated assets.
- **Action Controls:** Add "Regenerate Summary", "Regenerate Quiz", "Regenerate Flashcards", etc. 
- Ensure regenerations are strictly asynchronous (triggering the backend BullMQ pipeline via `POST /api/admin/lectures/:id/reprocess-ai`) without blocking the UI.
- Handle empty states gracefully.

## 4. Lecture Processing Visibility
**Current State:** Users only see a static "AI Processing" state.
**Plan:**
- Build a live status timeline in the `EmptyLectureState` when `aiStatus` is not `completed`.
- Track stages: `queued` -> `summarizing` -> `embedding` -> `indexing` -> `generating study materials` -> `completed` / `failed`.
- Add a manual "Retry" button if the status hits `failed`.

## 5. Navigation & Product Cohesion Audit
**Plan:**
- **Sidebar & Topbar:** Audit every single navigation item. If a route is empty or a button is dead, it will be completed or removed.
- **Breadcrumbs & Titles:** Add dynamic page titles and breadcrumb navigation where appropriate.
- **Loading & Empty States:** Unify the design of loading skeletons and empty states across Dashboard, Courses, and Lectures.
- **Polish:** Ensure smooth transitions, valid deep links (timestamp hydration), and no console spam.

## 6. Verification
- [ ] READY lectures load without crashing or blank screens.
- [ ] Settings page updates profile and handles logout.
- [ ] AI Workspace lists lectures and successfully triggers background regeneration.
- [ ] Processing lectures display a live progress timeline.
- [ ] No dead UI, fake metrics, or "Coming Soon" placeholders remain.
