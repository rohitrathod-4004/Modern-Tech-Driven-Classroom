import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";
import pino from "pino";
import { RoomManager } from "./services/RoomManager";
import { SignalingHandler } from "./socket/signalingHandler";
import { getLiveKitToken } from "./api/livekitTokenRoute";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // Configure properly in production
        methods: ["GET", "POST"],
    },
});

const logger = pino();
const roomManager = new RoomManager();
const signalingHandler = new SignalingHandler(io, roomManager);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate Limiter
const rateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 1, // per 1 second by IP
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip || "unknown");
        next();
    } catch (rejRes) {
        res.status(429).send("Too Many Requests");
    }
});

// Routes
app.post("/api/create-meeting", (_req, res) => {
    // TODO: Generate Meeting ID and store in Redis
    res.json({ roomId: "abc-def-ghi" });
});

app.get("/api/meeting/:id", (req, res) => {
    // TODO: Fetch meeting details
    res.json({ roomId: req.params.id, active: true });
});

app.get("/api/turn-credentials", async (req, res) => {
    const ip = req.ip || "unknown";
    logger.info({ ip, timestamp: Date.now(), turnRequested: true }, "TURN credentials requested");

    // Simple rate limiting check (reuse existing limiter if possible, or just log for now as requested)
    // In a real app, we might want a stricter limit for TURN specifically.

    const turnUrl = process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;

    if (!turnUrl || !turnUsername || !turnPassword) {
        logger.warn("TURN credentials missing in environment variables");
        // Fallback to Google STUN if TURN is not configured
        res.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });
        return;
    }

    res.json({
        iceServers: [
            {
                urls: [turnUrl],
                username: turnUsername,
                credential: turnPassword
            }
        ]
    });
});

app.get("/api/livekit-token", getLiveKitToken);

app.post("/api/simulate-attacker", (_req, res) => {
    // TODO: Trigger attacker simulation in room
    res.json({ status: "simulation_started" });
});

// Socket.io
io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);
    signalingHandler.handleConnection(socket);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
