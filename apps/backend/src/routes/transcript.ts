import { Router, Request, Response } from "express";
import { TranscriptChunk } from "../models/TranscriptChunk";
import { Session } from "../models/Session";

const router = Router();

// GET /transcript/:session_id
// Returns full transcript for a session, sorted by chunk_index
router.get("/transcript/:session_id", async (req: Request, res: Response) => {
  const { session_id } = req.params;

  try {
    const session = await Session.findOne({ session_id });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const chunks = await TranscriptChunk.find({ session_id })
      .sort({ chunk_index: 1 })
      .select("-__v -_id");

    const fullText = chunks.map((c) => c.text).join(" ");

    res.json({
      session_id,
      created_at: session.created_at,
      full_text: fullText,
      chunks,
    });
  } catch (err: any) {
    console.error(`[transcript] Failed to retrieve session ${session_id}: ${err.message}`);
    res.status(500).json({ error: "Failed to retrieve transcript" });
  }
});

export default router;
