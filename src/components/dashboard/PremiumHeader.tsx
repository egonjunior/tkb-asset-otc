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
        <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {greeting}, {userName.split(" ")[0]} 👋
                    </h1>
                    <p className="text-slate-400 capitalize">
                        {currentDate} • {currentTime}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onNewOrder}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white hover:bg-slate-700 transition-all font-medium text-sm w-full md:w-auto"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Nova Ordem
                    </button>
                    <button
                        onClick={onNewOrder}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00D4FF] to-[#3B82F6] text-white rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all font-medium text-sm w-full md:w-auto"
                    >
                        <Zap className="w-4 h-4" />
                        Execução Rápida
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400 hidden md:flex">
                <Home className="w-4 h-4" />
                <ChevronRight className="w-3 h-3" />
                <span>Mesa OTC</span>
            </div>
        </div>
    );
}
