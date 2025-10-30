import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QuoteCard from "@/components/QuoteCard";
import { StatCard } from "@/components/StatCard";
import { Briefcase, LogOut, Plus, Clock, TrendingUp, Settings, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import tkbLogo from "@/assets/tkb-logo.png";

interface Order {
  id: string;
  amount: number;
  network: string;
  total: number;
  status: "pending" | "paid" | "completed" | "expired" | "cancelled";
  createdAt: Date;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const {
    binancePrice,
    tkbPrice,
    lastUpdate,
    isLoading
  } = useBinancePrice();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const fetchOrders = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }
      if (data) {
        setOrders(data.map(order => ({
          id: order.id,
          amount: Number(order.amount),
          network: order.network,
          total: Number(order.total),
          status: order.status as Order['status'],
          createdAt: new Date(order.created_at)
        })));
      }
    };
    fetchOrders();
  }, []);
  const handleLogout = async () => {
    await signOut();
  };
  const getStatusBadge = (status: Order["status"]) => {
    const variants = {
      pending: {
        label: "Aguardando",
        className: "bg-warning text-warning-foreground"
      },
      paid: {
        label: "Pago",
        className: "bg-primary text-primary-foreground"
      },
      completed: {
        label: "Concluído",
        className: "bg-success text-success-foreground"
      },
      expired: {
        label: "Expirado",
        className: "bg-muted text-muted-foreground"
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-destructive/80 text-destructive-foreground"
      }
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };
  // Patrimônio operado: apenas ordens concluídas
  const totalVolume = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  return <div className="min-h-screen bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-tkb-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220,15%,92%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220,15%,92%)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10">
      {/* Header */}
      <header className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-b border-neutral-700 shadow-xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-brand">TKB ASSET</h1>
                <p className="text-xs text-neutral-300 font-inter uppercase tracking-wider">Mesa OTC</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-inter hidden sm:inline">
                Olá, <strong className="font-semibold">{userName}</strong>
              </span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ExternalLink className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-neutral-600 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Stats Overview */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Visão Geral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={Briefcase} label="Patrimônio Operado" value={`R$ ${totalVolume.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}`} trend={completedOrders > 0 ? `${completedOrders} operações concluídas` : 'Nenhuma operação'} trendDirection="up" />
              <StatCard icon={Clock} label="Última Operação" value={orders.length > 0 ? orders[0].createdAt.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short'
            }) : 'Nenhuma'} trend={orders.length > 0 ? getStatusBadge(orders[0].status).props.children : ''} />
              <StatCard icon={TrendingUp} label="Total de Ordens" value={orders.length.toString()} trend={`${orders.length} ${orders.length === 1 ? 'ordem' : 'ordens'} criada${orders.length === 1 ? '' : 's'}`} />
            </div>
          </div>

          {/* Cotação Premium */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Cotação Atual
            </h2>
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Mercado</p>
                    <p className="text-5xl font-display font-bold text-foreground">
                      R$ {(binancePrice || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground font-inter">Par USDT/BRL</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm uppercase tracking-wider text-tkb-cyan font-semibold">TKB Asset</p>
                      <Badge className="bg-success/20 text-success border-success/30">AO VIVO</Badge>
                    </div>
                    <p className="text-5xl font-display font-bold text-tkb-cyan">
                      R$ {(tkbPrice || 0).toFixed(3)}
                    </p>
                    <p className="text-sm text-muted-foreground font-inter">Cotação Institucional</p>
                  </div>
                </div>
                <Button size="lg" variant="premium" className="w-full" onClick={() => navigate("/order/new")}>
                  <Plus className="h-5 w-5 mr-2" />
                  Solicitar Operação
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Histórico */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Histórico de Operações
            </h2>
            <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <CardContent className="p-0">
                {orders.length > 0 ? <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">ID</TableHead>
                          <TableHead className="font-semibold text-foreground">Valor</TableHead>
                          <TableHead className="font-semibold text-foreground">Rede</TableHead>
                          <TableHead className="font-semibold text-foreground">Total</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map(order => <TableRow key={order.id} className="cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate(`/order/${order.id}`)}>
                            <TableCell className="font-medium font-inter">#{order.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-semibold">{order.amount.toLocaleString()} USDT</TableCell>
                            <TableCell className="text-muted-foreground">{order.network}</TableCell>
                            <TableCell className="font-semibold">R$ {order.total.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {order.createdAt.toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div> : <div className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">Nenhuma ordem encontrada</p>
                      <p className="text-sm text-muted-foreground">Comece criando sua primeira ordem de compra</p>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </div>;
};

export default Dashboard;