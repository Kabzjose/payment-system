import { type ReactNode, useState } from "react";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";
import { useTheme } from "../../lib/theme";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}

function SunIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/>
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );
}

export function AdminLayout({ activeTab, onNavigate, children, pageTitle, pageSubtitle }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <AdminSidebar
        activeTab={activeTab}
        onNavigate={onNavigate}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-[var(--sidebar-width)] min-h-screen flex flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-5 lg:px-8 h-[58px] shrink-0"
          style={{
            background: "var(--bg-topbar)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "var(--surface-shadow)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            id="admin-mobile-menu-toggle"
            className="lg:hidden btn-ghost p-2 -ml-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop page title */}
          <div className="hidden lg:block">
            <h1 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{pageSubtitle}</p>
            )}
          </div>

          {/* Mobile center title */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{pageTitle}</h1>
          </div>

          {/* Right: theme toggle */}
          <div className="flex items-center">
            <button
              id="admin-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--border)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 lg:px-8 py-8 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
