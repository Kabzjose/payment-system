import { AuthProvider, useAuth } from "./lib/auth";
import { AuthScreen } from "./components/Authscreen";
import { Dashboard } from "./components/Dashboard";

function AppContent() {
  const { user, loading } = useAuth();

  // While we're checking sessionStorage for a saved token,
  // show nothing rather than flashing the login screen then the dashboard.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <span className="font-mono text-[12px] text-[#64748B]">Loading...</span>
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