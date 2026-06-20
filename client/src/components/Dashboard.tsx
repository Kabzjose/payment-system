import { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { DashboardLayout } from "./layout/DashboardLayout";
import { type Page } from "./layout/Sidebar";
import { OverviewPage } from "./pages/OverviewPage";
import { CardPage } from "./pages/CardPage";
import { MpesaPage } from "./pages/MpesaPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  overview:     { title: "Overview",          subtitle: "Your payments at a glance" },
  card:         { title: "Card Payment",      subtitle: "Pay securely with Stripe" },
  mpesa:        { title: "M-Pesa Payment",    subtitle: "Safaricom mobile money" },
  history:      { title: "Transaction History", subtitle: "All your payments" },
  subscription: { title: "Subscriptions",     subtitle: "Plans & billing" },
};

export function Dashboard() {
  const [activePage, setActivePage] = useState<Page>("overview");
  const { unified, loading, error, refresh } = usePayments();

  const meta = PAGE_META[activePage];

  function handlePaymentSuccess() {
    refresh();
    setActivePage("history");
  }

  return (
    <DashboardLayout
      activePage={activePage}
      onNavigate={setActivePage}
      txCount={unified.length}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {activePage === "overview" && (
        <OverviewPage payments={unified} loading={loading} onNavigate={setActivePage} />
      )}
      {activePage === "card" && (
        <CardPage onSuccess={handlePaymentSuccess} />
      )}
      {activePage === "mpesa" && (
        <MpesaPage onSuccess={handlePaymentSuccess} />
      )}
      {activePage === "history" && (
        <HistoryPage
          payments={unified}
          loading={loading}
          error={error}
          onRefresh={refresh}
          onNavigate={setActivePage}
        />
      )}
      {activePage === "subscription" && (
        <SubscriptionPage />
      )}
    </DashboardLayout>
  );
}