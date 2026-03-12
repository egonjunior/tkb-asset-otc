import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Zap, Home, ChevronRight } from "lucide-react";

interface PremiumHeaderProps {
    userName: string;
    onNewOrder?: () => void;
}

export function PremiumHeader({ userName, onNewOrder }: PremiumHeaderProps) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const hour = time.getHours();
    let greeting = "Boa noite";
    if (hour >= 5 && hour < 12) greeting = "Bom dia";
    else if (hour >= 12 && hour < 18) greeting = "Boa tarde";

    const currentDate = format(time, "dd 'de' MMMM", { locale: ptBR });
    const currentTime = format(time, "HH:mm");

    return (
        <div className="mb-12 bg-black/40 backdrop-blur-2xl p-10 rounded-3xl border border-white/[0.05] relative overflow-hidden group shadow-2xl">
            {/* Background elements - very subtle */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/[0.02] blur-[120px] rounded-full -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-[#00D4FF]/[0.04]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/[0.01] blur-[100px] rounded-full -ml-24 -mb-24" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.4em] text-[#00D4FF]/40 mb-3">
                        <Zap className="w-3 h-3 animate-pulse" />
                        Acesso Institucional · {currentTime} UTC
                    </div>
                    <h1 className="text-3xl md:text-5xl font-brand tracking-tighter text-white uppercase italic">
                        {greeting}, <span className="text-[#00D4FF]">{userName?.split(" ")[0] || "Trader"}</span>
                    </h1>
                    <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.2em]">
                        Liquidez OTC · {currentDate}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onNewOrder}
                        className="group relative px-10 py-4 bg-[#00D4FF] rounded-xl text-black transition-all hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] hover:scale-[1.02] active:scale-[0.98] font-bold text-[11px] uppercase tracking-[0.3em] overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Nova Ordem <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
