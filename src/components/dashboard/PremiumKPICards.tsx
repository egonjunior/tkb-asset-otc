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

                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${successRate}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-purple-400">{successRate}%</span>
                    </div>
                </div>
            </div>

            {/* Card 4: Pendente / Status */}
            <div className="premium-card flex flex-col justify-between hover:border-[#D4A853]/20">
                <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${pendingAmount > 0 ? "bg-[#D4A853]/10 text-[#D4A853]" : "bg-white/5 text-white/20"}`}>
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Liquidez</span>
                </div>

                <div className="mt-4">
                    <p className="text-white/40 text-[10px] uppercase font-mono tracking-widest mb-1">Média/Op</p>
                    <p className="text-3xl font-brand text-white flex items-baseline gap-1">
                        <span className="text-xs font-mono text-white/30">USDT</span>
                        <CountUp end={avgVolume} separator="." duration={2} />
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                    <p className="text-[10px] text-white/20 font-mono uppercase truncate">
                        Maior: <span className="text-white/40">USDT {maxOperation.toLocaleString("pt-BR")}</span>
                    </p>
                </div>
            </div>

            {/* Card 5: Ordem Pendente (Full Width on Mobile, Full Row on Desktop to complete bento) */}
            <div className="md:col-span-2 lg:col-span-4 premium-card flex flex-col md:flex-row items-center justify-between border-[#D4A853]/10 bg-gradient-to-r from-[#D4A853]/[0.02] to-transparent">
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${pendingAmount > 0 ? "bg-[#D4A853]/10 text-[#D4A853]" : "bg-white/5 text-white/20"}`}>
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mb-1">Status de Operação em Aberto</p>
                        {pendingAmount > 0 ? (
                            <div className="flex items-center gap-3">
                                <h4 className="text-2xl font-brand text-white">USDT {pendingAmount.toLocaleString("pt-BR")}</h4>
                                <div className="px-2 py-1 bg-[#D4A853]/10 text-[#D4A853] text-[9px] font-bold uppercase tracking-widest border border-[#D4A853]/20 rounded-lg">
                                    Aguardando Liquidação
                                </div>
                            </div>
                        ) : (
                            <h4 className="text-xl font-brand text-white/20">Nenhuma Negociação Ativa</h4>
                        )}
                    </div>
                </div>

                <div className="mt-6 md:mt-0 text-right">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1">Cotação Travada</p>
                    <p className={`text-2xl font-mono ${pendingAmount > 0 ? "text-[#D4A853]" : "text-white/10"}`}>
                        R$ {lockedPrice > 0 ? lockedPrice.toFixed(4) : "0.0000"}
                    </p>
                </div>
            </div>
        </div>
    );
}
