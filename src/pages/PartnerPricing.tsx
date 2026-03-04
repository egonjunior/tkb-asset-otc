import { useState } from "react";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerDashboard } from "@/hooks/usePartnerDashboard";
import { usePartnerPrice } from "@/hooks/usePartnerPrice";
import {
    Loader2, ArrowRight, ArrowDown, Lock, Settings2,
    Copy, CheckCircle, ExternalLink, Shield, TrendingUp,
} from "lucide-react";

export default function PartnerPricing() {
    const { profile, loading: authLoading } = useAuth();
    const { config, quoteClients, isLoading: dashLoading } = usePartnerDashboard();
    const { price: binancePrice, tkbPrice, isLoading: priceLoading } = usePartnerPrice();

    const [copied, setCopied] = useState(false);

    // Real data from Supabase
    const tkbBaseFee = 1.0; // TKB base fee
    const partnerMarkup = config?.markupPercent || 1.5;
    const activeQuote = quoteClients.find((q) => q.is_active) || quoteClients[0];
    const slug = activeQuote?.slug || "meu-link";

    // Live prices
    const bPrice = binancePrice || 5.285;
    const tkbSpread = tkbBaseFee / 100;
    const tkbPriceToPartner = bPrice * (1 + tkbSpread);
    const partnerSpread = partnerMarkup / 100;
    const clientFinalPrice = tkbPriceToPartner * (1 + partnerSpread);
    const partnerProfitPerUSDT = clientFinalPrice - tkbPriceToPartner;

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://tkbasset.com/${slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (authLoading || dashLoading) {
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
                <h1 className="text-xl font-bold text-white mb-1">Configurações de Cotação</h1>
                <p className="text-white/25 text-sm">
                    Gerencie taxas, margens e link de cotação para seus clientes
                </p>
            </div>

            {/* Flow Visualization */}
            <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-6 mb-6">
                <h3 className="text-white text-sm font-semibold mb-5">Fluxo de Preço — Ao Vivo</h3>

                <div className="flex flex-col lg:flex-row items-stretch gap-3 lg:gap-0">
                    <div className="flex-1 bg-black/30 border border-white/[0.04] rounded-xl p-4 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-white/20 mb-1 font-mono">Binance (Base)</p>
                        <p className="text-white text-xl font-bold font-mono">
                            {priceLoading ? "..." : `R$ ${bPrice.toFixed(4)}`}
                        </p>
                        <p className="text-white/15 text-[10px] mt-1">Preço de mercado</p>
                    </div>

                    <div className="flex items-center justify-center lg:px-2">
                        <div className="lg:hidden"><ArrowDown className="w-4 h-4 text-[#D4A853]" /></div>
                        <div className="hidden lg:flex flex-col items-center">
                            <ArrowRight className="w-4 h-4 text-[#D4A853]" />
                            <span className="text-[9px] text-[#D4A853]/60 mt-0.5">+{tkbBaseFee}%</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-gradient-to-br from-[#D4A853]/[0.06] to-transparent border border-[#D4A853]/[0.12] rounded-xl p-4 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-[#D4A853]/60 mb-1 font-mono">TKB → Você</p>
                        <p className="text-[#D4A853] text-xl font-bold font-mono">
                            {priceLoading ? "..." : `R$ ${tkbPriceToPartner.toFixed(4)}`}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <Lock className="w-2.5 h-2.5 text-[#D4A853]/40" />
                            <span className="text-[10px] text-[#D4A853]/40">Taxa TKB: {tkbBaseFee}% (fixo pelo admin)</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center lg:px-2">
                        <div className="lg:hidden"><ArrowDown className="w-4 h-4 text-[#00D4FF]" /></div>
                        <div className="hidden lg:flex flex-col items-center">
                            <ArrowRight className="w-4 h-4 text-[#00D4FF]" />
                            <span className="text-[9px] text-[#00D4FF]/60 mt-0.5">+{partnerMarkup}%</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-gradient-to-br from-[#00D4FF]/[0.06] to-transparent border border-[#00D4FF]/[0.12] rounded-xl p-4 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-[#00D4FF]/60 mb-1 font-mono">Você → Cliente</p>
                        <p className="text-[#00D4FF] text-xl font-bold font-mono">
                            {priceLoading ? "..." : `R$ ${clientFinalPrice.toFixed(4)}`}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <Settings2 className="w-2.5 h-2.5 text-[#00D4FF]/40" />
                            <span className="text-[10px] text-[#00D4FF]/40">Sua margem: {partnerMarkup}%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-500/[0.04] border border-emerald-500/[0.1] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400/70 text-xs">Seu lucro bruto por USDT:</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm font-mono">
                        {priceLoading ? "..." : `R$ ${partnerProfitPerUSDT.toFixed(4)}`}
                    </span>
                </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {/* Left: Sua config */}
                <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Settings2 className="w-4 h-4 text-[#00D4FF]" />
                        <h3 className="text-white text-sm font-semibold">Sua Margem (Parceiro → Cliente)</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#00D4FF]/[0.04] border border-[#00D4FF]/[0.1] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/40 text-xs">Markup atual</span>
                                <div className="flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-[#00D4FF]/40" />
                                    <span className="text-[10px] text-[#00D4FF]/40">Configurado no partner_b2b_config</span>
                                </div>
                            </div>
                            <p className="text-[#00D4FF] text-3xl font-bold">{partnerMarkup}%</p>
                            <p className="text-white/15 text-[10px] mt-1">Sobre o preço TKB</p>
                        </div>

                        <div className="bg-black/30 border border-white/[0.04] rounded-xl p-4">
                            <p className="text-[10px] uppercase tracking-wider text-white/20 mb-3 font-semibold">
                                Simulação (volume USD 500k)
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-white/15">Receita Bruta</p>
                                    <p className="text-white font-semibold text-sm">
                                        R$ {(500000 * partnerMarkup / 100 * tkbPriceToPartner).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/15">Por Operação (USD 50k)</p>
                                    <p className="text-[#00D4FF] font-semibold text-sm">
                                        R$ {(50000 * partnerMarkup / 100 * tkbPriceToPartner).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Taxa TKB */}
                <div className="bg-[#111111] border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Shield className="w-4 h-4 text-[#D4A853]" />
                        <h3 className="text-white text-sm font-semibold">Taxa TKB (Admin → Você)</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#D4A853]/[0.04] border border-[#D4A853]/[0.1] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/40 text-xs">Spread TKB</span>
                                <div className="flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-[#D4A853]/40" />
                                    <span className="text-[10px] text-[#D4A853]/40">Definido pelo admin</span>
                                </div>
                            </div>
                            <p className="text-[#D4A853] text-3xl font-bold">{tkbBaseFee}%</p>
                            <p className="text-white/15 text-[10px] mt-1">Sobre o preço Binance</p>
                        </div>

                        <div className="bg-black/30 border border-white/[0.04] rounded-xl p-4 space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/30">Preço Binance</span>
                                <span className="text-white font-mono">R$ {bPrice.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/30">+ Spread TKB ({tkbBaseFee}%)</span>
                                <span className="text-[#D4A853] font-mono">+ R$ {(bPrice * tkbSpread).toFixed(4)}</span>
                            </div>
                            <div className="h-px bg-white/[0.04]" />
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50 font-medium">Seu Preço de Compra</span>
                                <span className="text-white font-bold font-mono">R$ {tkbPriceToPartner.toFixed(4)}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/[0.04] border border-blue-500/[0.08] rounded-xl">
                            <p className="text-blue-300/50 text-[10px]">
                                💡 Esta taxa é configurada pela TKB Asset. Para negociar condições especiais, entre em contato pelo suporte.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link de Cotação */}
            <div className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border-2 border-[#00D4FF]/[0.1] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-[#00D4FF]" />
                        <h3 className="text-white text-sm font-semibold">Link de Cotação (Mesa Branca)</h3>
                    </div>
                    {activeQuote && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/[0.12]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                        </span>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 flex items-center bg-black/40 border border-white/[0.06] rounded-xl overflow-hidden">
                        <span className="px-3 text-white/15 text-xs font-mono shrink-0">tkbasset.com/</span>
                        <input
                            type="text"
                            value={slug}
                            readOnly
                            className="flex-1 py-2.5 bg-transparent text-white text-sm font-mono outline-none"
                        />
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${copied
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-white text-black hover:bg-white/90"
                            }`}
                    >
                        {copied ? (
                            <><CheckCircle className="w-4 h-4" /> Copiado!</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copiar Link</>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-black/30 border border-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/20 mb-0.5">Nome de Exibição</p>
                        <p className="text-white text-sm font-medium">{activeQuote?.client_name || partnerName}</p>
                    </div>
                    <div className="bg-black/30 border border-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/20 mb-0.5">Spread</p>
                        <p className="text-[#00D4FF] text-sm font-medium">
                            +{activeQuote?.spread_percent?.toFixed(1) || partnerMarkup}%
                        </p>
                    </div>
                    <div className="bg-black/30 border border-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/20 mb-0.5">Preço ao Cliente</p>
                        <p className="text-white text-sm font-bold font-mono">
                            {priceLoading ? "..." : `R$ ${clientFinalPrice.toFixed(4)}`}
                        </p>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
