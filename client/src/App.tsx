import { AuthProvider, useAuth } from "./lib/auth";
import { AuthScreen } from "./components/Authscreen";
import { Dashboard } from "./components/Dashboard";

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

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}