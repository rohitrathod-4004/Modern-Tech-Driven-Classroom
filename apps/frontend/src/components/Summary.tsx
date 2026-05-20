import React, { useState } from "react";

interface SummaryResponse {
  summary: string;
  key_points: string[];
  action_items: string[];
  topics?: string[];
  study_notes?: string[];
}

interface SummaryProps {
  sessionId: string;
  demoData?: SummaryResponse | null;
}

export const Summary: React.FC<SummaryProps> = ({ sessionId, demoData }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryResponse | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    // If demo mode is active, simulate generation and populate instantly
    if (demoData) {
      setTimeout(() => {
        setData(demoData);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate summary");
      }

      const result: SummaryResponse = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("Summary generation error:", err);
      setError(err.message || "An unexpected error occurred while generating the summary.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!data) return;
    
    setExporting(true);
    setError(null);

    try {
      // In demo mode with no backend, we just return to avoid crashes.
      // But we can also attempt the request and let it fail gracefully.
      const response = await fetch("http://localhost:3001/export-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId, ...data }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate PDF");
      }

      // Download the PDF Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lecture-summary-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF export error:", err);
      setError(err.message || "An unexpected error occurred while generating the PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>AI Summary</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className="btn btn-primary" 
            onClick={generateSummary} 
            disabled={loading || exporting}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
          
          {data && (
            <button 
              className="btn btn-reset" 
              onClick={exportPDF}
              disabled={exporting || loading}
            >
              {exporting ? "Exporting PDF..." : "📄 Download PDF"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="summary-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div className="summary-loading">
          <div className="spinner"></div>
          <p>Analyzing transcript and extracting key insights...</p>
        </div>
      )}

      {data && !loading && (
        <div className="summary-content fade-in">
          <div className="summary-section">
            <h3>Overview</h3>
            <p>{data.summary}</p>
          </div>

          {data.topics && data.topics.length > 0 && (
            <div className="summary-section">
              <h3>Topics Discussed</h3>
              <div className="topics-container">
                {data.topics.map((topic, idx) => (
                  <span key={idx} className="topic-tag">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {data.key_points && data.key_points.length > 0 && (
            <div className="summary-section">
              <h3>Key Points</h3>
              <ul>
                {data.key_points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {data.study_notes && data.study_notes.length > 0 && (
            <div className="summary-section">
              <h3>Study Notes</h3>
              <ul>
                {data.study_notes.map((note, idx) => (
                  <li key={idx} className="study-note-item">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {data.action_items && data.action_items.length > 0 && (
            <div className="summary-section">
              <h3>Action Items</h3>
              <ul className="action-list">
                {data.action_items.map((item, idx) => (
                  <li key={idx}>
                    <span className="action-checkbox"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
