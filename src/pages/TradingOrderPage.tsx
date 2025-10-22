import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Coins, Network } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import PriceChart from "@/components/PriceChart";
import PriceLockCard from "@/components/PriceLockCard";
import { supabase } from "@/integrations/supabase/client";

const TradingOrderPage = () => {
  const navigate = useNavigate();
  const { binancePrice, tkbPrice, isLoading } = useBinancePrice();
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("");
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const networks = [
    { value: "TRC20", label: "TRC20 (Tron)", icon: "🟢" },
    { value: "ERC20", label: "ERC20 (Ethereum)", icon: "🔷" },
    { value: "BEP20", label: "BEP20 (BSC)", icon: "🟡" },
    { value: "POLYGON", label: "Polygon", icon: "🟣" },
  ];

  const total = lockedPrice && amount ? parseFloat(amount) * lockedPrice : 0;

  const handlePriceLocked = (price: number) => {
    setLockedPrice(price);
    toast({
      title: "Preço travado!",
      description: `Preço garantido de R$ ${price.toFixed(3)} por 2 minutos`,
    });
  };

  const handlePriceExpired = () => {
    setLockedPrice(null);
    toast({
      title: "Preço expirado",
      description: "Trave o preço novamente para continuar",
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !network) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) < 100) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para compra é 100 USDT",
        variant: "destructive",
      });
      return;
    }

    if (!lockedPrice) {
      toast({
        title: "Trave o preço",
        description: "Você precisa travar o preço antes de confirmar a ordem",
        variant: "destructive",
      });
      return;
    }

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
          amount: parseFloat(amount),
          network,
          total,
          locked_price: lockedPrice,
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
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Chart and Price Lock */}
            <div className="space-y-6">
              <PriceChart currentPrice={binancePrice} isLoading={isLoading} />
              <PriceLockCard
                currentPrice={binancePrice}
                tkbPrice={tkbPrice}
                onPriceLocked={handlePriceLocked}
                onPriceExpired={handlePriceExpired}
              />
            </div>

            {/* Right Column - Order Form */}
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Nova Ordem</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Quantidade de USDT</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Ex: 1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="100"
                        step="0.01"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor mínimo: 100 USDT
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network">Rede Blockchain</Label>
                      <Select value={network} onValueChange={setNetwork} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a rede" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((net) => (
                            <SelectItem key={net.value} value={net.value}>
                              <div className="flex items-center gap-2">
                                <span>{net.icon}</span>
                                <span>{net.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {amount && network && lockedPrice && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6 space-y-3">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Resumo da Ordem
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantidade:</span>
                              <span className="font-medium">{parseFloat(amount).toLocaleString()} USDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rede:</span>
                              <span className="font-medium">{network}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Preço Travado:</span>
                              <span className="font-medium text-primary">R$ {lockedPrice.toFixed(3)}</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between text-base">
                              <span className="font-semibold">Total a pagar:</span>
                              <span className="font-bold text-primary text-lg">
                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/dashboard")}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={!lockedPrice || isSubmitting}
                      >
                        {isSubmitting ? "Criando..." : "Confirmar Ordem"}
                      </Button>
                    </div>

                    {!lockedPrice && (
                      <p className="text-xs text-center text-muted-foreground">
                        Trave o preço ao lado para habilitar a confirmação
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingOrderPage;
