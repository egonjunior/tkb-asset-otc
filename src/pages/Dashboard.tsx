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
import QuoteCard from "@/components/QuoteCard";
import { Coins, LogOut, Plus, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  amount: number;
  network: string;
  total: number;
  status: "pending" | "paid" | "completed" | "expired";
  createdAt: Date;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Usuário";
  const { binancePrice, tkbPrice, lastUpdate, isLoading } = useBinancePrice();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
          createdAt: new Date(order.created_at),
        })));
      }
    };

    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/login");
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
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TKB Asset</h1>
                <p className="text-xs text-muted-foreground">Plataforma OTC</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Olá, <strong className="text-foreground">{userName}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Cotação */}
          <div>
            <QuoteCard
              binancePrice={binancePrice || 0}
              otcPrice={tkbPrice || 0}
              lastUpdate={lastUpdate}
            />
            <div className="mt-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => navigate("/order/new")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Solicitar Compra de USDT
              </Button>
            </div>
          </div>

          {/* Histórico */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Ordens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Rede</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.amount.toLocaleString()} USDT</TableCell>
                          <TableCell>{order.network}</TableCell>
                          <TableCell>R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.createdAt.toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma ordem encontrada</p>
                  <p className="text-sm mt-2">Comece criando sua primeira ordem de compra</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
