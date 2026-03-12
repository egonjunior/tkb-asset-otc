import { format } from "date-fns";
import { Download, CheckCircle, Clock, XCircle, Eye, TrendingUp, Zap, ChevronRight, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Order {
    id: string;
    amount: number;
    total: number;
    status: "pending" | "paid" | "completed" | "expired" | "cancelled" | "rejected" | "processing";
    createdAt: Date;
}

interface PremiumHistoryProps {
    orders: Order[];
    onCreateOrder: () => void;
}

export function PremiumHistory({ orders, onCreateOrder }: PremiumHistoryProps) {
    const navigate = useNavigate();

    const getStatusProps = (status: Order["status"]) => {
        switch (status) {
            case "completed":
            case "paid":
                return {
                    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                    badgeBg: "bg-emerald-500/[0.08]",
                    badgeText: "text-emerald-400",
                    border: "border-emerald-500/[0.15]",
                    label: status === "completed" ? "Concluída" : "Paga",
                    ring: "ring-emerald-500/20",
                };
            case "pending":
            case "processing":
                return {
                    icon: <Clock className="w-4 h-4 text-yellow-500" />,
                    badgeBg: "bg-yellow-500/[0.08]",
                    badgeText: "text-yellow-400",
                    border: "border-yellow-500/[0.15]",
                    label: status === "pending" ? "Pendente" : "Processando",
                    ring: "ring-yellow-500/20",
                };
            default:
                return {
                    icon: <XCircle className="w-4 h-4 text-red-500" />,
                    badgeBg: "bg-red-500/[0.08]",
                    badgeText: "text-red-400",
                    border: "border-red-500/[0.15]",
                    label: "Cancelada",
                    ring: "ring-red-500/20",
                };
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 mb-10 overflow-hidden shadow-2xl">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h3 className="text-white text-xl font-brand tracking-widest uppercase italic mb-1">Livro de Operações</h3>
                    <p className="text-white/20 text-[9px] uppercase font-mono tracking-[0.2em]">{orders.length} Registros Auditados</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white/40 text-[10px] font-mono tracking-widest outline-none uppercase cursor-pointer transition-all hover:border-white/10">
                        <option>Filtro Global</option>
                        <option>Completed</option>
                        <option>Processing</option>
                        <option>Cancelled</option>
                    </select>

                    <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white/40 text-[10px] font-mono tracking-widest hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all uppercase">
                        <Download className="w-3 h-3" /> Relatórios
                    </button>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-2">
                    {orders.map((op, index) => {
                        const status = getStatusProps(op.status);

                        return (
                            <div
                                key={op.id}
                                onClick={() => navigate(`/order/${op.id}`)}
                                className="group p-4 bg-white/[0.01] border border-white/[0.02] rounded-xl hover:bg-white/[0.03] hover:border-[#00D4FF]/20 transition-all cursor-pointer relative"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${status.badgeBg} ${status.border} shadow-lg transition-all group-hover:scale-105`}>
                                            <div className="scale-75">{status.icon}</div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-white font-brand text-sm tracking-widest uppercase italic">USDT Liquidity</p>
                                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold tracking-[0.15em] uppercase ${status.badgeBg} ${status.badgeText} border ${status.border}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] font-mono text-white/15 uppercase tracking-widest">
                                                <span>{format(new Date(op.createdAt), "dd MMM yyyy · HH:mm")}</span>
                                                <span className="w-1 h-1 bg-white/5 rounded-full" />
                                                <span>ID: {op.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-0.5">
                                        <p className="text-white font-brand text-xl tracking-tighter">
                                            USDT {op.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-white/20 text-[9px] font-mono uppercase tracking-[0.1em]">
                                            R$ {op.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div className="flex items-center md:items-end flex-col gap-0.5 min-w-[120px]">
                                        <p className="text-white/10 text-[8px] uppercase font-mono tracking-widest">Avg Price</p>
                                        <p className="text-[#00D4FF]/60 font-mono font-bold text-sm">
                                            R$ {op.amount > 0 ? (op.total / op.amount).toFixed(4) : (0).toFixed(4)}
                                        </p>
                                    </div>

                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all hidden md:block">
                                        <ChevronRight className="w-4 h-4 text-[#00D4FF]" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white/[0.01] rounded-3xl flex items-center justify-center mb-6 border border-white/[0.03]">
                        <Activity className="w-8 h-8 text-white/10" />
                    </div>
                    <h4 className="text-white text-lg font-brand tracking-widest uppercase italic mb-2">Sem Atividade</h4>
                    <p className="text-white/20 text-[10px] max-w-xs mx-auto mb-8 font-mono tracking-[0.1em] uppercase">
                        Aguardando primeira liquidação de ativos.
                    </p>
                    <button
                        onClick={onCreateOrder}
                        className="px-8 py-3 bg-[#00D4FF] text-black font-bold rounded-lg hover:shadow-[0_0_20px_#00D4FF66] transition-all uppercase tracking-[0.2em] text-[10px]"
                    >
                        Nova Operação
                    </button>
                </div>
            )}
        </div>
    );
}
