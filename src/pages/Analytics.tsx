import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { HeaderMarketTicker } from "@/components/HeaderMarketTicker";
import { useAuth } from "@/contexts/AuthContext";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { PartnerPerformanceChart } from "@/components/partner/PartnerPerformanceChart";
import { PartnerBI } from "@/components/partner/PartnerBI";
import { PremiumKPICards } from "@/components/dashboard/PremiumKPICards";
import { useNavigate } from "react-router-dom";
import tkbLogo from "@/assets/tkb-logo.png";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Analytics() {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
    const { binancePrice, tkbPrice, isLoading: priceLoading } = useBinancePrice();

    // Stats state
    const [stats, setStats] = useState({
        totalPatrimonio: 0,
        todayVolume: 0,
        completedOperations: 0,
        successRate: 0,
        avgVolume: 0,
        maxOperation: 0,
        pendingAmount: 0,
    });

    // Chart state
    const [chartData, setChartData] = useState<{ data: string; comissao: number; volume: number }[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            const { data: orders } = await supabase
                .from("orders")
                .select("amount, status, created_at")
                .eq("user_id", user.id);

            if (orders && orders.length > 0) {
                let total = 0, today = 0, completed = 0, max = 0;
                let pending = 0;
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                orders.forEach((o) => {
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

                const successRate = orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;
                const avgVolume = completed > 0 ? Math.round(total / completed) : 0;

                setStats({
                    totalPatrimonio: total, // using total volume in USDT as proxy for amount here for demo
                    todayVolume: today,
                    completedOperations: completed,
                    successRate,
                    avgVolume,
                    maxOperation: max,
                    pendingAmount: pending,
                });

                // Chart Data (last 90 days)
                const last90 = new Date();
                last90.setDate(last90.getDate() - 90);
                const recentOrders = orders.filter(
                    (o) => new Date(o.created_at) >= last90 && (o.status === "completed" || o.status === "paid")
                );

                const weekMap = new Map<string, { volume: number }>();
                recentOrders.forEach((order) => {
                    const d = new Date(order.created_at);
                    const weekKey = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
                    const cur = weekMap.get(weekKey) || { volume: 0 };
                    cur.volume += order.amount;
                    weekMap.set(weekKey, cur);
                });

                const chart = Array.from(weekMap.entries()).map(([data, vals]) => ({
                    data,
                    comissao: 0, // Using same chart component, 'comissao' is not applicable here but we pass 0
                    volume: Math.round(vals.volume),
                }));
                setChartData(chart);
            }
        };
        fetchAnalytics();
    }, [user]);

    return (
        <SidebarProvider
            defaultOpen={false}
            style={{
                ["--sidebar-width" as any]: "16rem",
                ["--sidebar-width-mobile" as any]: "18rem"
            }}
        >
            <div className="dark min-h-screen w-full bg-[#0A0A0A] relative overflow-hidden">
                {/* Subtle ambient glow */}
                <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 100%)' }}></div>

                <div className="relative z-10">
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

                    <div className="flex w-full min-h-[calc(100vh-64px)]">
                        <AppSidebar />
                        <main className="flex-1 px-4 md:px-6 py-8 md:py-10 w-full overflow-y-auto">
                            <div className="max-w-6xl mx-auto space-y-8">

                                {/* Header */}
                                <div>
                                    <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">Analytics & Insights</h2>
                                    <p className="text-white/40 font-mono">Performance detalhada das suas operações</p>
                                </div>

                                {/* Stats Grid */}
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

                                {/* Gráfico Grande Performance */}
                                <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-6">
                                    <PartnerPerformanceChart chartData={chartData} />
                                </div>

                                {/* Business Intelligence */}
                                <PartnerBI
                                    comissaoMes={stats.totalPatrimonio}
                                    comissaoAnterior={stats.totalPatrimonio * 0.8}
                                    volumeProcessado={stats.totalPatrimonio}
                                    margemMedia={0}
                                />

                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
