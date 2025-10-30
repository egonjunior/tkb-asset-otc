import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import MarketInfoCard from "@/components/MarketInfoCard";
import OrderFormCard from "@/components/OrderFormCard";
import { supabase } from "@/integrations/supabase/client";

const TradingOrderPage = () => {
  const navigate = useNavigate();
  const { 
    binancePrice, 
    tkbPrice, 
    isLoading,
    dailyChangePercent,
    volumeUSDT,
    highPrice24h,
    lowPrice24h,
    tradesCount,
    lastUpdate,
  } = useBinancePrice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (orderData: { 
    amount: string; 
    network: string; 
    lockedPrice: number; 
    total: number 
  }) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar uma ordem",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amount: parseFloat(orderData.amount),
          network: orderData.network,
          total: orderData.total,
          locked_price: orderData.lockedPrice,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ordem criada com sucesso!",
        description: `Ordem ${data.id} aguardando pagamento`,
      });
      
      navigate(`/order/${data.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro ao criar ordem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Trading OTC</h1>
                <p className="text-xs text-muted-foreground">Compra de USDT</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Market Info Card */}
          <MarketInfoCard
            isLoading={isLoading}
            dailyChangePercent={dailyChangePercent}
            volumeUSDT={volumeUSDT}
            highPrice24h={highPrice24h}
            lowPrice24h={lowPrice24h}
            tradesCount={tradesCount}
            lastUpdate={lastUpdate}
          />

          {/* Order Form Card - Integrated */}
          <OrderFormCard
            tkbPrice={tkbPrice}
            binancePrice={binancePrice}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>
    </div>
  );
};

export default TradingOrderPage;
