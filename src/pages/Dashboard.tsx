import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { HeaderMarketTicker } from "@/components/HeaderMarketTicker";
import { useAuth } from "@/contexts/AuthContext";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { supabase } from "@/integrations/supabase/client";
import { PremiumHeader } from "@/components/dashboard/PremiumHeader";
import { PremiumKPICards } from "@/components/dashboard/PremiumKPICards";
import { PremiumLiveQuote } from "@/components/dashboard/PremiumLiveQuote";
import { PremiumHistory } from "@/components/dashboard/PremiumHistory";
import { PremiumCTA } from "@/components/dashboard/PremiumCTA";
import { OperationalNotesList } from "@/components/operational-notes/OperationalNotesList";
import tkbLogo from "@/assets/tkb-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const { binancePrice, tkbPrice, isLoading: priceLoading } = useBinancePrice();

  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPatrimonio: 0,
    todayVolume: 0,
    completedOperations: 0,
    successRate: 0,
    avgVolume: 0,
    maxOperation: 0,
    pendingAmount: 0,
  });

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
    const fetchOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("orders")
        .select("id, amount, total, status, created_at, network")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data.map(o => ({
          ...o,
          createdAt: new Date(o.created_at)
        })));

        // Calc stats
        let total = 0, today = 0, completed = 0, max = 0, pending = 0;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        data.forEach((o) => {
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

        setStats({
          totalPatrimonio: total,
          todayVolume: today,
          completedOperations: completed,
          successRate: data.length > 0 ? Math.round((completed / data.length) * 100) : 0,
          avgVolume: completed > 0 ? Math.round(total / completed) : 0,
          maxOperation: max,
          pendingAmount: pending
        });
      }
    };
    fetchOrders();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-8 h-8 rounded-full border-2 border-[#00D4FF] border-r-transparent animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        ["--sidebar-width" as any]: "16rem",
        ["--sidebar-width-mobile" as any]: "18rem"
      }}
    >
      <div className="dark min-h-screen w-full bg-[#0A0A0A] relative overflow-x-hidden">
        {/* Subtle ambient glow - Premium Depth */}
        <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 100%)' }}></div>
        <div className="absolute top-[40%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 80%)' }}></div>

        <div className="relative z-10 w-full flex flex-col h-screen">
          <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
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
              <HeaderMarketTicker binancePrice={binancePrice} tkbPrice={tkbPrice} isLoading={priceLoading} />
              <HeaderUserMenu userName={userName} userEmail={user?.email} onLogout={() => signOut()} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
          </header>

          <div className="flex w-full flex-1 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 px-4 md:px-6 py-8 md:py-10 w-full overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <PremiumHeader
                  userName={userName}
                  onNewOrder={() => navigate("/order/new")}
                />

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
                />

                <PremiumLiveQuote
                  binancePrice={binancePrice}
                  tkbPrice={tkbPrice}
                  variation24h={5.2}
                  onNewOrder={() => navigate("/order/new")}
                />

                {/* Operations History Table */}
                <div id="historico" className="scroll-mt-24">
                  <PremiumHistory
                    orders={orders}
                    onCreateOrder={() => navigate("/order/new")}
                  />
                </div>

                {/* Notas Operacionais */}
                <div id="notas" className="scroll-mt-24 mb-8">
                  <OperationalNotesList refreshTrigger={0} />
                </div>

                {/* Bottom CTA */}
                <PremiumCTA onClick={() => navigate("/order/new")} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;