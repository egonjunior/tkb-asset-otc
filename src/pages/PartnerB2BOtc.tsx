import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, TrendingUp, TrendingDown, ArrowLeft, Loader2, Lock, CheckCircle, Sparkles } from "lucide-react";
import { usePartnerPrice } from "@/hooks/usePartnerPrice";

export default function PartnerB2BOtc() {
  const navigate = useNavigate();
  const { 
    tkbPrice, 
    standardPrice,
    isLoading, 
    isB2BPartner, 
    companyName,
    markupPercent,
    savings,
    savingsPercent,
    dailyChangePercent,
    volumeUSDT
  } = usePartnerPrice();

  const [formData, setFormData] = useState({
    amount: "",
    network: "TRC20",
    wallet_address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isB2BPartner) {
      toast.error("Você não tem permissão para acessar esta área");
      navigate('/partner/b2b');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const amount = parseFloat(formData.amount);
      const total = amount * (tkbPrice || 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amount,
          locked_price: tkbPrice || 0,
          total,
          network: formData.network,
          wallet_address: formData.wallet_address,
          partner_type: 'b2b',
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send email notification
      await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: 'Nova Ordem B2B OTC Criada',
          type: 'new_order',
          orderData: {
            orderId: order.id,
            amount,
            total,
            price: tkbPrice,
          },
        },
      });

      toast.success("Ordem criada com sucesso!");
      navigate(`/order/${order.id}`);
    } catch (error: any) {
      console.error("Error creating B2B order:", error);
      toast.error(`Erro ao criar ordem: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isB2BPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para parceiros B2B aprovados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/partner/b2b')} className="w-full">
              Solicitar Parceria B2B
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">Mesa OTC B2B</h1>
                <p className="text-muted-foreground">
                  {companyName || 'Parceiro B2B'} • Markup: {markupPercent}%
                </p>
              </div>
            </div>
            <Badge variant="default" className="gap-2">
              <Sparkles className="h-3 w-3" />
              Parceiro Ativo
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Cotação Real-Time */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sua Cotação B2B
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                R$ {tkbPrice?.toFixed(4) || '0.0000'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {dailyChangePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={dailyChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {dailyChangePercent.toFixed(2)}% (24h)
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Volume 24h</p>
                <p className="font-medium">{volumeUSDT.toLocaleString('pt-BR')} USDT</p>
              </div>
            </CardContent>
          </Card>

          {/* Economia vs Spread Padrão */}
          <Card className="border-2 border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Economia vs. Padrão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500 mb-2">
                R$ {savings.toFixed(4)}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Você economiza {savingsPercent}% por USDT
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spread Padrão:</span>
                  <span className="font-medium">R$ {standardPrice?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seu Spread B2B:</span>
                  <span className="font-medium text-primary">R$ {tkbPrice?.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Markup Configurado</p>
                <p className="text-2xl font-bold text-primary">{markupPercent}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="default">Ativo</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{companyName || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Ordem */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Criar Nova Ordem
            </CardTitle>
            <CardDescription>
              Compre USDT com seu spread personalizado de {markupPercent}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="amount">Quantidade USDT</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {formData.amount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      parseFloat(formData.amount) * (tkbPrice || 0)
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="network">Rede</Label>
                <Select value={formData.network} onValueChange={(value) => setFormData({ ...formData, network: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                    <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                    <SelectItem value="BSC">BSC (Binance Smart Chain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="wallet">Endereço da Carteira</Label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder="Seu endereço de carteira"
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando ordem...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Criar e Travar Ordem
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
