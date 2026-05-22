# AI Classroom Intelligence Platform — Deployment Guide

This repository contains all services needed to run the AI Classroom Platform.

## System Architecture Overview

1. **Frontend**: React + Vite client (default: `localhost:5173`)
2. **Backend**: Express + TypeScript server (default: `localhost:3001`)
3. **Whisper Service**: FastAPI + faster-whisper microservice (default: `localhost:8000`)
4. **Database**: MongoDB (default: `localhost:27017`)
5. **Vector DB**: Qdrant (default: `localhost:6333`)

---

## Local Development Startup

To run the complete platform natively in developer mode:

### 1. Prerequisites
* **Node.js**: v18+ or v20+ installed.
* **Python**: v3.10+ installed with a virtual environment configured in `python-services/whisper-service/venv`.
* **MongoDB**: A running local instance or Atlas URI.
* **Qdrant**: A running local instance (typically running on port `6333`).
* **FFmpeg**: Must be installed on the host system and available in the shell PATH (required for audio conversions and master audio stitching).

### 2. Startup Execution
1. Install dependencies in the root workspace:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory (based on `.env.example`) and configure your `GEMINI_API_KEY`.
3. Launch all services concurrently using:
   ```bash
   npm run dev:all
   ```
This launches the backend Node.js process, the Vite frontend client, and the FastAPI Whisper server concurrently.

---

## Docker Compose Deployment

To build and run all services containerized:

### 1. Prerequisites
* **Docker** and **Docker Compose** installed.
* Ensure ports `3001`, `5173`, `8000`, `6333`, and `27017` are unoccupied on the host machine.

### 2. Deployment Steps
1. Create a root `.env` file and set the required variables:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
2. Build and run the containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
3. Check container statuses:
   ```bash
   docker-compose ps
   ```

---

## Qdrant Database Collection Settings

The semantic search indexing uses **`gemini-embedding-2`** with a target output dimensionality of **`768`**. 
Upon completing a lecture session, the indexing service will verify and automatically construct the collection `transcript_chunks` with `768` dimensions using the Cosine distance metric.

If you are transitioning vectors from older versions of the embedding engine (3072 dimensions), the system will automatically drop and recreate the collection.
