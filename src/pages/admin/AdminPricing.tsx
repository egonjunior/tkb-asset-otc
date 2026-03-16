import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Percent, Clock, AlertCircle, RefreshCw, Users } from "lucide-react";

interface PricingProfile {
    id: string;
    full_name: string;
    email: string;
    pricing_status: string;
    markup_percent: number | null;
    commercial_details: string | null;
    created_at: string;
}

const AdminPricing = () => {
    const [profiles, setProfiles] = useState<PricingProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, pricing_status, markup_percent, commercial_details, created_at')
                .order('pricing_status', { ascending: false }) // 'pending' will likely show first before 'active'
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            console.error("Error fetching pricing profiles:", error);
            toast.error("Erro ao carregar perfis de precificação");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleUpdateMarkup = async (id: string, newMarkup: string, newStatus: string) => {
        const parsedMarkup = parseFloat(newMarkup);
        if (isNaN(parsedMarkup) || parsedMarkup < 0) {
            toast.error("Por favor, insira um valor de markup válido (ex: 1.5)");
            return;
        }

        setSavingId(id);

        try {
            const { error, data } = await supabase
                .from('profiles')
                .update({
                    markup_percent: parsedMarkup,
                    pricing_status: newStatus
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error("O servidor não confirmou a alteração. Isso geralmente acontece por falta de permissão (RLS) ou se o perfil não existe.");
            }

            toast.success(`Configuração para ${profiles.find(p => p.id === id)?.full_name} salva com sucesso!`);

            // Update local state immediately
            setProfiles(prev => prev.map(p =>
                p.id === id ? { ...p, markup_percent: parsedMarkup, pricing_status: newStatus } : p
            ));

        } catch (error: any) {
            console.error("Error updating markup:", error);
            const errorMessage = error.message || "Erro ao atualizar o markup do cliente";
            toast.error(errorMessage, {
                description: "Certifique-se que o banco de dados permite atualizações por administradores."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full min-h-screen bg-black text-white">
                <AppSidebar />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight">
                                    Precificação Comercial <span className="text-[#00D4FF]">Exclusiva</span>
                                </h1>
                                <p className="text-white/40 mt-2 text-lg font-light">
                                    Configure o ecossistema de liquidação e defina o Markup (%) OTC de cada conta.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchProfiles()}
                                className="border-white/10 hover:bg-white/5 bg-white/[0.02] backdrop-blur-md"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Sincronizar Ledger
                            </Button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4FF]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#00D4FF]/10 transition-all" />
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Total de Perfis</p>
                                            <h3 className="text-3xl font-bold text-white tracking-tighter">{profiles.length}</h3>
                                        </div>
                                        <Users className="h-8 w-8 text-white/10" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-500/5 border-amber-500/10 backdrop-blur-xl relative overflow-hidden group">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60 mb-1">Em Análise</p>
                                            <h3 className="text-3xl font-bold text-amber-500 tracking-tighter">
                                                {profiles.filter(p => !p.markup_percent && p.pricing_status === 'pending').length}
                                            </h3>
                                        </div>
                                        <Clock className="h-8 w-8 text-amber-500/20" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-tkb-cyan/5 border-tkb-cyan/10 backdrop-blur-xl relative overflow-hidden group">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-[#00D4FF]/60 mb-1">Taxas Ativas</p>
                                            <h3 className="text-3xl font-bold text-[#00D4FF] tracking-tighter">
                                                {profiles.filter(p => p.markup_percent || p.pricing_status === 'active').length}
                                            </h3>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-[#00D4FF]/20" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl border border-white/5">
                            <CardHeader className="bg-white/[0.01] border-b border-white/5 p-6 relative">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent opacity-50" />
                                <CardTitle className="text-xl flex items-center gap-2 text-white font-bold tracking-tight">
                                    <Percent className="h-5 w-5 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
                                    Grade de Cotações dos Clientes
                                </CardTitle>
                                <CardDescription className="text-white/40 font-light">
                                    Ajuste o multiplicador de lucro por cliente. Clientes com markup ativo visualizam taxas em tempo real.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col justify-center items-center p-32 space-y-6">
                                        <div className="relative">
                                            <Loader2 className="h-12 w-12 animate-spin text-[#00D4FF]" />
                                            <div className="absolute inset-0 blur-xl bg-[#00D4FF]/20 animate-pulse" />
                                        </div>
                                        <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.3em]">Protocolo de Sincronização Ativo...</p>
                                    </div>
                                ) : profiles.length === 0 ? (
                                    <div className="p-24 text-center">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-6 text-white/5" />
                                        <p className="text-white/20 text-lg font-light italic">Nenhum registro encontrado no banco de dados.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-white/[0.03]">
                                                <TableRow className="border-white/5 hover:bg-transparent">
                                                    <TableHead className="w-[300px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Identificação do Cliente</TableHead>
                                                    <TableHead className="w-[140px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Status Operacional</TableHead>
                                                    <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Observações de Onboarding</TableHead>
                                                    <TableHead className="w-[180px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Markup OTC (%)</TableHead>
                                                    <TableHead className="w-[150px] text-right text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5 pr-8">Comandos</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {profiles.map((profile) => {
                                                    const isActive = profile.markup_percent !== null || profile.pricing_status === 'active';

                                                    return (
                                                        <TableRow key={profile.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                            <TableCell className="py-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-white text-base tracking-tight group-hover:text-[#00D4FF] transition-colors">{profile.full_name || 'Sem Nome'}</span>
                                                                    <span className="text-xs text-white/30 font-mono mt-1">{profile.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6">
                                                                {!isActive ? (
                                                                    <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 px-3 py-1 text-[10px] uppercase font-bold tracking-wider">
                                                                        <Clock className="w-3 h-3 mr-1.5" /> Pendente
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 px-3 py-1 text-[10px] uppercase font-bold tracking-wider">
                                                                        <CheckCircle className="w-3 h-3 mr-1.5" /> Ativo
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-6">
                                                                <div className="text-xs text-white/40 bg-white/[0.01] p-4 rounded-xl border border-white/5 min-h-[70px] flex items-center leading-relaxed font-light italic">
                                                                    {profile.commercial_details || "Nenhum dado adicional fornecido durante o registro."}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative group/input">
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            placeholder="1.00"
                                                                            defaultValue={profile.markup_percent ?? ""}
                                                                            id={`markup-${profile.id}`}
                                                                            className="w-28 text-right bg-black/40 border-white/10 text-white focus:border-[#00D4FF] focus:ring-[#00D4FF]/10 transition-all font-mono font-bold text-base h-11"
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00D4FF] group-focus-within/input:w-full transition-all duration-300" />
                                                                    </div>
                                                                    <span className="text-white/20 font-mono font-bold">%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-6 pr-8">
                                                                <Button
                                                                    size="sm"
                                                                    disabled={savingId === profile.id}
                                                                    className={!isActive
                                                                        ? "bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-extrabold uppercase text-[10px] tracking-widest px-6 h-10 shadow-[0_10px_20px_rgba(0,212,255,0.15)]"
                                                                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10 uppercase text-[10px] tracking-widest h-10 px-6"}
                                                                    onClick={() => {
                                                                        const input = document.getElementById(`markup-${profile.id}`) as HTMLInputElement;
                                                                        handleUpdateMarkup(profile.id, input.value, 'active');
                                                                    }}
                                                                >
                                                                    {savingId === profile.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : !isActive ? (
                                                                        "Ativar"
                                                                    ) : (
                                                                        "Atualizar"
                                                                    )}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default AdminPricing;
