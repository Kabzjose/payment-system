import { type ReactNode, useState } from "react";
import { useAuth } from "../../lib/auth";
import { EditProfileModal } from "../modals/EditProfileModal";

export type Page = "overview" | "card" | "mpesa" | "history" | "subscription";

interface NavItem {
  id: Page;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  { id: "card", label: "Card Payment",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  { id: "mpesa", label: "M-Pesa",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  { id: "history", label: "History",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  { id: "subscription", label: "Subscription",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  txCount?: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ activePage, onNavigate, txCount, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [hovered, setHovered] = useState<Page | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  function handleNav(page: Page) {
    onNavigate(page);
    onMobileClose();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", color: "#fff" }}>
            L
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Ledger</p>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Payments Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const isHovered = hovered === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNav(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left relative"
              style={{
                background: isActive ? "var(--accent-muted)" : isHovered ? "var(--bg-elevated)" : "transparent",
                color: isActive ? "#818CF8" : isHovered ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "var(--accent)" }} />
              )}
              <span className="shrink-0" style={{ color: isActive ? "#818CF8" : isHovered ? "var(--text-secondary)" : "var(--text-label)" }}>
                {item.icon}
              </span>
              <span className="text-sm font-medium truncate">{item.label}</span>
              {item.id === "history" && txCount !== undefined && txCount > 0 && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{ background: "var(--accent-muted)", color: "#818CF8" }}>
                  {txCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: "var(--bg-elevated)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)", color: "#fff" }}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-[10px] truncate font-mono" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
            style={{ color: "var(--text-label)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-label)")}
            title="Edit profile"
            aria-label="Edit profile"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <button onClick={logout} className="btn-ghost w-full text-left text-xs justify-start gap-2"
          onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-30" style={{ width: "var(--sidebar-width)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onMobileClose} />
      )}

      {/* Mobile drawer */}
      <aside className="fixed left-0 top-0 h-screen z-50 lg:hidden transition-transform duration-300 flex flex-col"
        style={{ width: "var(--sidebar-width)", transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <SidebarContent />
      </aside>

      {/* Edit profile modal — rendered outside sidebar so it layers above everything */}
      {showProfile && <EditProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
