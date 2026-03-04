import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Lock, ArrowRight, Activity, TrendingUp } from "lucide-react";

interface PremiumLiveQuoteProps {
    binancePrice: number | null;
    tkbPrice: number | null;
    variation24h?: number;
    high24h?: number;
    low24h?: number;
    volume24h?: number;
    trades24h?: number;
    sparklineData?: { price: number; time: string }[];
}

export function PremiumLiveQuote({
    binancePrice,
    tkbPrice,
    variation24h = 2.4, // Mock until we fetch real
    high24h = 5.3450,
    low24h = 5.1200,
    volume24h = 1254000,
    trades24h = 342,
    sparklineData = Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, price: 5.2 + Math.random() * 0.15 }))
}: PremiumLiveQuoteProps) {
    const [lastUpdateSeconds, setLastUpdateSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastUpdateSeconds((prev) => (prev >= 60 ? 0 : prev + 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [binancePrice]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Cotação Principal (2/3 largura) */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF]/[0.02] to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="text-white text-xl font-bold tracking-tight">USDT / BRL</h3>
                                <span className="px-2 py-0.5 bg-emerald-500/[0.08] text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full border border-emerald-500/[0.15] flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    AO VIVO
                                </span>
                            </div>
                            <p className="text-white/30 text-xs font-mono">Binance Spot • Atualizado há {lastUpdateSeconds}s</p>
                        </div>

                        <button className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-white/50 hover:text-white text-xs font-medium transition-all w-fit">
                            Mercado 24h
                        </button>
                    </div>

                    {/* Preços */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                Referência
                            </p>
                            <p className="text-white text-3xl md:text-4xl font-bold font-mono tracking-tighter">
                                {binancePrice ? binancePrice.toFixed(4) : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#00D4FF]/50 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Execução TKB
                            </p>
                            <p className="text-[#00D4FF] text-3xl md:text-4xl font-bold font-mono tracking-tighter">
                                {tkbPrice ? tkbPrice.toFixed(4) : "—"}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-2">
                                Variação
                            </p>
                            <p className={`text-3xl font-bold font-mono tracking-tighter ${variation24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {variation24h >= 0 ? "+" : ""}{variation24h}%
                            </p>
                        </div>
                    </div>

                    {/* Mini Chart (Sparkline últimas 24h) */}
                    <div className="h-32 -mx-2 mb-6 opacity-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2} />
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
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/[0.04]">
                        <div>
                            <p className="text-white/25 text-[10px] font-mono mb-1">Máxima 24h</p>
                            <p className="text-white font-medium text-sm">R$ {high24h.toFixed(4)}</p>
                        </div>
                        <div>
                            <p className="text-white/25 text-[10px] font-mono mb-1">Mínima 24h</p>
                            <p className="text-white font-medium text-sm">R$ {low24h.toFixed(4)}</p>
                        </div>
                        <div>
                            <p className="text-white/25 text-[10px] font-mono mb-1">Volume 24h</p>
                            <p className="text-white font-medium text-sm">{(volume24h / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                            <p className="text-white/25 text-[10px] font-mono mb-1">Trades</p>
                            <p className="text-white font-medium text-sm">{trades24h}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trava de Preço (1/3 largura) */}
            <div className="bg-gradient-to-br from-[#111111] to-[#0A0A0A] border-2 border-[#D4A853]/[0.15] rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#D4A853]/[0.02] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-[#D4A853]/[0.1] rounded-xl">
                            <Lock className="w-5 h-5 text-[#D4A853]" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold tracking-tight">Price Lock</h4>
                            <p className="text-[#D4A853]/60 text-[10px] uppercase font-bold tracking-widest mt-0.5">Válido por 5min</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center mb-8">
                        <p className="text-white/30 text-xs font-mono mb-2 text-center">Preço de Execução Reservado</p>
                        <p className="text-[#D4A853] text-[2.5rem] font-bold font-mono tracking-tighter text-center leading-none">
                            {tkbPrice ? tkbPrice.toFixed(4) : "—"}
                        </p>
                    </div>

                    {/* Countdown timer mockup (would be driven by state in real use) */}
                    <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white/40 text-[10px] uppercase font-bold">Tempo Restante</span>
                            <span className="text-[#D4A853] text-sm font-mono font-bold">
                                05:00
                            </span>
                        </div>
                        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#D4A853] to-yellow-500 w-full"
                            />
                        </div>
                    </div>

                    <button className="w-full py-4 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all active:scale-[0.98]">
                        Travar e Executar
                    </button>
                </div>
            </div>
        </div>
    );
}
