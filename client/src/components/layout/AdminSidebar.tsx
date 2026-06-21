import { type ReactNode, useState } from "react";
import { useAuth } from "../../lib/auth";

export type AdminTab = "overview" | "payments" | "users";

interface NavItem {
  id: AdminTab;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "payments",
    label: "Payments",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ activeTab, onNavigate, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const [hovered, setHovered] = useState<AdminTab | null>(null);

  function handleNav(tab: AdminTab) {
    onNavigate(tab);
    onMobileClose();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #EF4444, #F97316)", color: "#fff" }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Admin</p>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Control Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hovered === item.id;
          return (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
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
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span
                className="shrink-0"
                style={{ color: isActive ? "#818CF8" : isHovered ? "var(--text-secondary)" : "var(--text-label)" }}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Admin badge */}
        <div className="px-3 mb-2">
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
          >
            ● Admin Session
          </span>
        </div>

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #EF4444, #F97316)", color: "#fff" }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-[10px] truncate font-mono" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-ghost w-full text-left text-xs justify-start gap-2"
          onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
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
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="fixed left-0 top-0 h-screen z-50 lg:hidden transition-transform duration-300 flex flex-col"
        style={{ width: "var(--sidebar-width)", transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
