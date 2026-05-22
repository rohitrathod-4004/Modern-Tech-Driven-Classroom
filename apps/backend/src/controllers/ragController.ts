import { Request, Response, RequestHandler } from "express";
import { askLecture, askClassroom } from "../services/ragService";
import { QdrantUnavailableError } from "../services/qdrantService";

export const askLectureHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const { question } = req.body;

    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const response = await askLecture(session_id, question);
    res.json(response);
  } catch (error: any) {
    console.error("[ragController] askLectureHandler:", error);
    if (
      error.name === "QdrantUnavailableError" ||
      error instanceof QdrantUnavailableError ||
      error.message?.includes("fetch failed") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      res.status(503).json({
        error: "semantic-search-unavailable",
        message: "Semantic search service is temporarily unavailable. Please try again later.",
      });
      return;
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const askClassroomHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { classroom_id } = req.params;
    const { question } = req.body;

    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const response = await askClassroom(classroom_id, question);
    res.json(response);
  } catch (error: any) {
    console.error("[ragController] askClassroomHandler:", error);
    if (
      error.name === "QdrantUnavailableError" ||
      error instanceof QdrantUnavailableError ||
      error.message?.includes("fetch failed") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      res.status(503).json({
        error: "semantic-search-unavailable",
        message: "Semantic search service is temporarily unavailable. Please try again later.",
      });
      return;
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
