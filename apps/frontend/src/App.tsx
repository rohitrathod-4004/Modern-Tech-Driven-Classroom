import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { Dashboard } from "./features/dashboard/Dashboard";
import { LectureTranscriber } from "./features/recording/LectureTranscriber";
import { LectureViewer } from "./features/lecture/LectureViewer";
import { LiveLectureViewer } from "./features/lecture/LiveLectureViewer";
import { LectureLibrary } from "./features/lecture/LectureLibrary";
import { AppShell } from "./components/layout/AppShell";
import { CourseList } from "./features/courses/CourseList";
import { CourseDetails } from "./features/courses/CourseDetails";
import { HealthBadge } from "./components/HealthBadge";
import { useAuthStore } from "./infrastructure/stores/authStore";
import { api } from "./infrastructure/api";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AIWorkspace } from "./features/workspace/AIWorkspace";

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    // Attempt to silently refresh token on initial load if we have an HttpOnly cookie
    api.post('/api/auth/refresh')
      .then(res => {
        const accessToken = res.data.data.accessToken;
        // Now fetch user details
        return api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(userRes => {
          setAuth(userRes.data.data.user, accessToken);
        });
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [setAuth, logout]);

  if (isInitializing) {
    return <div>Loading session...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/courses/:courseId/live" element={<LiveLectureViewer />} />
            <Route path="/lectures" element={<LectureLibrary />} />
            <Route path="/record" element={<LectureTranscriber />} />
            <Route path="/courses/:courseId/lectures/:lectureId" element={<LectureViewer />} />
            <Route path="/workspace" element={<AIWorkspace />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <HealthBadge />
    </BrowserRouter>
  );
}

export default App;
