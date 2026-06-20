import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { AuthScreen } from "./components/Authscreen";
import { Dashboard } from "./components/Dashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}
          >
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Loading Ledger...</span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
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