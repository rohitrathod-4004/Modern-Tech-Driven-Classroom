import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassrooms } from "../hooks/useClassrooms";
import type { Classroom } from "../hooks/useClassrooms";
import { useLectures } from "../hooks/useLectures";
import { ClassroomCard } from "../components/classroom/ClassroomCard";
import { ClassroomAssistant } from "../components/ClassroomAssistant";
import { apiClient } from "../services/apiClient";

export const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading, error: _error, createClassroom, deleteClassroom } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const { lectures, loading: lecturesLoading, fetchLectures, startLecture } = useLectures(
    selectedClassroom?._id ?? null
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [showStartForm, setShowStartForm] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [riskData, setRiskData] = useState<{
    atRisk: any[];
    improving: any[];
    inactive: any[];
  } | null>(null);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const data = await apiClient.get<any>("/api/analytics/faculty/risk");
        setRiskData(data);
      } catch (err) {
        console.error("Failed to fetch risk analytics:", err);
      }
    };
    fetchRisk();
  }, []);

  useEffect(() => {
    if (selectedClassroom) fetchLectures();
  }, [selectedClassroom, fetchLectures]);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await createClassroom(newClassName.trim());
      setNewClassName("");
      setShowCreateForm(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClassroom = async (classroomId: string) => {
    if (!window.confirm("Are you sure you want to delete this classroom? All associated lectures, transcripts, and summaries will be permanently deleted.")) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteClassroom(classroomId);
      setSelectedClassroom(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete classroom");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newLectureTitle.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const session = await startLecture(selectedClassroom._id, newLectureTitle.trim());
      setNewLectureTitle("");
      setShowStartForm(false);
      navigate(`/lecture/live?session_id=${session.session_id}`);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Stats Bar */}
      <div className="dashboard-topbar">
        <div>
          <h2 className="dashboard-title">Faculty Dashboard</h2>
          <p className="dashboard-subtitle">Manage your classrooms and lecture sessions.</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-chip">{classrooms.length} Classroom{classrooms.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {actionError && <div className="dashboard-error">⚠️ {actionError}</div>}

      {riskData && (riskData.atRisk.length > 0 || riskData.improving.length > 0 || riskData.inactive.length > 0) && (
        <div className="dashboard-risk-panel" style={{
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          color: "#fff"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", fontWeight: "bold" }}>Classroom Success & Risk Dashboard</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* At Risk Column */}
            <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#ef4444", fontSize: "0.95rem", display: "flex", justifyContent: "space-between" }}>
                <span>⚠️ At-Risk Students</span>
                <span style={{ background: "#ef4444", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.75rem" }}>{riskData.atRisk.length}</span>
              </h4>
              {riskData.atRisk.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No students currently at risk.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {riskData.atRisk.map((s: any) => (
                    <div key={s.id} style={{ background: "rgba(15, 23, 42, 0.4)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{s.email}</div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                        <span style={{ color: "#ef4444" }}>LHS: {s.lhs}%</span>
                        <span style={{ color: "#94a3b8" }}>Quiz Avg: {s.quizAverage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Improving Column */}
            <div style={{ background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "12px", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#22c55e", fontSize: "0.95rem", display: "flex", justifyContent: "space-between" }}>
                <span>📈 Improving Students</span>
                <span style={{ background: "#22c55e", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.75rem" }}>{riskData.improving.length}</span>
              </h4>
              {riskData.improving.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No students with recent improvement spikes.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {riskData.improving.map((s: any) => (
                    <div key={s.id} style={{ background: "rgba(15, 23, 42, 0.4)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{s.email}</div>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                        <span style={{ color: "#22c55e" }}>LHS: {s.lhs}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inactive Column */}
            <div style={{ background: "rgba(148, 163, 184, 0.05)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: "12px", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#94a3b8", fontSize: "0.95rem", display: "flex", justifyContent: "space-between" }}>
                <span>💤 Inactive (7+ Days)</span>
                <span style={{ background: "#94a3b8", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.75rem" }}>{riskData.inactive.length}</span>
              </h4>
              {riskData.inactive.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No inactive students in the past week.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {riskData.inactive.map((s: any) => (
                    <div key={s.id} style={{ background: "rgba(15, 23, 42, 0.4)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{s.email}</div>
                      <div style={{ fontSize: "0.8rem", color: "#f59e0b" }}>
                        Last Active: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Never"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column — Classrooms */}
        <div className="dashboard-col">
          <div className="dashboard-section-header">
            <h3>Your Classrooms</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm((p) => !p)}>
              {showCreateForm ? "Cancel" : "+ Create Classroom"}
            </button>
          </div>

          {showCreateForm && (
            <form className="dashboard-inline-form" onSubmit={handleCreateClassroom}>
              <input
                className="dashboard-input"
                type="text"
                placeholder="Classroom name..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={actionLoading}>
                {actionLoading ? "Creating..." : "Create"}
              </button>
            </form>
          )}

          {classroomsLoading ? (
            <p className="dashboard-empty">Loading classrooms...</p>
          ) : classrooms.length === 0 ? (
            <p className="dashboard-empty">No classrooms yet. Create your first one!</p>
          ) : (
            <div className="classroom-list">
              {classrooms.map((c) => (
                <ClassroomCard
                  key={c._id}
                  classroom={c}
                  role="faculty"
                  onSelect={setSelectedClassroom}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column — Selected Classroom Detail */}
        <div className="dashboard-col">
          {selectedClassroom ? (
            <>
              <div className="dashboard-section-header">
                <div>
                  <h3>{selectedClassroom.name}</h3>
                  <span className="classroom-code-badge">Code: {selectedClassroom.code}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowStartForm((p) => !p)}>
                    {showStartForm ? "Cancel" : "▶ Start Lecture"}
                  </button>
                  <button 
                    className="btn btn-stop btn-sm" 
                    onClick={() => handleDeleteClassroom(selectedClassroom._id)}
                    disabled={actionLoading}
                    style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                  >
                    Delete Class
                  </button>
                </div>
              </div>

              {showStartForm && (
                <form className="dashboard-inline-form" onSubmit={handleStartLecture}>
                  <input
                    className="dashboard-input"
                    type="text"
                    placeholder="Lecture title..."
                    value={newLectureTitle}
                    onChange={(e) => setNewLectureTitle(e.target.value)}
                    required
                  />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={actionLoading}>
                    {actionLoading ? "Starting..." : "Start"}
                  </button>
                </form>
              )}

              <ClassroomAssistant
                classroomId={selectedClassroom._id}
                classroomName={selectedClassroom.name}
              />

              <h4 style={{ color: "#94a3b8", margin: "1.5rem 0 0.75rem 0", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lecture History</h4>


              {lecturesLoading ? (
                <p className="dashboard-empty">Loading...</p>
              ) : lectures.length === 0 ? (
                <p className="dashboard-empty">No lectures yet. Start your first one!</p>
              ) : (
                <div className="lecture-list">
                  {lectures.map((lec) => (
                    <div
                      key={lec._id}
                      className="lecture-item"
                      onClick={() => navigate(
                        lec.status === 'active' 
                          ? `/lecture/live?session_id=${lec.session_id}` 
                          : `/lecture/${lec.session_id}`
                      )}
                    >
                      <div className="lecture-item-title">{lec.title}</div>
                      <div className="lecture-item-meta">
                        <span className={`lecture-status ${lec.status}`}>{lec.status}</span>
                        <span>{new Date(lec.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="dashboard-placeholder">
              <p>👈 Select a classroom to manage lectures</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
