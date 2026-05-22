import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ 
        background: "var(--glass-bg)", 
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(16px)",
        padding: "2.5rem", 
        borderRadius: "16px", 
        width: "90%", 
        maxWidth: "400px",
        boxShadow: "var(--shadow-lg)"
      }}>
        <h2 style={{ 
          color: "#f8fafc", 
          textAlign: "center", 
          marginBottom: "1.75rem",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 800,
          background: "linear-gradient(135deg, #ffffff, #818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "1.75rem"
        }}>
          Smart Classroom Login
        </h2>
        
        {error && <div className="error-toast" style={{ marginBottom: "1.25rem", marginTop: 0 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", color: "#cbd5e1", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="dashboard-input"
              style={{ width: "100%", padding: "0.75rem 1rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "#cbd5e1", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="dashboard-input"
              style={{ width: "100%", padding: "0.75rem 1rem" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%", padding: "0.85rem" }}>
            Sign In
          </button>
        </form>

        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "1.75rem", fontSize: "0.9rem" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--color-secondary)", fontWeight: 600, textDecoration: "none" }}>Register</Link>
        </p>
      </div>
    </div>
  );
};
