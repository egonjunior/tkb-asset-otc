import { DollarSign, TrendingUp, Target } from "lucide-react";

interface KPIData {
    comissaoMes: number;
    comissaoAnterior: number;
    volumeProcessado: number;
    clientesAtivos: number;
    margemMedia: number;
}

interface PartnerKPICardsProps {
    data?: KPIData;
}

function formatCurrency(value: number, currency = "BRL"): string {
    if (currency === "USD") {
        if (value >= 1_000_000) return `USD ${(value / 1_000_000).toFixed(2)}M`;
        if (value >= 1_000) return `USD ${(value / 1_000).toFixed(0)}k`;
        return `USD ${value.toLocaleString("pt-BR")}`;
    }
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const defaultData: KPIData = {
    comissaoMes: 0,
    comissaoAnterior: 0,
    volumeProcessado: 0,
    clientesAtivos: 0,
    margemMedia: 1.0,
};

export function PartnerKPICards({ data = defaultData }: PartnerKPICardsProps) {
    const comissaoGrowth = data.comissaoAnterior > 0
        ? ((data.comissaoMes - data.comissaoAnterior) / data.comissaoAnterior * 100).toFixed(0)
        : "0";

    const cards = [
        {
            icon: DollarSign,
            label: "Comissão Este Mês",
            value: formatCurrency(data.comissaoMes),
            trend: data.comissaoAnterior > 0 ? `${Number(comissaoGrowth) > 0 ? "+" : ""}${comissaoGrowth}%` : "—",
            trendPositive: Number(comissaoGrowth) >= 0,
            detail: data.comissaoAnterior > 0 ? `vs ${formatCurrency(data.comissaoAnterior)} mês anterior` : "Primeiro mês",
            gradient: "from-[#00D4FF]/[0.08] to-[#3B82F6]/[0.08]",
            border: "border-[#00D4FF]/[0.15]",
            iconBg: "bg-[#00D4FF]/[0.1]",
            iconColor: "text-[#00D4FF]",
        },
        {
            icon: Target,
            label: "Volume Processado",
            value: formatCurrency(data.volumeProcessado, "USD"),
            trend: `${data.clientesAtivos} clientes`,
            trendPositive: null,
            detail: `${data.clientesAtivos} clientes ativos`,
            gradient: "from-purple-500/[0.08] to-pink-500/[0.08]",
            border: "border-purple-500/[0.15]",
            iconBg: "bg-purple-500/[0.1]",
            iconColor: "text-purple-400",
        },
        {
            icon: TrendingUp,
            label: "Margem Média",
            value: `${data.margemMedia.toFixed(1)}%`,
            trend: "Ativa",
            trendPositive: true,
            detail: `Markup sobre preço TKB`,
            gradient: "from-emerald-500/[0.08] to-teal-500/[0.08]",
            border: "border-emerald-500/[0.15]",
            iconBg: "bg-emerald-500/[0.1]",
            iconColor: "text-emerald-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`
            bg-gradient-to-br ${card.gradient} ${card.border}
            border rounded-2xl p-5 backdrop-blur-sm
            hover:scale-[1.02] transition-all duration-300 cursor-default
          `}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 ${card.iconBg} rounded-xl`}>
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                        </div>
                        {card.trendPositive !== null ? (
                            <div className={`flex items-center gap-1 text-xs font-medium font-mono ${card.trendPositive ? "text-emerald-400" : "text-red-400"
                                }`}>
                                <TrendingUp className="w-3 h-3" />
                                {card.trend}
                            </div>
                        ) : (
                            <span className="text-xs text-white/30 font-mono">{card.trend}</span>
                        )}
                    </div>
                    <p className="text-white/40 text-xs mb-1 tracking-wide">{card.label}</p>
                    <p className="text-white text-2xl font-bold tracking-tight">{card.value}</p>
                    <p className="text-white/25 text-[11px] mt-2 font-mono">{card.detail}</p>
                </div>
            ))}
        </div>
    );
}
