import { useState, useEffect } from "react";
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

  const [clientLink, setClientLink] = useState<any>(null);
  const [clientMarkup, setClientMarkup] = useState<number>(1.0);
  const [slug, setSlug] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchClientLink = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('otc_quote_clients')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();

        if (data) {
          setClientLink(data);
          setSlug(data.slug);
          setClientMarkup(data.spread_percent);
        }
      } catch (err) {
        console.error("Error fetching client link:", err);
      }
    };
    fetchClientLink();
  }, []);

  const handleGenerateLink = async () => {
    if (!acceptedTerms) return;
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingSlug } = await supabase
        .from('otc_quote_clients')
        .select('id, created_by')
        .eq('slug', slug)
        .maybeSingle();

      if (existingSlug && existingSlug.created_by !== user.id) {
        toast.error("Esta URL já está em uso por outro parceiro.");
        setIsGenerating(false);
        return;
      }

      const payload = {
        slug,
        client_name: companyName || "Mesa Parceira",
        spread_percent: clientMarkup,
        created_by: user.id,
        price_source: 'binance',
        is_active: true
      };

      if (clientLink) {
        const { error } = await supabase
          .from('otc_quote_clients')
          .update(payload)
          .eq('id', clientLink.id);
        if (error) throw error;
        toast.success("Link atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('otc_quote_clients')
          .insert(payload);
        if (error) throw error;
        toast.success("Link gerado e ativo com sucesso!");
      }

      // Refresh
      const { data } = await supabase
        .from('otc_quote_clients')
        .select('*')
        .eq('created_by', user.id)
        .maybeSingle();
      if (data) setClientLink(data);

    } catch (error: any) {
      console.error("Erro ao gerar link:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

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

        {/* Meus Links de Cotação - Mesa Branca */}
        <Card className="max-w-4xl mx-auto mb-8 bg-gradient-to-br from-neutral-900 to-black text-white border-tkb-cyan/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-display text-white mb-2">Seu Portal de Clientes (Mesa Branca)</CardTitle>
                <CardDescription className="text-neutral-400">
                  Gere um link público onde seus clientes podem acompanhar a cotação com o <strong>SEU</strong> spread adicionado ao preço da TKB.
                </CardDescription>
              </div>
              <div className="bg-tkb-cyan/20 p-3 rounded-full hidden sm:block">
                <TrendingUp className="h-6 w-6 text-tkb-cyan" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {clientLink ? (
              <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-tkb-cyan flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Seu Link Institucional
                  </h4>
                  <Badge variant="outline" className="text-white border-neutral-600">Ativo</Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Input
                    readOnly
                    value={`https://tkbasset.com/${clientLink.slug}`}
                    className="bg-black border-neutral-700 text-white font-mono"
                  />
                  <Button
                    variant="outline"
                    className="shrink-0 text-black bg-white hover:bg-neutral-200"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://tkbasset.com/${clientLink.slug}`);
                      toast.success("Link copiado para a área de transferência!");
                    }}
                  >
                    Copiar Link
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                  <div className="bg-black p-4 rounded border border-neutral-800">
                    <p className="text-neutral-500 mb-1">Nome de Exibição</p>
                    <p className="font-medium">{clientLink.client_name}</p>
                  </div>
                  <div className="bg-black p-4 rounded border border-neutral-800">
                    <p className="text-neutral-500 mb-1">Spread Cobrado do seu Cliente</p>
                    <p className="font-medium text-success">+{clientLink.spread_percent}%</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-4 text-center">Para alterar o spread, preencha o formulário novamente.</p>
              </div>
            ) : null}

            <div className="mt-8 pt-8 border-t border-neutral-800">
              <h3 className="font-semibold text-lg mb-6">{clientLink ? "Atualizar Configurações" : "Configurar Novo Link"}</h3>
              <div className="grid md:grid-cols-2 gap-8">

                {/* Div de Simulação */}
                <div className="bg-neutral-800/30 p-6 rounded-lg border border-neutral-800 order-2 md:order-1 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Simulação de Preço</h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Preço Base TKB:</span>
                      <span className="font-medium">R$ {tkbPrice?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-tkb-cyan">
                      <span>Seu Markup (+{clientMarkup}%):</span>
                      <span className="font-bold">+ R$ {((tkbPrice || 0) * (clientMarkup / 100)).toFixed(4)}</span>
                    </div>
                    <div className="h-px bg-neutral-700 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">O Cliente vai ver:</span>
                      <span className="text-2xl font-display font-bold text-white">
                        R$ {((tkbPrice || 0) * (1 + clientMarkup / 100)).toFixed(4)}
                      </span>
                    </div>
                    <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
                      <p className="text-xs text-neutral-400">Seu Lucro Bruto Projetado por USDT</p>
                      <p className="text-lg font-bold text-success mt-1">R$ {((tkbPrice || 0) * (clientMarkup / 100)).toFixed(4)} / USDT</p>
                    </div>
                  </div>
                </div>

                {/* Formulário */}
                <div className="space-y-5 order-1 md:order-2">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">URL Personalizada (Slug)</Label>
                    <div className="flex items-center">
                      <span className="bg-neutral-800 text-neutral-400 px-3 py-2 rounded-l-md border border-neutral-700 border-r-0 text-sm">tkbasset.com/</span>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="sua-empresa"
                        className="rounded-l-none bg-black border-neutral-700 text-white focus-visible:ring-tkb-cyan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-300">Seu Spread (%) sobre a cotação</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={clientMarkup}
                        onChange={(e) => setClientMarkup(parseFloat(e.target.value))}
                        className="flex-1 accent-tkb-cyan"
                      />
                      <span className="font-bold w-12 text-right">{clientMarkup.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-black/50 border border-neutral-800 p-4 rounded-md space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-700 text-tkb-cyan focus:ring-tkb-cyan cursor-pointer"
                      />
                      <Label htmlFor="terms" className="text-xs text-neutral-400 leading-tight cursor-pointer">
                        Li e aceito o <strong className="text-neutral-300">Termo de Parceria Comercial B2B</strong>. Declaro responsabilidade pela intermediação com o cliente final e concordo com os termos e regras de liquidação D0 estipuladas pela TKB Asset sob regulação da Lei 14.478/2022.
                      </Label>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateLink}
                    disabled={!acceptedTerms || isGenerating || !slug}
                    className="w-full bg-tkb-cyan hover:bg-tkb-cyan/90 text-black font-semibold"
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    {clientLink ? "Atualizar meu Link" : "Assinar Termo e Gerar Link"}
                  </Button>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Ordem original */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Executar Ordem B2B
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
