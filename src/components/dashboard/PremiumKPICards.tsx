import { Wallet, TrendingUp, CheckCircle, BarChart3, Clock } from "lucide-react";
import CountUp from "react-countup";

interface PremiumKPICardsProps {
    totalPatrimonio: number;
    todayVolume: number;
    completedOperations: number;
    successRate: number;
    avgVolume: number;
    maxOperation: number;
    pendingAmount: number;
    lockedPrice: number;
    dailyChangePercent: number;
}

export function PremiumKPICards({
    totalPatrimonio,
    todayVolume,
    completedOperations,
    successRate,
    avgVolume,
    maxOperation,
    pendingAmount,
    lockedPrice,
    dailyChangePercent,
}: PremiumKPICardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Patrimônio */}
            <div className="group relative bg-gradient-to-br from-[#0A0A0A] to-[#111111] border border-white/[0.04] rounded-2xl p-6 backdrop-blur-sm hover:border-[#00D4FF]/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/0 to-[#3B82F6]/0 group-hover:from-[#00D4FF]/[0.02] group-hover:to-[#3B82F6]/[0.02] rounded-2xl transition-all duration-300" />

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[#00D4FF]/[0.08] rounded-xl text-[#00D4FF]">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${dailyChangePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            <TrendingUp className={`w-4 h-4 ${dailyChangePercent < 0 && "rotate-180"}`} />
                            <span>{dailyChangePercent >= 0 ? "+" : ""}{dailyChangePercent}%</span>
                        </div>
                    </div>

                    <p className="text-white/40 text-xs mb-1">Patrimônio Operado</p>
                    <p className="text-white text-3xl font-bold tracking-tight">
                        <CountUp end={totalPatrimonio} prefix="R$ " separator="." decimals={2} duration={2} />
                    </p>
                    <p className="text-white/30 text-[11px] mt-2 font-mono">
                        Hoje: <span className="text-[#00D4FF]">R$ {todayVolume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </p>
                </div>
            </div>

            {/* Card 2: Operações Concluídas */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-[#111111] border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/[0.02] group-hover:to-pink-500/[0.02] rounded-2xl transition-all duration-300" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/[0.08] rounded-xl text-purple-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-white/30 text-xs">
                            Este mês
                        </div>
                    </div>
                    <p className="text-white/40 text-xs mb-1">Operações Finalizadas</p>
                    <p className="text-white text-3xl font-bold tracking-tight">
                        <CountUp end={completedOperations} duration={2} />
                    </p>
                    <p className="text-white/30 text-[11px] mt-2 font-mono">
                        Taxa sucesso: <span className="text-purple-400">{successRate}%</span>
                    </p>
                </div>
            </div>

            {/* Card 3: Volume Médio */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-[#111111] border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/[0.02] group-hover:to-teal-500/[0.02] rounded-2xl transition-all duration-300" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/[0.08] rounded-xl text-emerald-400">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div className="text-white/30 text-xs">
                            Média
                        </div>
                    </div>
                    <p className="text-white/40 text-xs mb-1">Volume por Operação</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white/50 text-xl font-bold">USDT</span>
                        <p className="text-white text-3xl font-bold tracking-tight">
                            <CountUp end={avgVolume} separator="." duration={2} />
                        </p>
                    </div>
                    <p className="text-white/30 text-[11px] mt-2 font-mono">
                        Maior: <span className="text-emerald-400">USDT {maxOperation.toLocaleString("pt-BR")}</span>
                    </p>
                </div>
            </div>

            {/* Card 4: Próxima Execução */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-[#111111] border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4A853]/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4A853]/0 to-yellow-500/0 group-hover:from-[#D4A853]/[0.02] group-hover:to-yellow-500/[0.02] rounded-2xl transition-all duration-300" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[#D4A853]/[0.08] rounded-xl text-[#D4A853]">
                            <Clock className="w-5 h-5" />
                        </div>
                        {pendingAmount > 0 ? (
                            <div className="px-2 py-1 bg-[#D4A853]/[0.08] text-[#D4A853] text-[10px] uppercase font-bold tracking-wider rounded-lg border border-[#D4A853]/[0.12]">
                                Ativa
                            </div>
                        ) : (
                            <div className="text-white/20 text-xs">
                                Nenhuma
                            </div>
                        )}
                    </div>
                    <p className="text-white/40 text-xs mb-1">Ordem Pendente</p>
                    {pendingAmount > 0 ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-white/50 text-xl font-bold">USDT</span>
                            <p className="text-white text-3xl font-bold tracking-tight">
                                {pendingAmount.toLocaleString("pt-BR")}
                            </p>
                        </div>
                    ) : (
                        <p className="text-white/30 text-3xl font-bold tracking-tight">—</p>
                    )}
                    <p className="text-white/30 text-[11px] mt-2 font-mono">
                        Trava: <span className={pendingAmount > 0 ? "text-[#D4A853]" : "text-white/30"}>R$ {lockedPrice > 0 ? lockedPrice.toFixed(4) : "0.0000"}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
