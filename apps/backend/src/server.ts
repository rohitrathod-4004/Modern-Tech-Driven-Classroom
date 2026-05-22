import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/connection";
import uploadRouter from "./routes/upload";
import transcriptRouter from "./routes/transcript";
import summaryRouter from "./routes/summary";
import authRouter from "./routes/authRoutes";
import classroomRouter from "./routes/classroomRoutes";
import lectureRouter from "./routes/lectureRoutes";
import searchRouter from "./routes/searchRoutes";
import bookmarkRouter from "./routes/bookmarkRoutes";
import revisionRouter from "./routes/revisionRoutes";
import analyticsRouter from "./routes/analyticsRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/classrooms", classroomRouter);
app.use("/api/lectures", lectureRouter);
app.use("/api/revision", revisionRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/", searchRouter);
app.use("/", bookmarkRouter);
app.use("/", uploadRouter);
app.use("/", transcriptRouter);
app.use("/", summaryRouter);



// Connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Backend running at http://localhost:${PORT}`);
  });
});

export default app;

