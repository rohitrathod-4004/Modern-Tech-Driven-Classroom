import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { connectDB } from "./db/connection";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import mongoose from "mongoose";
import { getRedisClient } from "./infrastructure/redis/redisClient";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";

import uploadRouter from "./routes/upload";
import transcriptRouter from "./routes/transcript";
import authRouter from "./modules/auth/auth.routes";

import lectureRouter from "./modules/lecture/lecture.routes";
import courseRouter from "./modules/course/course.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import searchRouter from "./modules/search/search.routes";
import adminRouter from "./modules/admin/admin.routes";
import organizationRouter from "./modules/organization/organization.routes";
import billingRouter from "./modules/billing/billing.routes";
import analyticsRouter from "./modules/analytics/analytics.routes";
import videoRouter from "./modules/video/video.routes";
import { globalErrorHandler } from "./middleware/error.middleware";
import { startLectureWorker } from "./infrastructure/queue/lecture.worker";
import { recoverStrandedAIJobs } from "./infrastructure/queue/queue.recovery";
import { initializeAIProviders } from "./infrastructure/ai/providers";

const LECTURES_UPLOAD_DIR = path.join(__dirname, '../uploads/lectures');
const app = express();
const PORT = env.PORT;

// Middleware
app.use(pinoHttp({ 
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health'
  }
}));
app.use(cors({
  origin: env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Global API rate limiting (applies to all /api routes)
app.use("/api", apiRateLimiter);

// Health check
app.get("/health", async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "ok" : "down";
  let redisStatus = "down";
  try {
    const redis = getRedisClient();
    if (redis.status === "ready" || redis.status === "connect" || redis.status === "connecting") {
      redisStatus = "ok";
    } else {
      redisStatus = redis.status; // Pass the raw status to help debug
    }
  } catch (e) {
    redisStatus = "error";
  }

  const status = mongoStatus === "ok" && redisStatus === "ok" ? 200 : 503;
  
  res.status(status).json({
    server: "ok",
    mongodb: mongoStatus,
    redis: redisStatus,
    worker: "ok" // Assuming ok if server is running in this monolithic setup
  });
});

// Serve stored lecture audio files
app.use('/uploads/lectures', express.static(LECTURES_UPLOAD_DIR));

// Convenience endpoint: GET /api/audio/:lectureId
// Redirects to the static file if audio has been assembled, 404 otherwise
app.get('/api/audio/:lectureId', (req, res) => {
  const { lectureId } = req.params;
  const audioPath = path.join(LECTURES_UPLOAD_DIR, lectureId, 'audio.webm');
  if (fs.existsSync(audioPath)) {
    res.redirect(`/uploads/lectures/${lectureId}/audio.webm`);
  } else {
    res.status(404).json({ error: 'Audio not available for this lecture' });
  }
});

// Modular Routes (New Structure)
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/courses", courseRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/search", searchRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/billing", billingRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/video", videoRouter);
app.use("/api", lectureRouter);

// Legacy/Existing Routes (Preserved for backwards compatibility)
app.use("/", uploadRouter);
app.use("/", transcriptRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Connect to MongoDB, then start server
connectDB().then(async () => {
  initializeAIProviders();
  startLectureWorker();
  await recoverStrandedAIJobs();
  
  app.listen(PORT, () => {
    logger.info(`[server] Backend running at http://localhost:${PORT}`);
  });
});

export default app;