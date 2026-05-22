import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { MainLayout } from "./components/layout/MainLayout";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { LectureViewer } from "./pages/LectureViewer";
import { LectureDetail } from "./pages/LectureDetail";
import { GlobalSearch } from "./pages/GlobalSearch";
import { RevisionHub } from "./pages/RevisionHub";

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Dynamic Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === "faculty") {
    return <FacultyDashboard />;
  }
  return <StudentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="lecture/live" element={<LectureViewer />} />
            <Route path="lecture/:session_id" element={<LectureDetail />} />
            <Route path="search" element={<GlobalSearch />} />
            <Route path="revision" element={<RevisionHub />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
