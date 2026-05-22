# Phase 2 Architecture Blueprint: Smart Timeline & Lecture Consumption

This document serves as the absolute architectural blueprint for Phase 2. It dictates the transition from a raw transcription system into a robust, scalable Lecture Intelligence Platform, focusing exclusively on the consumption experience without destabilizing the core pipeline.

---

## 1. Smart Timeline Architecture

### Design Concept
The Smart Timeline transforms linear transcript text into an interactive, time-bound interface. It synchronizes automatically with an audio/video player, highlights the active spoken segment, auto-scrolls to keep the speaker in view, and allows users to click any text to instantly jump to that exact moment in the lecture.

### Frontend Architecture & Data Flow
- **Timeline Store**: A dedicated Zustand store (`useTimelineStore`) manages the active chunk index, auto-scroll toggle state, and playback timestamp.
- **Data Model (`TimelineChunk`)**: The timeline will **NOT** use the raw backend `TranscriptChunk` directly. Instead, the frontend will derive a `TimelineChunk` model. 
  - *Why?* Currently, Whisper processes 3-second audio slices independently. Its internal `start_time` is relative to the slice (e.g., 0.0s to 3.0s), not the entire lecture. 
  - *Transformation*: The frontend (or a backend aggregation layer) must calculate the absolute `absoluteStartTime = (chunkIndex * 3) + whisperStartTime`. The `TimelineChunk` standardizes these absolute timings for the player.

### Rendering Strategy & State Management
- **Virtualization**: We will use a virtualized list (e.g., `@tanstack/react-virtual` or `react-virtuoso`). Only chunks currently visible in the DOM (plus a small overscan buffer) will be rendered. This ensures stable 60FPS scrolling even for a 3-hour lecture containing 3,600 chunks.
- **State Segregation**: The active time/highlight state changes many times per second. To prevent full-page re-renders, the highlighting logic will be decoupled from the main chunk list render, utilizing memoized chunk components that only re-render if their specific `isActive` prop changes.

---

## 2. Lecture Viewer System Design

### Component Hierarchy
```text
apps/frontend/src/features/lecture/
├── LectureViewer.tsx               (Main Page Shell, handles layout & routing)
├── components/
│   ├── LectureHeader.tsx           (Metadata: Title, Teacher, Status, Duration)
│   ├── MediaContainer.tsx          (Audio/Video Player wrapper)
│   ├── timeline/
│   │   ├── SmartTimeline.tsx       (Virtual list container)
│   │   ├── TimelineEntry.tsx       (Memoized individual chunk row)
│   │   └── TimelineControls.tsx    (Search bar, Auto-scroll toggle)
│   └── future/                     (Placeholders for AI Tabs, Summaries, RAG)
```

### State Ownership
- `useLectureStore`: Owns static lecture metadata.
- `useTimelineStore`: Owns playback time, active chunk ID, user-scroll interrupts, and search queries.

### API Interaction & Lazy Loading
- **Initial Load**: Fetches `Lecture` metadata immediately.
- **Chunk Loading**: Transcript chunks are fetched independently.
- **Mobile Responsiveness**: The layout will use CSS Grid. On desktop, the media player and timeline sit side-by-side. On mobile, the media player sticks to the top of the viewport while the timeline scrolls beneath it.

---

## 3. Transcript Search Architecture

### Design Strategy: Client-Side vs Server-Side
For Phase 2, we will implement **Client-Side Search**. 
- *Why?* A 1-hour lecture produces roughly 10-15KB of transcript text. Loading the entire text into browser memory is trivial. A client-side search provides instant feedback (zero network latency) and allows us to easily map search hits to absolute timestamps for playback navigation.

### Implementation Details
- **Indexing**: Upon fetching the chunks, the frontend will build a lightweight local index (or simply iterate a derived string array).
- **Highlighting**: When a query matches, a custom `<Highlight>` utility will wrap the matching substring in a `<mark>` tag within the `TimelineEntry`.
- **Navigation**: Search results will generate an array of matching `TimelineChunk` references. Up/Down UI arrows will allow the user to jump between matches, triggering the virtual list to scroll to that chunk's index.
- **Debouncing**: Input will be debounced by 300ms using a custom `useDebounce` hook to prevent rapid re-filtering during typing.

---

## 4. Transcript Pagination & Performance

### Pagination Model
We will adopt a **Cursor-Based / Offset Pagination** model on the backend, but for the immediate frontend timeline experience, we will employ a **"Fetch All Lite"** pattern.

- *Rationale*: To allow client-side search and instant timeline seeking, the frontend needs the start/end times and text of all chunks.
- *Optimization*: The backend API will return a stripped-down DTO (excluding heavy metadata). 3,600 chunks (1 hour) as a JSON array of `{ id, index, text, start }` is extremely small (<100KB gzipped).
- *Virtualization*: While the *data* is fully loaded into memory, the *DOM* is highly paginated via windowing. Only ~20 `TimelineEntry` DOM nodes will ever exist simultaneously.

### Chunk Ordering Guarantees
The backend API must enforce `.sort({ chunkIndex: 1 })`. The frontend will blindly trust this array index for binary search operations.

---

## 5. Playback Synchronization Design

### Synchronization Algorithm
We must efficiently determine: *"Given current time T, which chunk is active?"*
Since chunks are strictly ordered by `absoluteStartTime`, we will use **Binary Search**. Finding the active chunk among 5,000 chunks takes ~12 operations instead of 5,000, ensuring near-zero CPU usage.

### `requestAnimationFrame` vs `setInterval`
- The media player's `timeupdate` event fires infrequently (roughly 4 times a second), which can cause visual stuttering for highlighting.
- Instead, we will use `requestAnimationFrame`. While the audio is playing, an rAF loop will poll the audio element's `currentTime`, perform the binary search, and update the Zustand store if the active chunk index has changed.

### Auto-Scroll Interruption
If the user manually scrolls the virtual list, auto-scrolling must temporarily detach. A `userScrolled` flag in the store will pause automatic jumping until the user clicks a "Resume Sync" button.

---

## 6. Backend API Design

We will introduce the following REST APIs in `LectureController`:

#### `GET /api/courses/:courseId/lectures/:lectureId/timeline`
- **Purpose**: Fetches the lightweight timeline chunks for a lecture.
- **Response**:
```typescript
interface TimelineResponse {
  data: Array<{
    id: string;
    chunkIndex: number;
    absoluteStartTime: number; // Computed by backend: (chunkIndex * 3) + whisperStart
    text: string;
  }>;
}
```

#### `GET /api/courses/:courseId/lectures/:lectureId/search` (Future-Proofing)
- **Purpose**: Server-side search fallback for massively scaled platforms. (Not implemented in UI yet, but contract defined).
- **Query Params**: `?q=equation&limit=20`

---

## 7. Frontend Architecture Changes

### Structure Additions
```text
apps/frontend/src/
├── infrastructure/
│   └── stores/
│       └── timelineStore.ts        (New Zustand store for playback/scroll sync)
├── hooks/
│   ├── usePlaybackSync.ts          (Handles rAF loop and binary search)
│   └── useDebounce.ts              (For search input)
```

### Integration with Existing Code
- `Recorder.tsx` remains totally untouched.
- The legacy `Transcript.tsx` will be preserved for the live-recording view. The new `SmartTimeline.tsx` will be exclusively used in the `LectureViewer.tsx` for completed/processing lectures. This ensures zero risk to the recording pipeline.

---

## 8. Scalability & Future Compatibility

This architecture prepares for Phase 3+ in the following ways:
- **BullMQ / AI Summaries**: The viewer shell includes placeholder tabs. When BullMQ finishes processing an AI summary, the frontend simply fetches it and displays it in the "Summary" tab. The timeline remains structurally separate.
- **Semantic Topic Grouping**: Because we are using virtualization and derived `TimelineChunk`s, we can later inject "Topic Header" nodes into the virtual list data array without breaking the audio synchronization.
- **Vector Search / RAG**: The timeline architecture allows the RAG assistant (future) to return a specific `absoluteStartTime`. Clicking a citation in the chat will simply call `timelineStore.seekTo(time)`, instantly scrolling the timeline and moving the audio player.

---

## 9. Risks & Stability Analysis

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **DOM Bloat / Browser Crash** | High | Rendering thousands of chunks will freeze the browser. Mitigation: Mandatory use of a virtualization library (`react-virtuoso`). |
| **Highlighting Stutter** | Medium | React re-rendering a massive list every millisecond during playback. Mitigation: rAF sync loop + `React.memo` on Timeline entries so only the active node re-renders. |
| **Whisper Time Drift** | High | If an audio chunk is silent or fails, Whisper might return skewed timings, breaking absolute time calculations. Mitigation: Backend computation `(chunkIndex * 3) + start_time` guarantees a hard mathematical anchor relative to the overall stream, ignoring internal Whisper drift. |
| **Recorder Regression** | Critical | Breaking the live recording view. Mitigation: We will leave `Transcript.tsx` alone and build `SmartTimeline.tsx` as a completely new component used only in read-only mode. |

---

## 10. Exact Recommended Phase 2 Execution Order

To minimize regression risk and API churn, implementation must strictly follow this order:

1. **Backend Computation Layer**: Implement the `absoluteStartTime` derivation logic in the backend `LectureService` and create the `GET /timeline` API endpoint.
2. **Frontend Foundation**: Install virtualization dependencies. Create `timelineStore.ts` and the `TimelineChunk` interface.
3. **Smart Timeline Component**: Build `SmartTimeline.tsx` with virtualization. Fetch data from the new API and render the raw text without audio sync.
4. **Playback Sync Engine**: Implement `usePlaybackSync.ts` (binary search + rAF). Add a dummy audio player to `LectureViewer` and verify chunks highlight as time progresses.
5. **Timeline Interactivity**: Add click-to-seek functionality (clicking text moves audio time) and auto-scroll logic.
6. **Search & Refinement**: Implement the debounced client-side search, highlight `<mark>` injections, and search navigation arrows.
7. **UI Polish & Shell**: Finalize the `LectureViewer` layout, making it responsive and preparing empty UI states for future AI tabs.

## User Review Required
Please review this comprehensive architectural blueprint. If it meets your standards for a production-level SaaS timeline, approve it, and we will begin executing Step 1!
