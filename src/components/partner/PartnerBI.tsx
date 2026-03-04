import { Calendar, TrendingUp, Lightbulb, Brain } from "lucide-react";

interface PartnerBIProps {
    comissaoMes?: number;
    volumeProcessado?: number;
    comissaoAnterior?: number;
    margemMedia?: number;
}

export function PartnerBI({
    comissaoMes = 0,
    volumeProcessado = 0,
    comissaoAnterior = 0,
    margemMedia = 1.0,
}: PartnerBIProps) {
    // Dynamic projections based on real data
    const momGrowth = comissaoAnterior > 0
        ? Math.round(((comissaoMes - comissaoAnterior) / comissaoAnterior) * 100)
        : 0;

    const projecao30 = comissaoMes > 0
        ? Math.round(comissaoMes * (1 + Math.max(momGrowth, 5) / 100))
        : 0;
    const projecao90 = Math.round(projecao30 * 3 * (1 + momGrowth / 200));

    const confianca30 = comissaoMes > 0 ? Math.min(85, 60 + momGrowth) : 0;
    const confianca90 = comissaoMes > 0 ? Math.min(75, 50 + momGrowth / 2) : 0;

    // Dynamic insight
    const insight = comissaoMes === 0
        ? "Comece a realizar operações para gerar insights automáticos sobre seu negócio."
        : momGrowth > 20
            ? `Crescimento acelerado de ${momGrowth}% MoM. Considere expandir sua base de clientes para manter o ritmo.`
            : momGrowth > 0
                ? `Volume estável com crescimento de ${momGrowth}%. Explore novos segmentos para diversificar receita.`
                : `Volume em queda. Considere ajustar sua margem (${margemMedia.toFixed(1)}%) ou prospectar novos clientes.`;

    return (
        <div className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border-2 border-[#00D4FF]/[0.12] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-[#00D4FF]/[0.08] rounded-xl">
                        <Brain className="w-5 h-5 text-[#00D4FF]" />
                    </div>
                    <div>
                        <h3 className="text-white text-sm font-bold">Business Intelligence</h3>
                        <p className="text-white/25 text-[11px]">Previsão baseada em performance real</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="p-4 bg-black/30 rounded-xl border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Calendar className="w-3.5 h-3.5 text-[#00D4FF]" />
                            <span className="text-[11px] text-white/30">Próximos 30 dias</span>
                        </div>
                        <p className="text-white text-xl font-bold mb-2">
                            {projecao30 > 0 ? `R$ ${projecao30.toLocaleString("pt-BR")}` : "—"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px]">
                            <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] rounded-full"
                                    style={{ width: `${confianca30}%` }}
                                />
                            </div>
                            <span className="text-white/25 font-mono">{confianca30}%</span>
                        </div>
                    </div>

                    <div className="p-4 bg-black/30 rounded-xl border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] text-white/30">Próximos 90 dias</span>
                        </div>
                        <p className="text-white text-xl font-bold mb-2">
                            {projecao90 > 0 ? `R$ ${projecao90.toLocaleString("pt-BR")}` : "—"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px]">
                            <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                    style={{ width: `${confianca90}%` }}
                                />
                            </div>
                            <span className="text-white/25 font-mono">{confianca90}%</span>
                        </div>
                    </div>

                    <div className="p-4 bg-black/30 rounded-xl border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-white/30">Tendência</span>
                        </div>
                        <p className={`text-xl font-bold mb-2 ${momGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {momGrowth >= 0 ? "+" : ""}{momGrowth}% MoM
                        </p>
                        <p className="text-white/20 text-[10px]">
                            {momGrowth > 0 ? "Volume crescendo" : momGrowth === 0 ? "Estável" : "Volume em queda"}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-[#00D4FF]/[0.03] border border-[#00D4FF]/[0.08] rounded-xl">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-[#00D4FF] mt-0.5 shrink-0" />
                        <div>
                            <p className="text-white text-xs font-medium mb-0.5">💡 Insight Automatizado</p>
                            <p className="text-white/35 text-xs leading-relaxed">{insight}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
