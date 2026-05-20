import PDFDocument from "pdfkit";
import { SummaryResponse } from "../summary/summaryService";

export const generatePdfStream = (
  summaryData: SummaryResponse,
  sessionId: string,
  outStream: NodeJS.WritableStream
) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Pipe the document to the provided stream
      doc.pipe(outStream);

      // Title
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .text("Lecture Summary & Study Notes", { align: "center" })
        .moveDown(0.5);

      // Session ID
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("gray")
        .text(`Session ID: ${sessionId}`, { align: "center" })
        .moveDown(2);

      // Helper function to render sections cleanly
      const renderSectionHeading = (title: string) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .fillColor("black")
          .text(title)
          .moveDown(0.5);
      };

      const renderBulletPoints = (points: string[]) => {
        doc.font("Helvetica").fontSize(12).fillColor("#333333");
        points.forEach((point) => {
          doc.text(`•  ${point}`, {
            indent: 15,
            align: "justify",
            lineGap: 4,
          });
        });
        doc.moveDown(1.5);
      };

      // Summary
      if (summaryData.summary) {
        renderSectionHeading("Overview");
        doc
          .font("Helvetica")
          .fontSize(12)
          .fillColor("#333333")
          .text(summaryData.summary, { align: "justify", lineGap: 4 })
          .moveDown(1.5);
      }

      // Topics Discussed
      if (summaryData.topics && summaryData.topics.length > 0) {
        renderSectionHeading("Topics Discussed");
        const topicsStr = summaryData.topics.join("  |  ");
        doc
          .font("Helvetica-Oblique")
          .fontSize(12)
          .fillColor("#555555")
          .text(topicsStr, { lineGap: 4 })
          .moveDown(1.5);
      }

      // Key Points
      if (summaryData.key_points && summaryData.key_points.length > 0) {
        renderSectionHeading("Key Points");
        renderBulletPoints(summaryData.key_points);
      }

      // Study Notes
      if (summaryData.study_notes && summaryData.study_notes.length > 0) {
        renderSectionHeading("Study Notes");
        renderBulletPoints(summaryData.study_notes);
      }

      // Action Items
      if (summaryData.action_items && summaryData.action_items.length > 0) {
        renderSectionHeading("Action Items");
        doc.font("Helvetica").fontSize(12).fillColor("#333333");
        summaryData.action_items.forEach((item) => {
          doc.text(`[ ]  ${item}`, {
            indent: 15,
            align: "justify",
            lineGap: 4,
          });
        });
        doc.moveDown(1.5);
      }

      // Finalize the PDF
      doc.end();

      outStream.on("finish", resolve);
      outStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
