import React from "react";

interface ArchitectureModalProps {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose }) => {
  return (
    <div className="arch-modal-overlay" onClick={onClose}>
      <div className="arch-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="arch-modal-header">
          <h2>System Architecture</h2>
          <button className="arch-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="arch-modal-body">
          <div className="arch-description">
            <div className="arch-desc-section">
              <h4>Frontend</h4>
              <p>React application that records audio, manages offline queues, and renders transcripts and summaries.</p>
            </div>
            <div className="arch-desc-section">
              <h4>Backend</h4>
              <p>Node.js/Express server handling orchestrations, audio conversion, and API routing.</p>
            </div>
            <div className="arch-desc-section">
              <h4>Whisper Service</h4>
              <p>FastAPI Python service running optimized Whisper models for accurate, hardware-accelerated transcription.</p>
            </div>
            <div className="arch-desc-section">
              <h4>MongoDB</h4>
              <p>NoSQL database for persisting session chunks and ensuring idempotency across uploads.</p>
            </div>
            <div className="arch-desc-section">
              <h4>Gemini AI</h4>
              <p>Google's LLM used to analyze full transcripts and extract actionable summaries and study notes.</p>
            </div>
            <div className="arch-desc-section">
              <h4>Offline Sync</h4>
              <p>Client-side queue that caches audio chunks when offline and safely uploads them when the network returns.</p>
            </div>
          </div>

          <h3 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#38bdf8", textAlign: "center" }}>
            Data Flow Pipeline
          </h3>

          <div className="arch-flow-container">
            <div className="arch-card">🎤 Mic (Raw Audio)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">Frontend Queue (Offline First)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">Backend API (Conversion)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">Whisper Service (Transcription)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">MongoDB (Persistence)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">Gemini Summary (Analysis)</div>
            <div className="arch-arrow">↓</div>
            <div className="arch-card">PDF Export (Reporting)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
