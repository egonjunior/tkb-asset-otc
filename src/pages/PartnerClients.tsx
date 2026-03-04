import { useState } from "react";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { AddClientModal } from "@/components/partner/AddClientModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerDashboard } from "@/hooks/usePartnerDashboard";
import {
    Search, Plus, Eye, Edit, MoreVertical,
    Users, Loader2,
} from "lucide-react";

type ClientStatus = "Ativo" | "Pendente" | "Bloqueado";

const statusStyles: Record<ClientStatus, { dot: string; badge: string }> = {
    Ativo: {
        dot: "bg-emerald-500",
        badge: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/[0.15]",
    },
    Pendente: {
        dot: "bg-yellow-500",
        badge: "bg-yellow-500/[0.08] text-yellow-400 border-yellow-500/[0.15]",
    },
    Bloqueado: {
        dot: "bg-red-500",
        badge: "bg-red-500/[0.08] text-red-400 border-red-500/[0.15]",
    },
};

export default function PartnerClients() {
    const { profile, loading: authLoading } = useAuth();
    const { quoteClients, config, isLoading: dashLoading } = usePartnerDashboard();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);

    if (authLoading || dashLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
                <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
            </div>
        );
    }

    const partnerName = config?.companyName || profile?.full_name || "Parceiro";
    const partnerId = config?.id ? `#TKB-${config.id.slice(0, 5).toUpperCase()}` : "#TKB-00000";

    // Map OTC quote clients to display format
    const clients = quoteClients.map((qc) => ({
        id: qc.id,
        name: qc.client_name,
        cnpj: "—",
        status: (qc.is_active ? "Ativo" : "Pendente") as ClientStatus,
        volumeMensal: "—",
        operacoesMes: 0,
        margem: qc.spread_percent,
        comissaoMensal: "—",
        slug: qc.slug,
    }));

    const filteredClients = clients.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeClients = clients.filter((c) => c.status === "Ativo").length;

    return (
        <PartnerLayout partnerName={partnerName} partnerId={partnerId}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white mb-1">Meus Clientes</h1>
                    <p className="text-white/25 text-sm">
                        {activeClients} clientes ativos • {clients.length} total
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Cliente
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/20 focus:border-[#00D4FF]/30 focus:ring-1 focus:ring-[#00D4FF]/10 transition-all outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm focus:border-[#00D4FF]/30 outline-none appearance-none cursor-pointer"
                >
                    <option value="all">Todos os status</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Bloqueado">Bloqueado</option>
                </select>
            </div>

            {/* Table */}
            {filteredClients.length > 0 ? (
                <div className="bg-[#111111] border border-white/[0.04] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">Cliente</th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden md:table-cell">Slug</th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden lg:table-cell">Spread</th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gradient-to-br from-[#00D4FF]/20 to-[#3B82F6]/20 rounded-lg flex items-center justify-center text-[#00D4FF] text-sm font-bold shrink-0">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{client.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${statusStyles[client.status].badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[client.status].dot}`} />
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <p className="text-white/40 text-xs font-mono">/{client.slug}</p>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <span className="text-[#00D4FF] text-sm font-medium">{client.margem}%</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1">
                                                <button className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors">
                                                    <Eye className="w-3.5 h-3.5 text-white/25 hover:text-white/60" />
                                                </button>
                                                <button className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors">
                                                    <Edit className="w-3.5 h-3.5 text-white/25 hover:text-white/60" />
                                                </button>
                                                <button className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors">
                                                    <MoreVertical className="w-3.5 h-3.5 text-white/25 hover:text-white/60" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-white/15" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-1.5">
                        {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                    </h3>
                    <p className="text-white/25 text-sm mb-5 max-w-sm text-center">
                        {searchQuery
                            ? "Tente buscar com outros termos"
                            : "Adicione seu primeiro cliente para começar a gerenciar operações"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white text-sm font-semibold rounded-xl"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Primeiro Cliente
                        </button>
                    )}
                </div>
            )}

            <AddClientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                }}
            />
        </PartnerLayout>
    );
}
