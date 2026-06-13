import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function AuthScreen() {
  const { login, register } = useAuth();
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
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
    } catch (err) {
      // ApiError messages come straight from the backend
      // (e.g. "Invalid credentials", "Email already registered")
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#64748B] uppercase mb-2">
            Ledger
          </div>
          <h1 className="font-serif text-3xl text-[#1E293B]">
            {mode === "login" ? "Sign in" : "Create an account"}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFFFF] rounded-lg p-6 space-y-4 border border-[#E2E8F0]"
        >
          {mode === "register" && (
            <div>
              <label className="block text-[12px] font-mono text-[#64748B] mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-mono text-[#64748B] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#64748B] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] text-[14px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-md bg-[#3B82F6] text-[#FFFFFF] text-[14px] font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full mt-4 text-[13px] text-[#64748B] hover:text-[#3B82F6] transition-colors"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}