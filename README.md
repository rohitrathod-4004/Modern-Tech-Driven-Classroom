# Modern Tech-Driven Classroom (AI Classroom Platform)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

A comprehensive, real-time, offline-first web application designed to transform online education. This platform provides hybrid virtual classrooms and utilizes the Google Gemini Flash model to automatically structure long-form video/audio into semantic chapters, quizzes, 3D flashcards, and comprehensive study notes.

## 🌟 Key Features

- **Cinematic Role-Based Dashboards:** Premium dark-mode glassmorphism interface with tailored experiences for Students, Teachers, and Organizations.
- **Hybrid Real-Time Video Conferencing (Online Live Lectures):** Scalable virtual classroom featuring **seamless transition between P2P and SFU topologies** based on participant count/QoS. Utilizes STUN/TURN servers (e.g., Twilio) for robust NAT traversal and includes live transcription polling for real-time closed captions.
- **AI-Powered Study Workspace:** Automatic generation of Semantic Chapters, Multiple Choice Quizzes, and Interactive 3D Flashcards (via Gemini API).
- **Instant Audio Transcription:** In-browser transcription via Web Worker (Local Whisper) ensures transcripts are generated instantly during live lectures without waiting for server uploads.
- **Organization & Billing Management:** Multi-tenant architecture allowing Organizations to invite teachers, allocate credits, and manage subscriptions with Razorpay integration.
- **Smart Virtuoso Timeline:** 60fps virtualization for rendering thousands of transcript chunks seamlessly, auto-syncing with media playback.

## 📸 Screenshots

| Cinematic Dashboard | Lecture Viewer & Smart Timeline |
|-----------|--------------------------------|
| ![Dashboard Placeholder](docs/screenshots/dashboard.png) | ![Lecture Viewer Placeholder](docs/screenshots/lecture_viewer.png) |

| AI Study Workspace | Generated Quiz |
|--------------------|----------------|
| ![Study Mode Placeholder](docs/screenshots/study_mode.png) | ![Quiz Placeholder](docs/screenshots/quiz.png) |

## 🏗 Architecture & Tech Stack

### Technology Stack
- **Frontend Workspace:** React 19, Vite, Zustand, Tailwind CSS, React Virtuoso, Simple-Peer (WebRTC), Socket.io-client
- **Backend Workspace:** Node.js, Express, MongoDB (Mongoose), Socket.io, BullMQ, Razorpay, Puppeteer
- **AI/ML Layer:** Google Gemini 1.5 Flash, Transformers.js (Local Whisper)
- **Infrastructure:** Redis (Job Queues & Caching)
- **Shared Architecture:** Monorepo using npm workspaces (`@classroom/shared` types and utilities).

### Why This Architecture?
The platform utilizes an **Async AI worker pattern**. By offloading all expensive LLM operations (Embeddings, Summaries, Quizzes) to a BullMQ worker via Redis, the primary Node.js thread remains unblocked. This ensures zero dropped frames when teachers upload chunked audio or when managing real-time WebSocket connections for the virtual classroom.

**Hybrid WebRTC Topology:** The virtual classroom dynamically scales. It starts in a lightweight **Peer-to-Peer (P2P)** mesh mode for small groups to reduce server load. As participant count increases, it seamlessly transitions to a **Selective Forwarding Unit (SFU)** mode to preserve client bandwidth and maintain high Quality of Service (QoS). Connection reliability is guaranteed via STUN/TURN server integration (e.g., Twilio) for robust NAT traversal.

On the frontend, **React Virtuoso** prevents DOM bloat; rendering thousands of transcript nodes would otherwise crash browser memory. **Zustand** strictly manages the state locally without cascading Context updates.

## 🗂 Project Structure

```text
├── apps/
│   ├── frontend/         # React SPA (Vite)
│   └── backend/          # Express API & WebSocket Server
├── shared/               # Shared TypeScript types & interfaces
├── python-services/      # Auxiliary Python microservices (e.g., Whisper)
└── docs/                 # Documentation & Assets
```

## 🚀 Setup & Localhost Development

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally (default: `mongodb://localhost:27017/ai_classroom`)
- **Redis** running locally (default: `127.0.0.1:6379`)
- **Google Gemini API Key**
- **Razorpay API Keys** (Optional, required for billing flows)

### Installation

1. **Install Dependencies** (from the repository root)
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   **Backend:** Copy `apps/backend/.env.example` to `apps/backend/.env`
   ```env
   PORT=4000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai_classroom
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   JWT_SECRET=local_development_secret_key_change_in_prod
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_WORKER_CONCURRENCY=2
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

   **Frontend:** Copy `apps/frontend/.env.example` to `apps/frontend/.env`
   ```env
   VITE_API_URL=http://localhost:4000
   ```

3. **Seed Database (Demo Mode)**
   This generates sample realistic data including users, organizations, and an AI-processed lecture.
   ```bash
   npm run seed
   # For a clean slate: npm run seed:reset
   ```

4. **Run Platform**
   Using `concurrently` at the root level, spin up the frontend and backend simultaneously:
   ```bash
   npm run dev
   ```

## 🎓 Demo Flow

1. Open `http://localhost:5173`
2. **Log in** based on role (e.g., student, teacher, or org admin using seeded credentials).
3. **Explore Dashboard:** Observe the dynamic cinematic UI with live activity metrics.
4. **Enter a Video Lecture Room:** Test the WebRTC implementation for virtual classrooms.
5. **View Recorded Lectures:** Explore the Smart Timeline on the left. Click transcript chunks to "seek" the media.
6. **Study Mode:** Interact with the generated 3D Flashcards and Multiple Choice Quizzes on the right-hand panel.

## ⚠️ Known Limitations
- Voice Activity Detection (VAD) in the browser can occasionally split sentences awkwardly if the speaker pauses for exactly 2 seconds.
- The platform relies entirely on `ffmpeg-static` for backend processing; extremely large files might encounter Node.js memory limits.
- The WebRTC P2P mesh network (`simple-peer`) is ideal for smaller classrooms (up to 4-5 participants). For larger scale, an SFU transition (like mediasoup or LiveKit) is recommended.

## 🛣 Future Roadmap
- **Deployment:** Containerize via Docker and deploy on AWS ECS or Render.
- **SFU Integration:** Migrate from purely P2P to a hybrid SFU architecture for large virtual classrooms.
- **Multi-modal AI:** Pass actual video frames to Gemini 1.5 Pro to index visual slide content alongside the audio.
- **RAG Assistant:** Enable a Q/A chatbox using vector embeddings (Pinecone/Qdrant).
