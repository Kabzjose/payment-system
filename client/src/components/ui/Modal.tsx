import { type ReactNode, useEffect } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  maxWidth?: "sm" | "md" | "lg";
}

export function Modal({ children, onClose, maxWidth = "md" }: ModalProps) {
  const maxWidthClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[maxWidth];

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl scale-in`}
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
        role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClose: () => void;
}

export function ModalHeader({ title, subtitle, badge, onClose }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
      style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 min-w-0">
        {badge}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
          {subtitle && <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-3 transition-colors text-sm"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        aria-label="Close">
        ✕
      </button>
    </div>
  );
}
