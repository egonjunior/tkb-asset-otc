import { TrendingUp, TrendingDown } from "lucide-react";

interface HeaderMarketTickerProps {
    binancePrice: number | null;
    tkbPrice: number | null;
    isLoading: boolean;
}

export function HeaderMarketTicker({ binancePrice, tkbPrice, isLoading }: HeaderMarketTickerProps) {
    if (isLoading || !tkbPrice) {
        return (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-14 bg-white/[0.06] rounded animate-pulse" />
            </div>
        );
    }

    const spread = binancePrice && tkbPrice ? ((tkbPrice - binancePrice) / binancePrice) * 100 : 0;
    const isPositive = spread >= 0;

    return (
        <div className="hidden lg:flex items-center gap-4 px-5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors duration-300">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-emerald-400">Live</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-white/[0.06]" />

            {/* TKB Price */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">USDT</span>
                <span className="text-sm font-semibold text-tkb-cyan tabular-nums font-mono">
                    R$ {tkbPrice.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </span>
            </div>

            {/* Spread badge */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${isPositive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}{spread.toFixed(2)}%
            </div>
        </div>
    );
}
