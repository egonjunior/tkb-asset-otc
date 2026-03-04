import { format } from "date-fns";
import { Download, CheckCircle, Clock, XCircle, Eye, TrendingUp, Zap } from "lucide-react";

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
        <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-6 mb-8">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-white text-xl font-bold mb-1 tracking-tight">Histórico de Operações</h3>
                    <p className="text-white/30 text-xs font-mono">{orders.length} operações encontradas</p>
                </div>

                <div className="flex items-center gap-3">
                    <select className="px-4 py-2 bg-black/40 border border-white/[0.06] rounded-xl text-white text-xs font-mono focus:border-[#00D4FF]/30 outline-none appearance-none cursor-pointer">
                        <option>Todos Status</option>
                        <option>Concluídas</option>
                        <option>Pendentes</option>
                        <option>Canceladas</option>
                    </select>

                    <select className="px-4 py-2 bg-black/40 border border-white/[0.06] rounded-xl text-white text-xs font-mono focus:border-[#00D4FF]/30 outline-none appearance-none cursor-pointer">
                        <option>Últimos 30 dias</option>
                        <option>Últimos 7 dias</option>
                        <option>Este ano</option>
                    </select>

                    <button className="p-2 bg-black/40 border border-white/[0.06] rounded-xl text-white/40 hover:text-white hover:border-white/[0.1] transition-all" title="Exportar CSV">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-3">
                    {orders.map((op, index) => {
                        const status = getStatusProps(op.status);
                        const isLast = index === orders.length - 1;

                        return (
                            <div
                                key={op.id}
                                className="group flex gap-6 p-4 bg-black/20 border border-white/[0.02] rounded-xl hover:bg-white/[0.02] hover:border-[#00D4FF]/10 transition-all cursor-pointer relative"
                            >
                                {/* Timeline connector */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${status.badgeBg} ${status.border} ring-4 ring-[#111111]`}>
                                        {status.icon}
                                    </div>
                                    {!isLast && (
                                        <div className="w-0.5 h-full bg-white/[0.04] my-1" />
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                                    {/* Left info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <p className="text-white font-bold tracking-tight">
                                                Compra USDT
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase ${status.badgeBg} ${status.badgeText}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] font-mono text-white/30">
                                            <span>{format(new Date(op.createdAt), "dd/MM/yyyy 'às' HH:mm")}</span>
                                            <span>•</span>
                                            <span>ID: #{op.id.substring(0, 8)}</span>
                                        </div>
                                    </div>

                                    {/* Amounts */}
                                    <div className="text-left sm:text-right shrink-0">
                                        <p className="text-white font-bold text-lg mb-0.5 tracking-tight">
                                            USD {op.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-white/40 text-xs font-mono">
                                            R$ {op.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {/* Rate & Action */}
                                    <div className="flex items-center justify-between sm:justify-end gap-6 min-w-[120px]">
                                        <div className="text-left sm:text-right w-full">
                                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-1">Cotação Executada</p>
                                            <p className="text-[#00D4FF] font-mono font-bold">
                                                R$ {(op.total / op.amount).toFixed(4)}
                                            </p>
                                        </div>

                                        <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] rounded-lg transition-all shrink-0">
                                            <Eye className="w-4 h-4 text-white/40 group-hover:text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* PREMIUM EMPTY STATE */
                <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#00D4FF]/[0.08] to-[#3B82F6]/[0.08] rounded-3xl flex items-center justify-center mb-6 rotate-12 shadow-[0_0_40px_rgba(0,212,255,0.05)]">
                        <TrendingUp className="w-10 h-10 text-[#00D4FF] -rotate-12 drop-shadow-lg" />
                    </div>
                    <h4 className="text-white text-xl font-bold mb-2 tracking-tight">
                        Seu histórico está vazio
                    </h4>
                    <p className="text-white/40 text-sm max-w-sm mx-auto mb-8 font-mono">
                        Comece agora mesmo! Solicite sua primeira ordem e acompanhe todas as movimentações por aqui.
                    </p>
                    <button
                        onClick={onCreateOrder}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all active:scale-[0.98]"
                    >
                        <Zap className="w-4 h-4" />
                        Criar Primeira Ordem
                    </button>
                </div>
            )}
        </div>
    );
}
