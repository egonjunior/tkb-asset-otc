import { useState } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface ChartDataPoint {
    data: string;
    comissao: number;
    volume: number;
}

interface PartnerPerformanceChartProps {
    chartData?: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-3 shadow-xl">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-mono">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-white/60">{entry.name}:</span>
                    <span className="text-xs text-white font-semibold">
                        {entry.name === "Comissão"
                            ? `R$ ${(entry.value / 1000).toFixed(1)}k`
                            : `USD ${(entry.value / 1000).toFixed(0)}k`}
                    </span>
                </div>
            ))}
        </div>
    );
};

const emptyChartMessage = (
    <div className="flex items-center justify-center h-[280px] text-white/15 text-sm">
        Sem dados de operações ainda
    </div>
);

export function PartnerPerformanceChart({ chartData = [] }: PartnerPerformanceChartProps) {
    const [activeMetric, setActiveMetric] = useState<"comissao" | "volume">("comissao");

    return (
        <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-white text-sm font-semibold">Performance Últimos 90 Dias</h3>
                <div className="flex gap-1.5 bg-white/[0.03] p-1 rounded-lg">
                    <button
                        onClick={() => setActiveMetric("comissao")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeMetric === "comissao"
                                ? "bg-[#00D4FF]/[0.1] text-[#00D4FF] border border-[#00D4FF]/[0.15]"
                                : "text-white/30 hover:text-white/50 border border-transparent"
                            }`}
                    >
                        Comissão
                    </button>
                    <button
                        onClick={() => setActiveMetric("volume")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeMetric === "volume"
                                ? "bg-purple-500/[0.1] text-purple-400 border border-purple-500/[0.15]"
                                : "text-white/30 hover:text-white/50 border border-transparent"
                            }`}
                    >
                        Volume
                    </button>
                </div>
            </div>

            {chartData.length === 0 ? emptyChartMessage : (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="gradComissao" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis
                            dataKey="data"
                            stroke="rgba(255,255,255,0.15)"
                            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.15)"
                            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) =>
                                activeMetric === "comissao"
                                    ? `R$${(v / 1000).toFixed(0)}k`
                                    : `$${(v / 1000).toFixed(0)}k`
                            }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey={activeMetric}
                            name={activeMetric === "comissao" ? "Comissão" : "Volume"}
                            stroke={activeMetric === "comissao" ? "#00D4FF" : "#A855F7"}
                            strokeWidth={2}
                            fill={activeMetric === "comissao" ? "url(#gradComissao)" : "url(#gradVolume)"}
                            dot={{ fill: activeMetric === "comissao" ? "#00D4FF" : "#A855F7", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "#0A0A0A" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
