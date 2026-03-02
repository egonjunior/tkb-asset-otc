import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Percent, Clock, AlertCircle } from "lucide-react";

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
            const { error } = await supabase
                .from('profiles')
                .update({
                    markup_percent: parsedMarkup,
                    pricing_status: newStatus
                })
                .eq('id', id);

            if (error) throw error;

            toast.success("Regra de precificação atualizada com sucesso!");
            fetchProfiles(); // Refresh table
        } catch (error: any) {
            console.error("Error updating markup:", error);
            toast.error("Erro ao atualizar o markup do cliente");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full min-h-screen bg-neutral-50">
                <AdminSidebar />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">
                                    Precificação Comercial Exclusiva
                                </h1>
                                <p className="text-neutral-500 mt-2 text-lg">
                                    Avalie o perfil operacional dos clientes e defina o Markup (%) OTC de cada conta.
                                </p>
                            </div>
                        </div>

                        <Card className="border-neutral-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Percent className="h-5 w-5 text-tkb-cyan" />
                                    Grade de Cotações dos Clientes
                                </CardTitle>
                                <CardDescription>
                                    Selecione os clientes em análise para liberar suas cotações e o uso do dashboard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex justify-center items-center p-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                                    </div>
                                ) : profiles.length === 0 ? (
                                    <div className="p-12 text-center text-neutral-500">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                                        Nenhum perfil encontrado no banco de dados.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-neutral-50/80">
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Cliente</TableHead>
                                                    <TableHead className="w-[120px]">Status</TableHead>
                                                    <TableHead className="w-[300px]">Detalhes da Operação (Onboarding)</TableHead>
                                                    <TableHead className="w-[150px]">Markup (%)</TableHead>
                                                    <TableHead className="w-[150px] text-right">Ação</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {profiles.map((profile) => (
                                                    <TableRow key={profile.id} className="hover:bg-neutral-50/50">
                                                        <TableCell>
                                                            <div className="font-semibold text-neutral-900">{profile.full_name || 'Sem Nome'}</div>
                                                            <div className="text-sm text-neutral-500">{profile.email}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {profile.pricing_status === 'pending' ? (
                                                                <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
                                                                    <Clock className="w-3 h-3 mr-1" /> Em Análise
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                                                    <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm text-neutral-600 bg-neutral-100 p-3 rounded-md min-h-[60px] whitespace-pre-wrap flex items-center">
                                                                {profile.commercial_details || <span className="text-neutral-400 italic">Cliente antigo ou sem onboarding preenchido.</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="Ex: 1.5"
                                                                    defaultValue={profile.markup_percent ?? 1.0}
                                                                    id={`markup-${profile.id}`}
                                                                    className="w-24 text-right"
                                                                />
                                                                <span className="text-neutral-500 font-medium">%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                disabled={savingId === profile.id}
                                                                className={profile.pricing_status === 'pending' ? "bg-tkb-cyan hover:bg-tkb-cyan/90 text-black font-semibold" : "bg-neutral-800 hover:bg-neutral-700"}
                                                                onClick={() => {
                                                                    const input = document.getElementById(`markup-${profile.id}`) as HTMLInputElement;
                                                                    handleUpdateMarkup(profile.id, input.value, 'active');
                                                                }}
                                                            >
                                                                {savingId === profile.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : profile.pricing_status === 'pending' ? (
                                                                    "Aprovar"
                                                                ) : (
                                                                    "Atualizar Regra"
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
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
