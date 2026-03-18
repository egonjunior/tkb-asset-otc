import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Lock, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder estático para quando não há dados reais — não usa Math.random()
const EMPTY_SPARKLINE = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, price: 5.25 }));

interface PremiumLiveQuoteProps {
    binancePrice: number | null;
    tkbPrice: number | null;
    variation24h?: number;
    high24h?: number;
    low24h?: number;
    volume24h?: number;
    trades24h?: number;
    sparklineData?: { price: number; time: string }[];
    onNewOrder?: () => void;
    isLoading?: boolean;
}

export function PremiumLiveQuote({
    binancePrice,
    tkbPrice,
    variation24h = 0,
    high24h = 0,
    low24h = 0,
    volume24h = 0,
    trades24h = 0,
    sparklineData = EMPTY_SPARKLINE,
    onNewOrder,
    isLoading = false
}: PremiumLiveQuoteProps) {
    const [lastUpdateSeconds, setLastUpdateSeconds] = useState(0);

    useEffect(() => {
        setLastUpdateSeconds(0);
        const timer = setInterval(() => {
            setLastUpdateSeconds((prev) => (prev >= 60 ? 0 : prev + 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [binancePrice]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 h-[380px]">
                    <Skeleton className="w-48 h-8 mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-8">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20 hidden md:block" />
                    </div>
                    <Skeleton className="h-32 w-full mb-4" />
                    <div className="grid grid-cols-4 gap-6">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </div>
                </div>
                <div className="bg-black/60 border border-[#D4A853]/20 rounded-3xl p-8 h-[380px] flex flex-col justify-between">
                    <Skeleton className="w-1/2 h-8" />
                    <Skeleton className="w-full h-24" />
                    <Skeleton className="w-full h-12" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Cotação Principal (2/3 largura) */}
            <div className="lg:col-span-2 bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-3xl relative group overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF]/[0.03] to-transparent pointer-events-none group-hover:from-[#00D4FF]/[0.05] transition-premium" />

                <div className="relative z-10 p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="text-white text-xl font-brand tracking-widest uppercase italic">USDT / BRL</h3>
                                <div className="px-3 py-1 bg-[#00D4FF]/10 text-[#00D4FF] text-[8px] font-mono font-bold tracking-[0.2em] uppercase rounded-full border border-[#00D4FF]/20 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-[#00D4FF] rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />
                                    Live Desk
                                </div>
                            </div>
                            <p className="text-white/20 text-[9px] uppercase tracking-[0.25em] font-mono">Institutional Liquidity · Ref {lastUpdateSeconds}s</p>
                        </div>

                        <div className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white/30 text-[9px] font-mono tracking-widest flex items-center gap-2 uppercase">
                            Global Market Time (UTC)
                        </div>
                    </div>

                    {/* Preços */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-8">
                        <div className="space-y-1">
                            <p className="text-white/20 text-[9px] uppercase font-mono tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Referência
                            </p>
                            <p className="text-white text-4xl font-brand tracking-tighter">
                                {binancePrice ? binancePrice.toFixed(4) : "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[#00D4FF]/40 text-[9px] uppercase font-mono tracking-[0.2em] mb-2 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Execução
                            </p>
                            <p className="text-[#00D4FF] text-4xl font-brand tracking-tighter shadow-[#00D4FF]/10 drop-shadow-sm">
                                {tkbPrice ? tkbPrice.toFixed(4) : "—"}
                            </p>
                        </div>
                        <div className="hidden md:block space-y-1">
                            <p className="text-white/20 text-[9px] uppercase font-mono tracking-[0.2em] mb-2">Variação 24h</p>
                            <p className={`text-4xl font-brand tracking-tighter ${variation24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {variation24h >= 0 ? "+" : ""}{variation24h}%
                            </p>
                        </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-32 -mx-4 mb-4 opacity-40 group-hover:opacity-70 transition-premium">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#00D4FF"
                                    strokeWidth={2}
                                    fill="url(#colorPrice)"
                                    dot={false}
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/[0.03]">
                        {[
                            ["High 24h", `R$ ${high24h.toFixed(4)}`],
                            ["Low 24h", `R$ ${low24h.toFixed(4)}`],
                            ["Vol 24h", `${(volume24h / 1000000).toFixed(2)}M`],
                            ["Trades", trades24h],
                        ].map(([l, v]) => (
                            <div key={l as string}>
                                <p className="text-white/20 text-[8px] font-mono uppercase tracking-[0.15em] mb-1">{l}</p>
                                <p className="text-white/50 font-bold text-xs uppercase">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trava de Preço (1/3 largura) */}
            <div className="bg-black/60 border border-[#D4A853]/20 rounded-3xl relative overflow-hidden group flex flex-col justify-between shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4A853]/[0.04] to-transparent pointer-events-none" />

                <div className="relative z-10 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-br from-[#D4A853]/20 to-[#D4A853]/5 rounded-xl border border-[#D4A853]/20 text-[#D4A853] shadow-lg">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-white font-brand text-base tracking-widest uppercase">Price Lock</h4>
                            <p className="text-[#D4A853]/50 text-[8px] uppercase font-mono font-bold tracking-[0.2em]">Guaranteed Coverage</p>
                        </div>
                    </div>

                    <div className="space-y-1 text-center mb-10">
                        <p className="text-white/20 text-[9px] uppercase font-mono tracking-widest italic">Reservado para você</p>
                        <p className="text-[#D4A853] text-5xl font-brand tracking-tighter drop-shadow-lg">
                            {tkbPrice ? tkbPrice.toFixed(4) : "—"}
                        </p>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white/20 text-[8px] uppercase font-mono tracking-widest">Tempo de Reserva</span>
                            <span className="text-[#D4A853] text-[11px] font-mono font-bold">04:59</span>
                        </div>
                        <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#B8860B] w-full" />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0">
                    <button
                        onClick={onNewOrder}
                        className="w-full py-4 bg-[#D4A853] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(212,168,83,0.3)] transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px]"
                    >
                        Executar Agora
                    </button>
                </div>
            </div>
        </div>
    );
}
