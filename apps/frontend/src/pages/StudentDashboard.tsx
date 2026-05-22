import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassrooms } from "../hooks/useClassrooms";
import type { Classroom } from "../hooks/useClassrooms";
import { useLectures } from "../hooks/useLectures";
import { ClassroomCard } from "../components/classroom/ClassroomCard";
import { ClassroomAssistant } from "../components/ClassroomAssistant";
import { apiClient } from "../services/apiClient";

interface StudentHealth {
  lhs: number;
  quizAverage: number;
  flashcardMastery: number;
  attendanceScore: number;
  revisionActivity: number;
  bookmarkActivity: number;
}

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading, joinClassroom } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const { lectures, loading: lecturesLoading, fetchLectures } = useLectures(
    selectedClassroom?._id ?? null
  );

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const [healthData, setHealthData] = useState<StudentHealth | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await apiClient.get<StudentHealth>("/api/analytics/student/health");
        setHealthData(data);
      } catch (err) {
        console.error("Failed to fetch student health:", err);
      }
    };
    fetchHealth();
  }, []);

  useEffect(() => {
    if (selectedClassroom) fetchLectures();
  }, [selectedClassroom, fetchLectures]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      await joinClassroom(joinCode.trim());
      setJoinSuccess("Successfully joined classroom!");
      setJoinCode("");
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" };
    if (score >= 60) return { label: "Average", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" };
    return { label: "At Risk", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h2 className="dashboard-title">Student Dashboard</h2>
          <p className="dashboard-subtitle">Access your classrooms and lecture materials.</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-chip">{classrooms.length} Class{classrooms.length !== 1 ? "es" : ""}</div>
        </div>
      </div>

      {healthData && (
        <div className="dashboard-health-card" style={{
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          color: "#fff"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "1.1rem" }}>My Learning Health Score</h4>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>Based on attendance, quizzes, flashcards, and revision logs.</p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: getHealthStatus(healthData.lhs).bg,
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: `1px solid ${getHealthStatus(healthData.lhs).color}`
            }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: getHealthStatus(healthData.lhs).color }}>{healthData.lhs}%</span>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", color: getHealthStatus(healthData.lhs).color }}>
                {getHealthStatus(healthData.lhs).label}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <div className="health-metric-tile" style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Quiz Average</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.25rem" }}>{healthData.quizAverage}%</div>
            </div>
            <div className="health-metric-tile" style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Flashcard Mastery</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.25rem" }}>{healthData.flashcardMastery}%</div>
            </div>
            <div className="health-metric-tile" style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Attendance Score</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.25rem" }}>{healthData.attendanceScore}%</div>
            </div>
            <div className="health-metric-tile" style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Revision Activity</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.25rem" }}>{healthData.revisionActivity}%</div>
            </div>
            <div className="health-metric-tile" style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Bookmark Activity</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.25rem" }}>{healthData.bookmarkActivity}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column — Join + Classrooms */}
        <div className="dashboard-col">
          <div className="dashboard-section-header">
            <h3>My Classrooms</h3>
          </div>


          {/* Join Form */}
          <form className="dashboard-join-card" onSubmit={handleJoin}>
            <h4>Join a Classroom</h4>
            <div className="dashboard-inline-form">
              <input
                className="dashboard-input"
                type="text"
                placeholder="Enter join code (e.g. A1B2C3)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={joinLoading}>
                {joinLoading ? "Joining..." : "Join"}
              </button>
            </div>
            {joinError && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>⚠️ {joinError}</p>}
            {joinSuccess && <p style={{ color: "#22c55e", fontSize: "0.85rem", marginTop: "0.5rem" }}>✓ {joinSuccess}</p>}
          </form>

          {classroomsLoading ? (
            <p className="dashboard-empty">Loading classrooms...</p>
          ) : classrooms.length === 0 ? (
            <p className="dashboard-empty">You haven't joined any classrooms yet.</p>
          ) : (
            <div className="classroom-list">
              {classrooms.map((c) => (
                <ClassroomCard
                  key={c._id}
                  classroom={c}
                  role="student"
                  onSelect={setSelectedClassroom}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column — Lecture History */}
        <div className="dashboard-col">
          {selectedClassroom ? (
            <>
              <div className="dashboard-section-header">
                <div>
                  <h3>{selectedClassroom.name}</h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>Lecture History</p>
                </div>
              </div>

              <ClassroomAssistant
                classroomId={selectedClassroom._id}
                classroomName={selectedClassroom.name}
              />


              {lecturesLoading ? (
                <p className="dashboard-empty">Loading lectures...</p>
              ) : lectures.length === 0 ? (
                <p className="dashboard-empty">No lectures recorded yet.</p>
              ) : (
                <div className="lecture-list">
                  {lectures.map((lec) => (
                    <div
                      key={lec._id}
                      className="lecture-item"
                      onClick={() => navigate(`/lecture/${lec.session_id}`)}
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
              <p>👈 Select a classroom to see lecture history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
