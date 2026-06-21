import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthScreen } from "./components/Authscreen";
import { Dashboard } from "./components/Dashboard";
import { AdminPage } from "./components/pages/AdminPage";

function AppContent() {
  const { user, loading } = useAuth();

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
      <Route path="/admin" element={<AdminPage />} />
      <Route
        path="/"
        element={user ? <Dashboard /> : <AuthScreen />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}