import { useState } from "react";
import { useAuth } from "../lib/auth";
import { usePayments } from "../hooks/usePayments";
import { CardTab } from "./tabs/Cardtab";
import { MpesaTab } from "./tabs/MpesaTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { SubscriptionTab } from "./tabs/SubscriptionTab";

type Tab = "card" | "mpesa" | "history" | "subscription";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("card");
  const { unified, loading, error, refresh } = usePayments();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "card",         label: "Card",         icon: "💳" },
    { id: "mpesa",        label: "M-Pesa",       icon: "📱" },
    { id: "history",      label: "History",      icon: "📋" },
    { id: "subscription", label: "Subscription", icon: "🔄" },
  ];

  const totalStripe = unified
    .filter((p) => p.source === "stripe" && p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalMpesa = unified
    .filter((p) => p.source === "mpesa" && p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#0E1116]">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-[#8B8578] uppercase mb-0.5">
            Ledger
          </div>
          <div className="font-serif text-[#F7F5F0] text-lg leading-tight">
            {user?.name}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          {totalStripe > 0 && (
            <div className="text-right">
              <div className="font-mono text-[10px] text-[#8B8578] uppercase tracking-wide">
                Card
              </div>
              <div className="font-mono text-[13px] text-[#F7F5F0]">
                ${(totalStripe / 100).toFixed(2)}
              </div>
            </div>
          )}
          {totalMpesa > 0 && (
            <div className="text-right">
              <div className="font-mono text-[10px] text-[#8B8578] uppercase tracking-wide">
                M-Pesa
              </div>
              <div className="font-mono text-[13px] text-[#F7F5F0]">
                KES {totalMpesa.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="text-[12px] font-mono text-[#8B8578] hover:text-[#F7F5F0] transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Tab bar */}
      <div className="border-b border-white/10 px-4 sm:px-8">
        <div className="flex gap-1 pt-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-md text-[13px] font-mono transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#F7F5F0] text-[#0E1116]"
                  : "text-[#8B8578] hover:text-[#F7F5F0]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === "history" && unified.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#8B8578]/20 text-[10px] font-mono">
                  {unified.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — all kept mounted, hidden with CSS */}
      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-8">

        <div className={activeTab === "card" ? "block" : "hidden"}>
          <div className="bg-[#F7F5F0] rounded-lg p-6">
            <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#8B8578] uppercase mb-5">
              Card payment
            </h2>
            <CardTab onSuccess={() => { refresh(); setActiveTab("history"); }} />
          </div>
        </div>

        <div className={activeTab === "mpesa" ? "block" : "hidden"}>
          <div className="bg-[#F7F5F0] rounded-lg p-6">
            <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#8B8578] uppercase mb-5">
              M-Pesa payment
            </h2>
            <MpesaTab onSuccess={() => { refresh(); setActiveTab("history"); }} />
          </div>
        </div>

        <div className={activeTab === "history" ? "block" : "hidden"}>
          <div className="bg-[#F7F5F0] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E2DA]">
              <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#8B8578] uppercase">
                Transaction history
              </h2>
            </div>
            <HistoryTab
              payments={unified}
              loading={loading}
              error={error}
              onRefresh={refresh}
            />
          </div>
        </div>

        <div className={activeTab === "subscription" ? "block" : "hidden"}>
          <div className="bg-[#F7F5F0] rounded-lg p-6">
            <SubscriptionTab />
          </div>
        </div>

      </main>
    </div>
  );
}