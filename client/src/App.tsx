import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { AuthScreen } from "./components/Authscreen";
import { Dashboard } from "./components/Dashboard";
import { AdminPage } from "./components/pages/AdminPage";

function AppContent() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <span className="font-mono text-[12px] text-[#8B8578] animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Admin route — redirect non-admins to home */}
      <Route
        path="/admin"
        element={
          !user ? <AuthScreen /> :
          isAdmin ? <AdminPage /> :
          <Navigate to="/" replace />
        }
      />

      {/* User route — redirect admins to admin dashboard */}
      <Route
        path="/"
        element={
          !user ? <AuthScreen /> :
          isAdmin ? <Navigate to="/admin" replace /> :
          <Dashboard />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}