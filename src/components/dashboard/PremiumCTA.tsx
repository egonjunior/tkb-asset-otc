import { ArrowRight, Zap } from "lucide-react";

interface PremiumCTAProps {
    onClick: () => void;
}

export function PremiumCTA({ onClick }: PremiumCTAProps) {
    return (
        <div className="bg-gradient-to-br from-[#00D4FF]/[0.08] via-[#3B82F6]/[0.05] to-purple-500/[0.05] border-2 border-[#00D4FF]/[0.15] rounded-2xl p-8 md:p-10 relative overflow-hidden group">
            {/* Background glow effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4FF]/20 blur-[100px] rounded-full group-hover:bg-[#00D4FF]/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3B82F6]/20 blur-[100px] rounded-full group-hover:bg-[#3B82F6]/30 transition-all duration-700" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                        Pronto para operar?
                    </h3>
                    <p className="text-white/50 text-base md:text-lg max-w-2xl font-mono leading-relaxed">
                        Solicite uma nova ordem de compra ou venda de USDT com as <strong className="text-white">melhores taxas institucionais</strong> do mercado.
                        Execução prioritária em até 90 minutos.
                    </p>
                </div>

                <button
                    onClick={onClick}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-white text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 transform hover:scale-105 active:scale-95 shrink-0"
                >
                    <Zap className="w-5 h-5" />
                    <span className="text-lg">Nova Ordem</span>
                    <ArrowRight className="w-5 h-5 text-black/50" />
                </button>
            </div>
        </div>
    );
}
