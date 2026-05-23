import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";

export const getLiveKitToken = async (req: Request, res: Response) => {
    const roomId = req.query.roomId as string;
    const userId = req.query.userId as string; // Optional: pass userId if needed, or generate random

    if (!roomId) {
        res.status(400).json({ error: "Missing roomId" });
        return;
    }

    // TODO: Validate Firebase Token if passed in headers

    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";
    const wsUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";

    if (!apiKey || !apiSecret) {
        res.status(500).json({ error: "Server misconfigured" });
        return;
    }

    const participantName = userId || `user-${Math.random().toString(36).substring(7)}`;
    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();

    res.json({ token, wsUrl });
};
