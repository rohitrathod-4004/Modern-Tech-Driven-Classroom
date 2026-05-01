import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/connection";
import uploadRouter from "./routes/upload";
import transcriptRouter from "./routes/transcript";

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
app.use("/", uploadRouter);
app.use("/", transcriptRouter);

// Connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Backend running at http://localhost:${PORT}`);
  });
});

export default app;
