import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useThemeStore } from "./store/themeStore";
import { useAuthStore } from "./store/authStore";

import MainLayout from "./components/layout/MainLayout";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LivePublicPage from "./pages/LivePublicPage";
import DashboardPage from "./pages/DashboardPage";
import LiveViewPage from "./pages/LiveViewPage";
import CamerasPage from "./pages/CamerasPage";
import RecordingsPage from "./pages/RecordingsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import FaceAnalyticsPage from "./pages/FaceAnalyticsPage";

/** Redirect ke /login jika belum login */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { theme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik — tidak perlu login */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/live" element={<LivePublicPage />} />

        {/* Area admin — wajib login */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="live"       element={<LiveViewPage />} />
          <Route path="cameras"    element={<CamerasPage />} />
          <Route path="recordings" element={<RecordingsPage />} />
          <Route path="face"       element={<FaceAnalyticsPage />} />
          <Route path="settings"   element={<SettingsPage />} />
          <Route path="users"      element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
