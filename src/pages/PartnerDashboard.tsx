import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { PartnerKPICards } from "@/components/partner/PartnerKPICards";
import { PartnerPerformanceChart } from "@/components/partner/PartnerPerformanceChart";
import { PartnerBI } from "@/components/partner/PartnerBI";
import { PartnerPayments } from "@/components/partner/PartnerPayments";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerDashboard } from "@/hooks/usePartnerDashboard";
import { Loader2 } from "lucide-react";

export default function PartnerDashboard() {
    const { profile, loading: authLoading } = useAuth();
    const { stats, config, orders, chartData, isLoading, error } = usePartnerDashboard();

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
                <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
            </div>
        );
    }

    const partnerName = config?.companyName || profile?.full_name || "Parceiro";
    const partnerId = config?.id ? `#TKB-${config.id.slice(0, 5).toUpperCase()}` : "#TKB-00000";

    return (
        <PartnerLayout partnerName={partnerName} partnerId={partnerId}>
            {/* Page Header */}
            <div className="mb-7">
                <h1 className="text-xl font-bold text-white mb-1">Visão Geral</h1>
                <p className="text-white/25 text-sm">
                    Acompanhe performance, comissões e projeções em tempo real
                </p>
            </div>

            {/* KPI Cards — real data from Supabase */}
            <div className="mb-6">
                <PartnerKPICards data={stats} />
            </div>

            {/* Chart + Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <div className="lg:col-span-2">
                    <PartnerPerformanceChart chartData={chartData} />
                </div>
                <div>
                    <PartnerPayments orders={orders} markupPercent={config?.markupPercent || 1.0} />
                </div>
            </div>

            {/* Business Intelligence — real data */}
            <PartnerBI
                comissaoMes={stats.comissaoMes}
                comissaoAnterior={stats.comissaoAnterior}
                volumeProcessado={stats.volumeProcessado}
                margemMedia={stats.margemMedia}
            />
        </PartnerLayout>
    );
}
