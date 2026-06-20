import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { useTheme } from "../lib/theme";

function SunIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/>
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, name, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}>
      {/* Ambient gradients — only visible in dark mode */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: "#6366F1" }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-10"
          style={{ background: "#10B981" }} />
      </div>

      {/* Theme toggle */}
      <button id="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"
        className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="relative w-full max-w-sm scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}>
            L
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Sign in to your Ledger account" : "Start managing payments today"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Full Name
                </label>
                <input id="auth-name" type="text" required placeholder="Jane Doe" value={name}
                  onChange={(e) => setName(e.target.value)} className="input-base" />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input id="auth-email" type="email" required placeholder="jane@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="input-base" />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Password
              </label>
              <input id="auth-password" type="password" required minLength={8} placeholder="Min. 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} className="input-base" />
            </div>
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm slide-up"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                <span className="shrink-0">✗</span><span>{error}</span>
              </div>
            )}
            <button id="auth-submit" type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <button id="auth-toggle"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          className="w-full mt-4 text-sm text-center py-2 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--accent)", fontWeight: 500 }}>
            {mode === "login" ? "Create one" : "Sign in"}
          </span>
        </button>
        <p className="text-center text-xs mt-6" style={{ color: "var(--text-label)" }}>
          Secured by Stripe & Safaricom · Ledger v1.0
        </p>
      </div>
    </div>
  );
}