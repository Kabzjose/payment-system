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
    <div className="min-h-screen flex items-center justify-center bg-[#0E1116] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#8B8578] uppercase mb-2">
            Ledger
          </div>
          <h1 className="font-serif text-3xl text-[#F7F5F0]">
            {mode === "login" ? "Sign in" : "Create an account"}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#F7F5F0] rounded-lg p-6 space-y-4"
        >
          {mode === "register" && (
            <div>
              <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#C9402E] bg-[#C9402E]/8 border border-[#C9402E]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[14px] font-medium hover:bg-[#1a1f28] transition-colors disabled:opacity-50"
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
          className="w-full mt-4 text-[13px] text-[#8B8578] hover:text-[#F7F5F0] transition-colors"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}