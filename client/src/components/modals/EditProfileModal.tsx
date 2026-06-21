import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth";
import { Modal, ModalHeader } from "../ui/Modal";
import { ApiError } from "../../lib/api";

interface EditProfileModalProps {
  onClose: () => void;
}

type Section = "info" | "password";

export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [section, setSection] = useState<Section>("info");

  // Info fields
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmitInfo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updateProfile({
        name: name !== user?.name ? name : undefined,
        email: email !== user?.email ? email : undefined,
      });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="sm">
      <ModalHeader
        title="Edit Profile"
        subtitle={user?.email}
        onClose={onClose}
        badge={
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", color: "#fff" }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
        }
      />

      {/* Tab switcher */}
      <div
        className="flex gap-1 px-5 pt-4 pb-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["info", "password"] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSection(s); setError(null); setSuccess(null); }}
            className="px-3 py-2 text-[12px] font-medium font-mono capitalize transition-colors relative"
            style={{
              color: section === s ? "var(--accent)" : "var(--text-muted)",
              borderBottom: section === s ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {s === "info" ? "Personal Info" : "Change Password"}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Feedback banners */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-[13px] font-medium"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="px-4 py-3 rounded-lg text-[13px] font-medium"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
          >
            {success}
          </div>
        )}

        {/* ── Personal Info ─────────────────────────────────── */}
        {section === "info" && (
          <form onSubmit={handleSubmitInfo} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="edit-name">Display Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="input-base"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="edit-email">Email Address</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={saving || (name === user?.name && email === user?.email)}
              className="btn-primary w-full"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}

        {/* ── Change Password ────────────────────────────────── */}
        {section === "password" && (
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="input-base"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="input-base"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-base"
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary w-full"
            >
              {saving ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
