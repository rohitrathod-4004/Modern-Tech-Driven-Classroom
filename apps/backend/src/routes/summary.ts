import express, { Request, Response, RequestHandler } from "express";
import { generateSummary } from "../services/summary/summaryService";
import { generatePdfStream } from "../services/export/pdfExportService";
import { TranscriptChunk } from "../models/TranscriptChunk";

const router = express.Router();

const generateSummaryHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    // Fetch all chunks for the session, ordered by chunk_index
    const chunks = await TranscriptChunk.find({ session_id }).sort({ chunk_index: 1 });
    
    if (!chunks || chunks.length === 0) {
      res.status(404).json({ error: "No transcript found for the given session" });
      return;
    }

    // Combine chunks into full text
    const fullText = chunks.map((chunk) => chunk.text).join(" ");
    
    // Generate summary
    const summaryResult = await generateSummary(fullText);
    
    res.json(summaryResult);
  } catch (error) {
    console.error("[SummaryRouter] Error generating summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.post("/generate-summary", generateSummaryHandler);

const exportSummaryHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id, summary, key_points, action_items, topics, study_notes } = req.body;

    if (!session_id || !summary) {
      res.status(400).json({ error: "session_id and summary data are required" });
      return;
    }

    const summaryData = {
      summary,
      key_points: key_points || [],
      action_items: action_items || [],
      topics: topics || [],
      study_notes: study_notes || []
    };

    const fileName = `lecture-summary-${session_id}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Stream the PDF directly to the response
    await generatePdfStream(summaryData, session_id, res);

  } catch (error) {
    console.error("[SummaryRouter] Error generating PDF export:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error during PDF generation" });
    }
  }
};

router.post("/export-summary", exportSummaryHandler);

export default router;
