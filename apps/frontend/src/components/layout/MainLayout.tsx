import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      color: isActive ? "#ffffff" : "#94a3b8",
      textDecoration: "none",
      padding: "0.75rem 1.25rem",
      borderRadius: "10px",
      fontSize: "0.95rem",
      fontWeight: isActive ? "600" : "500",
      background: isActive ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)" : "transparent",
      borderLeft: isActive ? "3px solid #818cf8" : "3px solid transparent",
      boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    };
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <div style={{ 
        width: "270px", 
        background: "rgba(11, 15, 25, 0.8)", 
        borderRight: "1px solid var(--glass-border)", 
        display: "flex", 
        flexDirection: "column",
        backdropFilter: "blur(20px)"
      }}>
        <div style={{ padding: "1.75rem 1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
          <h2 style={{ 
            margin: 0, 
            background: "linear-gradient(135deg, #ffffff, #38bdf8)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            fontSize: "1.4rem",
            fontWeight: 800,
            fontFamily: "Outfit, sans-serif"
          }}>
            🏫 Smart Classroom
          </h2>
        </div>
        
        <nav style={{ flex: 1, padding: "2rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <Link to="/" style={getLinkStyle("/")}>
            <span>🏠</span> Dashboard
          </Link>
          <Link to="/lecture/live" style={getLinkStyle("/lecture/live")}>
            <span>🎙️</span> Live Lecture Tool
          </Link>
          <Link to="/search" style={getLinkStyle("/search")}>
            <span>🔍</span> Global Search
          </Link>
          <Link to="/revision" style={getLinkStyle("/revision")}>
            <span>📝</span> Revision Hub
          </Link>
        </nav>

        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--glass-border)" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem", 
            marginBottom: "1.25rem",
            background: "rgba(255,255,255,0.03)", 
            padding: "0.75rem", 
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.02)"
          }}>
            <div style={{ 
              width: "32px", 
              height: "32px", 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #818cf8, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "white"
            }}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8", textTransform: "capitalize" }}>
                Role: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{user?.role}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              width: "100%", 
              padding: "0.6rem", 
              background: "rgba(244, 63, 94, 0.1)", 
              border: "1px solid rgba(244, 63, 94, 0.2)", 
              color: "#fca5a5", 
              borderRadius: "10px", 
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
};
