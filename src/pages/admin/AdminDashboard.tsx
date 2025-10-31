import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, TrendingUp, Clock, CheckCircle2, Users, Handshake, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VolumeCard } from "@/components/admin/VolumeCard";

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

  useEffect(() => {
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
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de administrador",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      fetchOrders();
    };

    const fetchOrders = async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('Erro ao buscar ordens:', ordersError);
        toast({
          title: "Erro ao carregar ordens",
          description: "Tente recarregar a página",
          variant: "destructive",
        });
        return;
      }

      // Buscar os perfis dos usuários
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
        
        setOrders(ordersWithNames as Order[]);
      } else {
        setOrders([]);
      }
      
      setLoading(false);
    };

    const fetchMetrics = async () => {
      const { count: partnersCount } = await supabase
        .from('partner_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingPartnersCount(partnersCount || 0);

      const { count: ticketsCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      setOpenTicketsCount(ticketsCount || 0);
    };
    
    checkAdminAndFetchOrders();
    fetchMetrics();
    
    // Realtime subscription
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          const fetchOrders = async () => {
            const { data: ordersData } = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false });
            
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
              
              setOrders(ordersWithNames as Order[]);
            }
          };
          fetchOrders();
        }
      )
      .subscribe();
    
    return () => {
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

  const getStatusBadge = (status: Order["status"]) => {
    const variants = {
      pending: { label: "Aguardando", className: "bg-warning text-warning-foreground" },
      paid: { label: "Pago", className: "bg-primary text-primary-foreground" },
      completed: { label: "Concluído", className: "bg-success text-success-foreground" },
      expired: { label: "Expirado", className: "bg-muted text-muted-foreground" },
    };
    
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground">TKB Asset</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Métricas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Ordens Abertas</p>
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-foreground">{metrics.openOrders}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Aguardando Confirmação</p>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{metrics.awaitingConfirmation}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-foreground">{metrics.completedToday}</p>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary" 
              onClick={() => navigate('/admin/users')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gestão de Usuários</p>
                    <p className="text-xl font-bold text-primary">Ver Todos →</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Visualizar e gerenciar todos os usuários</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-tkb-cyan" 
              onClick={() => navigate('/admin/documents')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Validação de Contratos</p>
                    <p className="text-xl font-bold text-tkb-cyan">Gerenciar →</p>
                  </div>
                  <span className="text-3xl">📄</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Aprovar e reprovar documentos dos clientes</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500" 
              onClick={() => navigate('/admin/partners')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Solicitações de Parceria</p>
                    <p className="text-xl font-bold text-green-600">{pendingPartnersCount} Pendentes →</p>
                  </div>
                  <Handshake className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Novos interessados em ser assessores</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500" 
              onClick={() => navigate('/admin/support')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Chamados de Suporte</p>
                    <p className="text-xl font-bold text-orange-600">{openTicketsCount} Abertos →</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tickets aguardando resposta</p>
              </CardContent>
            </Card>
          </div>

          {/* Volume Card */}
          <VolumeCard
            orders={orders}
            period={volumePeriod}
            onPeriodChange={setVolumePeriod}
          />

          {/* Tabela de Ordens */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Todas as Ordens</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-3">Carregando ordens...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem encontrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Rede</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comprovante</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.full_name || 'N/A'}</TableCell>
                          <TableCell>{Number(order.amount).toLocaleString()} USDT</TableCell>
                          <TableCell>{order.network}</TableCell>
                          <TableCell>R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.receipt_url ? (
                              <Badge className="bg-success/10 text-success border-success">
                                Enviado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/order/${order.id}`)}
                            >
                              Gerenciar
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
  );
};

export default AdminDashboard;
