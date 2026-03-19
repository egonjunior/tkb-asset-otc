import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield, LogOut, TrendingUp, Clock, CheckCircle2,
  Users, Handshake, MessageCircle, Building2,
  UserCog, FileText, Percent, Presentation,
  ArrowUpRight, ArrowDownRight, Zap, Bell,
  Search, RefreshCw, Loader2, Briefcase, Newspaper, Link2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VolumeCard } from "@/components/admin/VolumeCard";
import { AdminLayout } from "@/components/admin/AdminLayout";

type VolumePeriod = 'day' | 'week' | 'month' | 'all';

interface Order {
  id: string;
  user_id: string;
  amount: number;
  network: string;
  total: number;
  status: "pending" | "paid" | "completed" | "expired";
  created_at: string;
  receipt_url: string | null;
  full_name?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [volumePeriod, setVolumePeriod] = useState<VolumePeriod>('day');
  const [pendingPartnersCount, setPendingPartnersCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [pendingB2BCount, setPendingB2BCount] = useState(0);
  const [pendingNotesCount, setPendingNotesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        if (!isMounted) return;

        if (ordersData && ordersData.length > 0) {
          const userIds = [...new Set(ordersData.map(o => o.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]));

          const ordersWithNames = ordersData.map(order => ({
            ...order,
            full_name: profilesMap.get(order.user_id) || 'N/A'
          }));

          if (isMounted) {
            setOrders(ordersWithNames as Order[]);
          }
        } else {
          if (isMounted) setOrders([]);
        }
      } catch (error) {
        console.error('Erro ao buscar ordens:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const checkAdminAndFetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        if (isMounted) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão de administrador",
            variant: "destructive",
          });
        }
        navigate('/dashboard');
        return;
      }

      fetchOrders();
    };

    const fetchMetrics = async () => {
      if (!isMounted) return;

      const { count: partnersCount } = await supabase
        .from('partner_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (isMounted) setPendingPartnersCount(partnersCount || 0);

      const { count: ticketsCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      if (isMounted) setOpenTicketsCount(ticketsCount || 0);

      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'novo');
      if (isMounted) setNewLeadsCount(leadsCount || 0);

      const { count: b2bCount } = await supabase
        .from('partner_requests')
        .select('*', { count: 'exact', head: true })
        .eq('request_type', 'b2b_otc')
        .eq('status', 'pending');
      if (isMounted) setPendingB2BCount(b2bCount || 0);

      const { count: notesCount } = await supabase
        .from('operational_notes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (isMounted) setPendingNotesCount(notesCount || 0);
    };

    checkAdminAndFetchOrders();
    fetchMetrics();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (isMounted) {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const metrics = {
    openOrders: orders.filter(o => o.status === "pending").length,
    awaitingConfirmation: orders.filter(o => o.status === "paid").length,
    completedToday: orders.filter(o => o.status === "completed").length,
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/admin/login");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Aguardando", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      paid: { label: "Pago", className: "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20" },
      completed: { label: "Concluído", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      expired: { label: "Expirado", className: "bg-white/10 text-white/40 border-white/5" },
      rejected: { label: "Rejeitado", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    };

    const variant = variants[status] || { label: status, className: "bg-white/5 text-white/20 border-white/5" };
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#00D4FF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                  <Shield className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                    Painel Administrativo
                  </h1>
                  <p className="text-white/40 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">TKB Asset · Control Protocol v2.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-white/10 hover:bg-white/5 h-10 px-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout} className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all h-10 px-4">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </header>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#00D4FF]/10" />
                <CardContent className="pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">Ordens Abertas</p>
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl font-bold text-white tracking-tighter">{metrics.openOrders}</h3>
                    <span className="text-[10px] text-amber-500/60 font-mono">PENDING CONFIRMATION</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#00D4FF]/10" />
                <CardContent className="pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">Pago / Aguardando</p>
                    <TrendingUp className="h-5 w-5 text-[#00D4FF]" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl font-bold text-[#00D4FF] tracking-tighter">{metrics.awaitingConfirmation}</h3>
                    <span className="text-[10px] text-[#00D4FF]/60 font-mono">READY FOR RELEASE</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
                <CardContent className="pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">Concluídas</p>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-4xl font-bold text-emerald-500 tracking-tighter">{metrics.completedToday}</h3>
                    <span className="text-[10px] text-emerald-500/60 font-mono">LIFETIME VOLUME</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <QuickActionCard
                title="Usuários"
                subtitle="Gestão de Perfis"
                icon={Users}
                onClick={() => navigate('/admin/users')}
                color="blue"
              />
              <QuickActionCard
                title="Contratos"
                subtitle="Validação KYC"
                icon={FileText}
                onClick={() => navigate('/admin/documents')}
                color="cyan"
              />
              <QuickActionCard
                title="Parceiros"
                subtitle={`${pendingPartnersCount} Pendentes`}
                icon={Handshake}
                onClick={() => navigate('/admin/partners')}
                color="green"
              />
              <QuickActionCard
                title="Suporte"
                subtitle={`${openTicketsCount} Abertos`}
                icon={MessageCircle}
                onClick={() => navigate('/admin/support')}
                color="orange"
              />
              <QuickActionCard
                title="Leads"
                subtitle={`${newLeadsCount} Novos`}
                icon={Building2}
                onClick={() => navigate('/admin/leads')}
                color="purple"
              />
              <QuickActionCard
                title="B2B OTC"
                subtitle={`${pendingB2BCount} Pendentes`}
                icon={Briefcase}
                onClick={() => navigate('/admin/partners-b2b')}
                color="indigo"
              />
              <QuickActionCard
                title="Offline"
                subtitle="Gestão Manual"
                icon={UserCog}
                onClick={() => navigate('/admin/offline-clients')}
                color="blue"
              />
              <QuickActionCard
                title="Operações"
                subtitle="Relatório OKX"
                icon={Zap}
                onClick={() => navigate('/admin/okx-operations')}
                color="amber"
              />
              <QuickActionCard
                title="Spread"
                subtitle="Precificação"
                icon={Percent}
                onClick={() => navigate('/admin/pricing')}
                color="cyan"
              />
              <QuickActionCard
                title="Blog"
                subtitle="IA Content"
                icon={Newspaper}
                onClick={() => navigate('/admin/blog')}
                color="pink"
              />
              <QuickActionCard
                title="Links OTC"
                subtitle="Cotação externa"
                icon={Link2}
                onClick={() => navigate('/admin/otc-clients')}
                color="emerald"
              />
            </div>

            {/* Volume Analytics */}
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-1 shadow-inner">
              <VolumeCard
                orders={orders}
                period={volumePeriod}
                onPeriodChange={setVolumePeriod}
              />
            </div>

            {/* Tabela de Ordens Recentes */}
            <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
              <CardHeader className="bg-white/[0.01] border-b border-white/5 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Fluxo de Ordens</CardTitle>
                  <CardDescription className="text-white/20">Monitoramento em tempo real das movimentações OTC.</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input placeholder="Filtrar ordens..." className="pl-9 bg-white/[0.03] border-white/10 w-64 focus:border-[#00D4FF] transition-all" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col justify-center items-center p-20 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
                    <p className="text-white/20 font-mono text-xs uppercase tracking-widest text-center">Interrogando Blockchain e Servidores...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 text-white/20">
                    <Zap className="h-10 w-10 mx-auto mb-4 opacity-10" />
                    <p className="font-medium">Nenhum registro encontrado no protocolo.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Identificador</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Protocolo de Cliente</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Volume (USDT)</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Network / Rede</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Liquidação (BRL)</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Estado</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Timestamp</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                            <TableCell className="font-mono text-[10px] text-white/60">{order.id.slice(0, 8)}...</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-white group-hover:text-[#00D4FF] transition-colors">{order.full_name || 'N/A'}</span>
                                <span className="text-[10px] text-white/20 uppercase font-mono tracking-tighter">ID: {order.user_id.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-white tracking-widest">{Number(order.amount).toLocaleString()} <span className="text-white/20 font-normal">USDT</span></TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-white/40 font-mono tracking-widest">{order.network}</Badge>
                            </TableCell>
                            <TableCell className="text-emerald-500/80 font-mono font-bold">R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-white/20 text-[10px] font-mono whitespace-nowrap">
                              {new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF]/10 h-8"
                                onClick={() => navigate(`/admin/order/${order.id}`)}
                              >
                                Release
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
    </AdminLayout>
  );
};

const QuickActionCard = ({ title, subtitle, icon: Icon, onClick, color }: any) => {
  const colors: Record<string, string> = {
    blue: "border-blue-500/20 text-blue-500 bg-blue-500/5",
    cyan: "border-[#00D4FF]/20 text-[#00D4FF] bg-[#00D4FF]/5",
    green: "border-emerald-500/20 text-emerald-500 bg-emerald-500/5",
    orange: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    purple: "border-purple-500/20 text-purple-500 bg-purple-500/5",
    pink: "border-pink-500/20 text-pink-500 bg-pink-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    indigo: "border-indigo-500/20 text-indigo-500 bg-indigo-500/5",
  };

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border ${colors[color] || colors.cyan}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <Icon className="h-6 w-6 opacity-60" />
          <div>
            <p className="text-[12px] font-bold tracking-tight text-white mb-0.5">{title}</p>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.1em]">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
