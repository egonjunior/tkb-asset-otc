import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Percent, Clock, AlertCircle, RefreshCw, Users, Lock } from "lucide-react";

interface PricingProfile {
    id: string;
    full_name: string;
    email: string;
    pricing_status: string;
    markup_percent: number | null;
    commercial_details: string | null;
    price_source: string | null;
    created_at: string;
    _markup: string;
    _price_source: string;
}

interface LockPriceForm {
    userId: string;
    userName: string;
    price: string;
    duration: string;
}

const AdminPricing = () => {
    const [profiles, setProfiles] = useState<PricingProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [lockForm, setLockForm] = useState<LockPriceForm | null>(null);
    const [isLocking, setIsLocking] = useState(false);

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, pricing_status, markup_percent, commercial_details, price_source, created_at')
                .order('pricing_status', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles((data || []).map(p => ({
                ...p,
                _markup: p.markup_percent?.toString() ?? "",
                _price_source: p.price_source || 'binance',
            })));
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

    const updateLocalProfile = (id: string, field: '_markup' | '_price_source', value: string) => {
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async (profile: PricingProfile) => {
        const parsedMarkup = parseFloat(profile._markup);
        if (isNaN(parsedMarkup) || parsedMarkup < 0) {
            toast.error("Insira um markup válido (ex: 1.5)");
            return;
        }

        setSavingId(profile.id);
        try {
            const { error, data } = await supabase
                .from('profiles')
                .update({
                    markup_percent: parsedMarkup,
                    price_source: profile._price_source,
                    pricing_status: 'active',
                })
                .eq('id', profile.id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error("Sem permissão para atualizar este perfil (verifique RLS).");
            }

            toast.success(`${profile.full_name} atualizado com sucesso!`);
            setProfiles(prev => prev.map(p =>
                p.id === profile.id
                    ? { ...p, markup_percent: parsedMarkup, price_source: profile._price_source, pricing_status: 'active' }
                    : p
            ));
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar o cliente");
        } finally {
            setSavingId(null);
        }
    };

    const handleLockPrice = async () => {
        if (!lockForm) return;
        const price = parseFloat(lockForm.price);
        const duration = parseInt(lockForm.duration);
        if (isNaN(price) || price <= 0) {
            toast.error("Preço inválido");
            return;
        }

        setIsLocking(true);
        try {
            const res = await supabase.functions.invoke('lock-price', {
                body: {
                    user_id: lockForm.userId,
                    manual_price: price,
                    duration_minutes: duration,
                },
            });

            if (res.error) throw res.error;
            if (res.data?.error) throw new Error(res.data.error);

            toast.success(`Preço R$ ${price.toFixed(4)} travado para ${lockForm.userName} por ${duration} min`);
            setLockForm(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao travar preço");
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full min-h-screen bg-black text-white">
                <AppSidebar forceAdmin={true} />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight">
                                    Precificação Comercial <span className="text-[#00D4FF]">Exclusiva</span>
                                </h1>
                                <p className="text-white/40 mt-2 text-lg font-light">
                                    Avalie o perfil operacional dos clientes e defina o Markup (%) OTC de cada conta.
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

                        <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
                            <CardHeader className="bg-white/[0.01] border-b border-white/5 p-6 relative">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent opacity-50" />
                                <CardTitle className="text-xl flex items-center gap-2 text-white font-bold tracking-tight">
                                    <Percent className="h-5 w-5 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
                                    Grade de Cotações dos Clientes
                                </CardTitle>
                                <CardDescription className="text-white/40 font-light">
                                    Selecione os clientes em análise para liberar suas cotações e o uso do dashboard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col justify-center items-center p-32 space-y-6">
                                        <Loader2 className="h-12 w-12 animate-spin text-[#00D4FF]" />
                                        <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.3em]">Carregando...</p>
                                    </div>
                                ) : profiles.length === 0 ? (
                                    <div className="p-24 text-center">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-6 text-white/5" />
                                        <p className="text-white/20 text-lg font-light italic">Nenhum registro encontrado.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-white/[0.03]">
                                                <TableRow className="border-white/5 hover:bg-transparent">
                                                    <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Cliente</TableHead>
                                                    <TableHead className="w-[120px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Status</TableHead>
                                                    <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Detalhes da Operação (Onboarding)</TableHead>
                                                    <TableHead className="w-[150px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Markup (%)</TableHead>
                                                    <TableHead className="w-[140px] text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Fonte Preço</TableHead>
                                                    <TableHead className="w-[200px] text-right text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5 pr-6">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {profiles.map((profile) => {
                                                    const isActive = profile.markup_percent !== null || profile.pricing_status === 'active';

                                                    return (
                                                        <TableRow key={profile.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                            <TableCell className="py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-white text-sm tracking-tight group-hover:text-[#00D4FF] transition-colors">
                                                                        {profile.full_name || 'Sem Nome'}
                                                                    </span>
                                                                    <span className="text-xs text-white/30 font-mono mt-0.5">{profile.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5">
                                                                {!isActive ? (
                                                                    <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                                                                        <Clock className="w-3 h-3 mr-1" /> Pendente
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                                                                        <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-5">
                                                                <div className="text-xs text-white/40 italic">
                                                                    {profile.commercial_details || "Cliente antigo ou sem onboarding preenchido."}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        placeholder="1.00"
                                                                        value={profile._markup}
                                                                        onChange={(e) => updateLocalProfile(profile.id, '_markup', e.target.value)}
                                                                        className="w-24 text-right bg-black/40 border-white/10 text-white focus:border-[#00D4FF] font-mono font-bold text-sm h-9"
                                                                    />
                                                                    <span className="text-white/20 font-mono text-sm">%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5">
                                                                <Select
                                                                    value={profile._price_source}
                                                                    onValueChange={(v) => updateLocalProfile(profile.id, '_price_source', v)}
                                                                >
                                                                    <SelectTrigger className="w-28 h-9 bg-black/40 border-white/10 text-white text-xs focus:border-[#00D4FF]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-zinc-900 border-white/10">
                                                                        <SelectItem value="binance" className="text-white text-xs focus:bg-white/10">Binance</SelectItem>
                                                                        <SelectItem value="okx" className="text-white text-xs focus:bg-white/10">OKX</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell className="text-right py-5 pr-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF]/10 h-8 px-2 text-[10px]"
                                                                        onClick={() => setLockForm({
                                                                            userId: profile.id,
                                                                            userName: profile.full_name || profile.email,
                                                                            price: '',
                                                                            duration: '30',
                                                                        })}
                                                                    >
                                                                        <Lock className="h-3 w-3 mr-1" />
                                                                        Travar
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={savingId === profile.id}
                                                                        className={!isActive
                                                                            ? "bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-extrabold uppercase text-[10px] tracking-widest px-4 h-8"
                                                                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10 uppercase text-[10px] tracking-widest h-8 px-4"}
                                                                        onClick={() => handleSave(profile)}
                                                                    >
                                                                        {savingId === profile.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : !isActive ? "Ativar" : "Salvar"}
                                                                    </Button>
                                                                </div>
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

            {/* Modal: Lock Price */}
            <Dialog open={!!lockForm} onOpenChange={(open) => !open && setLockForm(null)}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Lock className="h-4 w-4 text-[#00D4FF]" />
                            Travar Preço Manual
                        </DialogTitle>
                    </DialogHeader>
                    {lockForm && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-white/50">
                                Cliente: <span className="text-white font-medium">{lockForm.userName}</span>
                            </p>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50 uppercase tracking-wider">Preço Manual (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="Ex: 5.8250"
                                    value={lockForm.price}
                                    onChange={(e) => setLockForm(f => f ? { ...f, price: e.target.value } : f)}
                                    className="bg-black/40 border-white/10 text-white focus:border-[#00D4FF] font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50 uppercase tracking-wider">Duração</Label>
                                <Select
                                    value={lockForm.duration}
                                    onValueChange={(v) => setLockForm(f => f ? { ...f, duration: v } : f)}
                                >
                                    <SelectTrigger className="bg-black/40 border-white/10 text-white focus:border-[#00D4FF]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10">
                                        <SelectItem value="15" className="text-white focus:bg-white/10">15 minutos</SelectItem>
                                        <SelectItem value="30" className="text-white focus:bg-white/10">30 minutos</SelectItem>
                                        <SelectItem value="60" className="text-white focus:bg-white/10">1 hora</SelectItem>
                                        <SelectItem value="120" className="text-white focus:bg-white/10">2 horas</SelectItem>
                                        <SelectItem value="480" className="text-white focus:bg-white/10">8 horas</SelectItem>
                                        <SelectItem value="1440" className="text-white focus:bg-white/10">24 horas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLockForm(null)} className="border-white/10 text-white/50 hover:bg-white/5">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleLockPrice}
                            disabled={isLocking || !lockForm?.price}
                            className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-bold"
                        >
                            {isLocking ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <><Lock className="h-4 w-4 mr-2" />Confirmar Trava</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
};

export default AdminPricing;
