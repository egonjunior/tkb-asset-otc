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
import { OperationalNoteModal } from "@/components/operational-notes/OperationalNoteModal";
import { OperationalNotesList } from "@/components/operational-notes/OperationalNotesList";
import { Briefcase, LogOut, Plus, Clock, TrendingUp, Settings, FileText } from "lucide-react";
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
  status: "pending" | "paid" | "completed" | "expired" | "cancelled" | "rejected" | "processing";
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
  const [showOperationalNoteModal, setShowOperationalNoteModal] = useState(false);
  const [operationalNotesRefresh, setOperationalNotesRefresh] = useState(0);
  const [pricingStatus, setPricingStatus] = useState<string>("active");

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
      if (user) {
        // Fetch pricing status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('pricing_status')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData && profileData.pricing_status) {
          setPricingStatus(profileData.pricing_status);
        }
      }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    const variants: Record<string, { label: string; dot: string; text: string }> = {
      pending: {
        label: "Aguardando",
        dot: "bg-warning",
        text: "text-warning"
      },
      paid: {
        label: "Pago",
        dot: "bg-primary",
        text: "text-primary"
      },
      processing: {
        label: "Processando",
        dot: "bg-tkb-cyan",
        text: "text-tkb-cyan"
      },
      completed: {
        label: "Concluído",
        dot: "bg-success",
        text: "text-success"
      },
      expired: {
        label: "Expirado",
        dot: "bg-muted-foreground",
        text: "text-muted-foreground"
      },
      cancelled: {
        label: "Cancelado",
        dot: "bg-destructive/80",
        text: "text-destructive/80"
      },
      rejected: {
        label: "Rejeitado",
        dot: "bg-destructive",
        text: "text-destructive"
      }
    };
    const variant = variants[status] || { label: status, dot: "bg-muted", text: "text-muted-foreground" };
    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
        <span className={`w-1.5 h-1.5 rounded-full ${variant.dot}`}></span>
        <span className={variant.text}>{variant.label}</span>
      </div>
    );
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
    <div className="dark min-h-screen w-full bg-background relative overflow-hidden">
      {/* Subtle ambient glow — premium depth */}
      <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,111,224,0.08) 0%, rgba(0,212,255,0.04) 50%, transparent 100%)' }}></div>
      <div className="absolute -bottom-[300px] right-[10%] w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.04) 0%, transparent 80%)' }}></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="h-20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-white/[0.06] sticky top-0 z-50 shadow-[0_1px_0_0_rgba(212,168,83,0.08)]">
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden text-foreground hover:bg-white/5" />

                <div
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => navigate('/dashboard')}
                >
                  <img src={tkbLogo} alt="TKB Asset" className="h-12 w-12" />
                  <div>
                    <h1 className="text-2xl font-brand text-foreground tracking-tight">TKB ASSET</h1>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">Mesa OTC</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-inter text-muted-foreground hidden sm:inline">
                  Operador <strong className="font-semibold text-foreground">{userName}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border"></div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground hover:bg-white/5">
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
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-3">
                  <span className="w-6 h-px bg-gradient-to-r from-[hsl(45,60%,58%)] to-transparent"></span>
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
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-3">
                  <span className="w-6 h-px bg-gradient-to-r from-[hsl(195,100%,50%)] to-transparent"></span>
                  Execução OTC
                </h2>
                <Card className={`bg-card/80 backdrop-blur-sm border-white/[0.06] shadow-xl transition-all ${orders.length === 0
                  ? 'ring-1 ring-[hsl(45,60%,58%)]/10'
                  : ''
                  }`}>
                  <CardContent className={orders.length === 0 ? "p-8 pt-6" : "p-8"}>
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Mercado / Referência</p>
                        <p className="text-5xl font-display font-medium text-foreground tabular-nums tracking-tight">
                          <span className="text-2xl text-muted-foreground mr-1">R$</span>
                          {(binancePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </p>
                        <p className="text-xs text-muted-foreground font-inter">Par USDT/BRL</p>
                      </div>
                      <div className="space-y-4 relative">
                        {/* Decorative separator on desktop */}
                        <div className="hidden md:block absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>

                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-widest text-tkb-cyan font-mono">Execução TKB</p>
                          <div className="flex items-center gap-2 text-xs font-mono text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                            AO VIVO
                          </div>
                        </div>
                        <p className="text-5xl font-display font-medium text-tkb-cyan tabular-nums tracking-tight">
                          <span className="text-2xl text-tkb-cyan/60 mr-1">R$</span>
                          {(tkbPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </p>
                        <p className="text-xs text-muted-foreground font-inter">Cotação Institucional</p>
                      </div>
                    </div>
                    {orders.length === 0 && (
                      <div className="mb-6 px-4 py-3 rounded border border-primary/10 bg-primary/5 flex items-start gap-3">
                        <div className="w-1 h-full bg-primary absolute left-0 top-0 bottom-0 rounded-l"></div>
                        <p className="text-xs text-muted-foreground/90 font-mono tracking-wide">
                          Monitoramento ativo. Solicite a operação quando o preço estiver favorável.
                        </p>
                      </div>
                    )}

                    {pricingStatus === 'pending' ? (
                      <Button size="lg" variant="outline" disabled className="w-full bg-warning/5 text-warning border-warning/20 font-mono tracking-wide h-14">
                        <Clock className="h-4 w-4 mr-2" />
                        PERFIL EM ANÁLISE PELA MESA
                      </Button>
                    ) : (
                      <Button size="lg" variant="default" className="w-full h-14 bg-gradient-to-r from-tkb-cyan-dark to-primary hover:from-primary hover:to-primary-glow text-white border-0 font-medium tracking-wide shadow-lg shadow-primary/20" onClick={() => navigate("/order/new")}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        {orders.length === 0 ? "NOVA ORDEM" : "EXECUTAR OPERAÇÃO"}
                      </Button>
                    )}

                    <div className="flex justify-center mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest"
                        onClick={() => setShowOperationalNoteModal(true)}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Solicitar Nota de Corretagem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notas Operacionais do Usuário */}
              <OperationalNotesList refreshTrigger={operationalNotesRefresh} />

              {/* Histórico */}
              <div>
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-3">
                  <span className="w-6 h-px bg-gradient-to-r from-[hsl(45,60%,58%)] to-transparent"></span>
                  Histórico de Operações
                </h2>
                <Card className="bg-card/80 backdrop-blur-sm border-white/[0.06] shadow-lg">
                  <CardContent className="p-0">
                    {orders.length > 0 ? <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ID</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Valor</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rede</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map(order => <TableRow key={order.id} className="cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/[0.04]" onClick={() => navigate(`/order/${order.id}`)}>
                            <TableCell className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-semibold tabular-nums tracking-tight">{order.amount.toLocaleString()} USDT</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{order.network}</TableCell>
                            <TableCell className="font-semibold text-primary tabular-nums tracking-tight">R$ {order.total.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2
                            })}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[10px]">
                              {order.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                        {pricingStatus === 'pending' ? (
                          <Button size="lg" variant="outline" disabled className="gap-2 bg-warning/10 text-warning-foreground border-warning/50 border-dashed w-full max-w-sm mx-auto">
                            <Clock className="h-5 w-5" />
                            Aguardando Liberação da Mesa
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            variant="premium"
                            onClick={() => navigate("/order/new")}
                            className="gap-2"
                          >
                            <Plus className="h-5 w-5" />
                            Criar Minha Primeira Ordem
                          </Button>
                        )}

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

    {/* Operational Note Modal */}
    <OperationalNoteModal
      isOpen={showOperationalNoteModal}
      onClose={() => setShowOperationalNoteModal(false)}
      onSuccess={() => setOperationalNotesRefresh(prev => prev + 1)}
    />
  </SidebarProvider>;
};

export default Dashboard;