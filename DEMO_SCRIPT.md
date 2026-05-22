# 🎤 AI Classroom Platform - Demo Script

This script is designed for a 5–10 minute presentation to professors or evaluators.

## 🌟 Introduction (1 minute)
> "Welcome to the AI Classroom Platform. This is a real-time, offline-first web application designed to transform raw lecture recordings into interactive, AI-powered study materials. The problem we are solving is that students often struggle to review long, unindexed video lectures. Our solution uses Google Gemini Flash and local Whisper AI to instantly structure these lectures into chapters, summaries, flashcards, and quizzes."

## 🧑‍🏫 Flow 1: Teacher Experience (2 minutes)
1. **Login:** Log in using `teacher@demo.com` (password: `password123`).
2. **Dashboard:** Point out the clean, Notion-like UI.
3. **Start Recording:** Go to the "Introduction to Distributed Systems" course. Click "Start Lecture".
4. **Recording Architecture:** 
   > "When I click record, the audio isn't just being saved—it's being actively transcribed in the browser using a WebWorker running Whisper. This means zero latency and offline-first transcription. Once stopped, we sync the chunks to the server via an IndexedDB queue."
5. **End Lecture:** Stop the recording. Explain that a BullMQ worker running in the background now orchestrates the Google Gemini AI pipeline to generate study materials.

## 🧑‍🎓 Flow 2: Student Experience (3 minutes)
1. **Login:** Switch to an incognito window and log in as `student@demo.com`.
2. **Open Seeded Demo:** Open the "Understanding Consensus: Paxos and Raft" lecture.
3. **Smart Timeline:** 
   > "On the left is the Smart Timeline. It uses React Virtuoso to render thousands of transcript chunks at 60 frames per second without crashing the browser."
   *Action:* Click a chunk in the timeline and show how the video/audio seeks to that exact timestamp.
4. **Semantic Chapters:** 
   > "In the AI Insights panel, you can see Gemini has automatically chunked the lecture into semantic topics. Clicking 'Raft: Designed for Understandability' jumps straight to that topic in the video."
5. **Study Workspace:** Toggle to the Study Materials tab.
   > "Instead of passive watching, the student gets active recall tools. Here is an auto-generated multiple-choice quiz about Raft, alongside interactive 3D flashcards that pull definitions directly from the transcript."

## 🚀 Architectural Highlights (1 minute)
> "To achieve this performance, we strictly isolated React Contexts and utilized Zustand for state management. By moving LLM processing to a background Redis queue, the main Node.js thread never blocks, ensuring high concurrency even on free-tier infrastructure."

## ❓ Q&A Preparation
- **Why not process AI in the browser?** LLMs are too large (GBs of VRAM required), but Whisper can run locally for transcription.
- **What happens if Gemini fails?** The queue degrades gracefully; if flashcards fail, the UI handles it, but the core video and timeline remain intact.
