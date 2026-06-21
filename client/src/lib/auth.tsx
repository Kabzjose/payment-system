import { createContext, useContext, useState, useEffect, type  ReactNode } from "react";
import { api, type User } from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "payment_demo_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Starts true: on first load we don't yet know if a stored token is valid
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a saved token and validate it
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }

    api
      .me(saved)
      .then((res) => {
        setUser(res.user);
        setToken(saved);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        sessionStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  function persist(newToken: string, newUser: User) {
    sessionStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    persist(res.token, res.user);
  }

  async function register(email: string, name: string, password: string) {
    const res = await api.register({ email, name, password });
    persist(res.token, res.user);
  }

  async function updateProfile(payload: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    if (!token) throw new Error("Not authenticated");
    const res = await api.updateProfile(token, payload);
    // Refresh the in-memory user so the UI reflects changes immediately
    setUser(res.user);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.is_admin ?? false,
        loading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}