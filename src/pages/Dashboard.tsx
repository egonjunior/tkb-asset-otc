import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { supabase } from "@/integrations/supabase/client";
import { PremiumHeader } from "@/components/dashboard/PremiumHeader";
import { PremiumKPICards } from "@/components/dashboard/PremiumKPICards";
import { PremiumLiveQuote } from "@/components/dashboard/PremiumLiveQuote";
import { PremiumHistory } from "@/components/dashboard/PremiumHistory";
import { PremiumCTA } from "@/components/dashboard/PremiumCTA";
import { ApprovalLockedQuotes } from "@/components/dashboard/ApprovalLockedQuotes";
import { OperationalNotesList } from "@/components/operational-notes/OperationalNotesList";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { BellNotifications } from "@/components/BellNotifications";
import { useQuery } from "@tanstack/react-query";
import tkbLogo from "@/assets/tkb-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const { binancePrice, tkbPrice, isLoading: priceLoading } = useBinancePrice();

  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, amount, total, status, created_at, network")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(o => ({
        ...o,
        status: o.status as any, // Cast to match expected status union
        createdAt: new Date(o.created_at)
      }));
    },
    enabled: !!user,
  });

  const stats = (() => {
    if (!ordersData) return {
      totalPatrimonio: 0,
      todayVolume: 0,
      completedOperations: 0,
      successRate: 0,
      avgVolume: 0,
      maxOperation: 0,
      pendingAmount: 0,
    };

    let total = 0, today = 0, completed = 0, max = 0, pending = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    ordersData.forEach((o) => {
      if (o.status === "completed" || o.status === "paid") {
        total += o.amount;
        completed++;
        if (o.amount > max) max = o.amount;
        if (new Date(o.created_at) >= startOfDay) today += o.amount;
      }
      if (o.status === "pending" || o.status === "processing") {
        pending += o.amount;
      }
    });

    return {
      totalPatrimonio: total,
      todayVolume: today,
      completedOperations: completed,
      successRate: ordersData.length > 0 ? Math.round((completed / ordersData.length) * 100) : 0,
      avgVolume: completed > 0 ? Math.round(total / completed) : 0,
      maxOperation: max,
      pendingAmount: pending
    };
  })();

  useEffect(() => {
    // Show onboarding if user hasn't accepted documents yet
    if (profile && !(profile as any).documents_accepted_at && localStorage.getItem("onboarding_completed") !== "true") {
      setShowOnboarding(true);
    }
  }, [profile]);

  useEffect(() => {
    // Scroll to #historico if hash is present
    if (location.hash === '#historico') {
      setTimeout(() => {
        const el = document.getElementById('historico');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.hash === '#notas') {
      setTimeout(() => {
        const el = document.getElementById('notas');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-8 h-8 rounded-full border-2 border-[#00D4FF] border-r-transparent animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        ["--sidebar-width" as any]: "18rem",
        ["--sidebar-width-mobile" as any]: "18rem"
      }}
      className="m-0 p-0 !w-full !max-w-none"
    >
      <div className="dark min-h-screen bg-black flex flex-col w-full !max-w-none overflow-hidden font-inter text-white">
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userName={userName}
        />

        {/* Subtle ambient glow - Premium Depth */}
        <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 100%)' }}></div>
        <div className="absolute top-[40%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 80%)' }}></div>

        <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04] w-full h-16 shrink-0">
          <div className="w-full px-4 md:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden text-white/50 hover:text-white" />
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                <img src={tkbLogo} alt="TKB Asset" className="h-8 w-8" />
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight">TKB ASSET</h1>
                  <p className="text-[9px] text-[#00D4FF] font-mono uppercase tracking-[0.2em] mt-0.5">Mesa OTC</p>
                </div>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {user && <BellNotifications userId={user.id} />}
              <HeaderUserMenu userName={userName} userEmail={user?.email} onLogout={() => signOut()} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
        </header>

        <div className="flex w-full flex-1 pt-16 h-full overflow-hidden">
          <AppSidebar />
          <main className="flex-1 min-w-0 bg-black overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-full p-4 md:p-8 md:pt-10 space-y-8 box-border">
              <PremiumHeader
                userName={userName}
                onNewOrder={() => navigate("/order/new")}
              />

              {profile?.pricing_status === 'active' ? (
                <>
                  <PremiumKPICards
                    totalPatrimonio={stats.totalPatrimonio}
                    todayVolume={stats.todayVolume}
                    completedOperations={stats.completedOperations}
                    successRate={stats.successRate}
                    avgVolume={stats.avgVolume}
                    maxOperation={stats.maxOperation}
                    pendingAmount={stats.pendingAmount}
                    lockedPrice={tkbPrice || 0}
                    dailyChangePercent={12.5}
                    isLoading={ordersLoading || priceLoading}
                  />

                  <PremiumLiveQuote
                    binancePrice={binancePrice}
                    tkbPrice={tkbPrice}
                    variation24h={5.2}
                    onNewOrder={() => navigate("/order/new")}
                    isLoading={priceLoading}
                  />
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <ApprovalLockedQuotes
                    status={profile?.pricing_status}
                    onOpenOnboarding={() => setShowOnboarding(true)}
                  />
                </div>
              )}

              {/* Operations History Table */}
              <div id="historico" className="scroll-mt-24">
                <PremiumHistory
                  orders={ordersData || []}
                  onCreateOrder={() => navigate("/order/new")}
                  isLoading={ordersLoading}
                />
              </div>

              {/* Notas Operacionais */}
              <div id="notas" className="scroll-mt-24">
                <OperationalNotesList refreshTrigger={0} />
              </div>

              {/* Bottom CTA */}
              <PremiumCTA onClick={() => navigate("/order/new")} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;