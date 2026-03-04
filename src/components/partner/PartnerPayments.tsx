import { Clock, CheckCircle } from "lucide-react";

interface Payment {
    id: string;
    date: string;
    amount: string;
    description: string;
    status: "Confirmado" | "Pendente" | "Projetado";
}

interface PartnerPaymentsProps {
    orders?: { amount: number; total: number; status: string; created_at: string }[];
    markupPercent?: number;
}

export function PartnerPayments({ orders = [], markupPercent = 1.0 }: PartnerPaymentsProps) {
    // Build payments from real orders
    const now = new Date();
    const payments: Payment[] = [];

    // Group recent completed orders as confirmed payments
    const completedOrders = orders
        .filter((o) => o.status === "completed" || o.status === "paid")
        .slice(0, 3);

    completedOrders.forEach((order, i) => {
        const d = new Date(order.created_at);
        const commission = Math.round(order.amount * (markupPercent / 100));
        payments.push({
            id: `real-${i}`,
            date: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`,
            amount: `R$ ${commission.toLocaleString("pt-BR")}`,
            description: `Comissão s/ USD ${order.amount.toLocaleString("pt-BR")}`,
            status: "Confirmado",
        });
    });

    // Add projected next payment
    const nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    payments.push({
        id: "proj-1",
        date: `${nextPayDate.getDate().toString().padStart(2, "0")}/${(nextPayDate.getMonth() + 1).toString().padStart(2, "0")}`,
        amount: "—",
        description: "Próximo fechamento",
        status: "Projetado",
    });

    return (
        <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4">Últimas Comissões</h3>
            <div className="space-y-3">
                {payments.slice(0, 4).map((payment) => (
                    <div
                        key={payment.id}
                        className="p-3.5 bg-black/30 rounded-xl border border-white/[0.04] hover:border-white/[0.06] transition-colors"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-white/30 font-mono">{payment.date}</span>
                            <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                ${payment.status === "Confirmado"
                                    ? "bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/[0.12]"
                                    : payment.status === "Pendente"
                                        ? "bg-[#00D4FF]/[0.08] text-[#00D4FF] border border-[#00D4FF]/[0.12]"
                                        : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                                }
              `}>
                                {payment.status === "Confirmado" ? (
                                    <CheckCircle className="w-2.5 h-2.5" />
                                ) : (
                                    <Clock className="w-2.5 h-2.5" />
                                )}
                                {payment.status}
                            </span>
                        </div>
                        <p className="text-white font-semibold text-sm">{payment.amount}</p>
                        <p className="text-white/20 text-[10px] mt-0.5">{payment.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
