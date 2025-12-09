import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import QuoteCard from "@/components/QuoteCard";
import { StatCard } from "@/components/StatCard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { Briefcase, LogOut, Plus, Clock, TrendingUp, Settings } from "lucide-react";
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
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const {
    binancePrice,
    tkbPrice,
    lastUpdate,
    isLoading
  } = useBinancePrice();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if should show onboarding
  useEffect(() => {
    const shouldShowOnboarding = localStorage.getItem("show_onboarding") === "true";
    const onboardingCompleted = localStorage.getItem("onboarding_completed") === "true";
    
    if (shouldShowOnboarding && !onboardingCompleted) {
      setShowOnboarding(true);
      localStorage.removeItem("show_onboarding");
    }
  }, []);

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

  // Show loading state while auth is initializing - MUST be after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }
  const formatCurrency = (value: number): string => {
    if (value >= 10_000) {
      // Valores grandes: sem decimais para melhor legibilidade
      return `R$ ${value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
    } else {
      // Valores menores: com 2 decimais para precisão
      return `R$ ${value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
  };

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
  return <SidebarProvider 
      defaultOpen={false}
      style={{ 
        ["--sidebar-width" as any]: "16rem",
        ["--sidebar-width-mobile" as any]: "18rem" 
      }}
    >
      <div className="min-h-screen w-full bg-gradient-to-br from-[hsl(220,20%,98%)] via-[hsl(200,30%,96%)] to-[hsl(180,25%,97%)] relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-tkb-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(220,15%,92%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(220,15%,92%)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-b border-neutral-700 shadow-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden text-white hover:bg-white/10" />
              
              <div 
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              >
                <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
                <div>
                  <h1 className="text-2xl font-brand">TKB ASSET</h1>
                  <p className="text-xs text-neutral-300 font-inter uppercase tracking-wider">Mesa OTC</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-inter hidden sm:inline">
                Olá, <strong className="font-semibold">{userName}</strong>
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-neutral-600 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
        </header>

        {/* Layout com Sidebar e Conteúdo */}
        <div className="flex w-full min-h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main Content */}
          <main className="flex-1 px-4 md:px-6 py-6 md:py-10 w-full">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-10">
          
          {/* Welcome Banner for new users */}
          {orders.length === 0 && (
            <WelcomeBanner userName={userName} />
          )}

          {/* Stats Overview */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Visão Geral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                icon={Briefcase} 
                label="Patrimônio Operado" 
                value={formatCurrency(totalVolume)} 
                trend={completedOrders > 0 ? `${completedOrders} operações concluídas` : 'Nenhuma operação'} 
                trendDirection="up"
                emptyStateAction={totalVolume === 0 ? {
                  label: "Criar primeira ordem",
                  onClick: () => navigate("/order/new")
                } : undefined}
              />
              <StatCard 
                icon={Clock} 
                label="Última Operação" 
                value={orders.length > 0 ? orders[0].createdAt.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short'
                }) : 'Nenhuma'} 
                trend={orders.length > 0 ? getStatusBadge(orders[0].status).props.children : ''}
                emptyStateAction={orders.length === 0 ? {
                  label: "Ver cotação atual",
                  onClick: () => window.scrollTo({ top: 400, behavior: 'smooth' })
                } : undefined}
              />
              <StatCard 
                icon={TrendingUp} 
                label="Total de Ordens" 
                value={orders.length.toString()} 
                trend={`${orders.length} ${orders.length === 1 ? 'ordem' : 'ordens'} criada${orders.length === 1 ? '' : 's'}`}
              />
              </div>
          </div>

          {/* Cotação Premium */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Cotação Atual
            </h2>
            <Card className={`bg-white/90 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all ${
              orders.length === 0 
                ? 'border-primary/30 ring-2 ring-primary/10 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.1)]' 
                : 'border-white/50'
            }`}>
              {orders.length === 0 && (
                <CardHeader className="pb-2">
                  <Badge className="w-fit bg-tkb-cyan/10 text-tkb-cyan border-tkb-cyan/30 font-semibold">
                    ✨ Comece aqui
                  </Badge>
                </CardHeader>
              )}
              <CardContent className={orders.length === 0 ? "p-8 pt-2" : "p-8"}>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Mercado</p>
                    <p className="text-5xl font-display font-bold text-foreground">
                      R$ {(binancePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-sm text-muted-foreground font-inter">Par USDT/BRL</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm uppercase tracking-wider text-tkb-cyan font-semibold">TKB Asset</p>
                      <Badge className="bg-success/20 text-success border-success/30">AO VIVO</Badge>
                    </div>
                    <p className="text-5xl font-display font-bold text-tkb-cyan">
                      R$ {(tkbPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-sm text-muted-foreground font-inter">Cotação Institucional</p>
                  </div>
                </div>
                {orders.length === 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-center text-foreground/70 flex items-center justify-center gap-2">
                      <span className="text-base">💡</span>
                      <span>Monitore a cotação e solicite quando encontrar o melhor momento</span>
                    </p>
                  </div>
                )}
                <Button size="lg" variant="premium" className="w-full" onClick={() => navigate("/order/new")}>
                  <Plus className="h-5 w-5 mr-2" />
                  {orders.length === 0 ? "Criar Minha Primeira Ordem" : "Solicitar Operação"}
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
                    <div className="max-w-md mx-auto space-y-6">
                      {/* Ícone maior e mais visível */}
                      <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-tkb-cyan/10 
                                    flex items-center justify-center mx-auto">
                        <Clock className="h-12 w-12 text-primary" />
                      </div>
                      
                      {/* Textos mais amigáveis */}
                      <div className="space-y-2">
                        <p className="text-xl font-display font-bold text-foreground">
                          Seu histórico está vazio
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Comece agora mesmo! Solicite sua primeira operação e 
                          acompanhe tudo por aqui.
                        </p>
                      </div>
                      
                      {/* CTA principal */}
                      <Button 
                        size="lg" 
                        variant="premium" 
                        onClick={() => navigate("/order/new")}
                        className="gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Criar Minha Primeira Ordem
                      </Button>
                      
                      {/* Link secundário */}
                      <p className="text-xs text-muted-foreground">
                        <button 
                          onClick={() => navigate("/suporte")}
                          className="underline hover:text-primary transition-colors"
                        >
                          Precisa de ajuda?
                        </button>
                      </p>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>
            </div>
          </main>
        </div>
        </div>
      </div>

      {/* Onboarding Modal for new users */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        userName={userName}
      />
    </SidebarProvider>;
};

export default Dashboard;