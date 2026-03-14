import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileSearch, Sparkles, Clock, CheckCircle2 } from "lucide-react";

interface ApprovalLockedQuotesProps {
    status: 'pending' | 'rejected' | null | undefined;
    onOpenOnboarding: () => void;
}

export function ApprovalLockedQuotes({ status, onOpenOnboarding }: ApprovalLockedQuotesProps) {
    const isPending = status === 'pending';

    return (
        <Card className="w-full bg-black/40 backdrop-blur-xl border-white/[0.05] shadow-2xl overflow-hidden relative group">
            {/* Ambient background glow inside the card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-tkb-cyan/5 opacity-50" />

            <CardContent className="relative py-16 px-6 flex flex-col items-center text-center space-y-8">
                <div className="relative">
                    <div className="h-24 w-24 rounded-3xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-2xl relative z-10">
                        {isPending ? (
                            <Clock className="h-10 w-10 text-[#D4A552] animate-pulse" />
                        ) : (
                            <Lock className="h-10 w-10 text-[#00D4FF]" />
                        )}
                    </div>
                    <div className="absolute -inset-4 bg-[#00D4FF]/10 blur-2xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                </div>

                <div className="max-w-md space-y-4">
                    <h2 className="text-2xl md:text-3xl font-brand font-bold text-white tracking-tight">
                        {isPending ? "Acesso em Análise" : "Acesso Restrito à Mesa OTC"}
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed font-inter">
                        {isPending
                            ? "Recebemos suas informações! Nossa mesa de mercado está analisando seu perfil institucional. Você será notificado assim que as cotações ao vivo forem liberadas."
                            : "Para visualizar as cotações institucionais e o gráfico em tempo real, você precisa concluir seu perfil operacional e ser aprovado pela nossa diretoria."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    {!isPending ? (
                        <Button
                            onClick={onOpenOnboarding}
                            className="w-full h-14 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,212,255,0.2)]"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Concluir Onboarding
                        </Button>
                    ) : (
                        <div className="w-full h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Aguardando Aprovação</span>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        className="w-full h-14 text-white/40 hover:text-white hover:bg-white/[0.05] border border-white/[0.03]"
                    >
                        <FileSearch className="mr-2 h-4 w-4" />
                        <span className="text-xs uppercase tracking-[0.1em]">Ver Políticas</span>
                    </Button>
                </div>

                <div className="pt-8 grid grid-cols-2 md:grid-cols-3 gap-8 w-full border-t border-white/[0.03]">
                    <div className="space-y-1">
                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Status da Conta</p>
                        <p className="text-xs font-bold text-white uppercase">{isPending ? "Pendente" : "Inativa"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Cotação Live</p>
                        <p className="text-xs font-bold text-white/20 uppercase italic underline decoration-[#00D4FF]/30">Bloqueada</p>
                    </div>
                    <div className="hidden md:block space-y-1">
                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Nível de Acesso</p>
                        <p className="text-xs font-bold text-[#00D4FF] uppercase tracking-tighter">Nível 1 (Visualização)</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
