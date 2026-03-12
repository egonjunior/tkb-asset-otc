import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import OrderFormCard from "@/components/OrderFormCard";
import RetroactiveOrderForm from "@/components/partner/RetroactiveOrderForm";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BankWireOrderForm from "@/components/BankWireOrderForm";

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
  const [quoteClients, setQuoteClients] = useState<any[]>([]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('otc_quote_clients')
        .select('id, client_name, spread_percent')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('client_name');

      if (data) {
        setQuoteClients(data);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (orderData: {
    amount: string;
    network: string;
    lockedPrice: number;
    total: number;
    lockedAt: string;
    walletAddress: string;
    quoteClientId?: string;
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
          wallet_address: orderData.walletAddress,
          total: orderData.total,
          locked_price: orderData.lockedPrice,
          locked_at: orderData.lockedAt,
          quote_client_id: orderData.quoteClientId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar email com dados da ordem
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'order-created',
          to: user.email,
          data: {
            nome_cliente: user.user_metadata?.full_name || 'Cliente',
            ordem_id: data.id,
            valor_brl: orderData.total.toFixed(2),
            quantidade_usdt: orderData.amount,
            cotacao: orderData.lockedPrice.toFixed(3),
            rede: orderData.network,
            tempo_validade: 5,
            banco: 'Banco Corpx',
            titular_conta: 'TKB ASSET LTDA',
            cnpj_conta: '45.933.866/0001-93',
            pix_cnpj: 'gestao@tkbasset.com',
            link_enviar_comprovante: `${window.location.origin} /order/${data.id} `
          }
        }
      }).catch(err => console.error('Error sending order email:', err));

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

  const handleBankWireSubmit = async (orderData: {
    usdAmount: number;
    brlTotal: number;
    lockedPrice: number;
    account: any;
    lockedAt: string;
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

      // In a real scenario, we would also save the account details or link to a bank_account entry
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amount: orderData.usdAmount,
          network: 'BANK_WIRE', // New type/network for bank wire
          total: orderData.brlTotal,
          locked_price: orderData.lockedPrice,
          locked_at: orderData.lockedAt,
          status: 'pending',
          payment_confirmed_at: null, // metadata could store bank details for now
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admin/user could go here

      toast({
        title: "Ordem de Remessa criada!",
        description: `Ordem ${data.id} aguardando comprovante de envio BRL`,
      });

      navigate(`/ order / ${data.id} `);
    } catch (error) {
      console.error('Error creating bank wire order:', error);
      toast({
        title: "Erro ao criar remessa",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetroactiveSubmit = async (orderData: {
    quoteClientId: string;
    brlAmount: number;
    usdtAmount: number;
    executedAt: string;
    proofFile?: File;
  }) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      let receiptUrl = null;

      // Se houver arquivo de comprovante, faz o upload
      if (orderData.proofFile) {
        const fileExt = orderData.proofFile.name.split('.').pop();
        const fileName = `retroactive-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, orderData.proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      // Calcula a cotação que o parceiro fechou
      const lockedPrice = orderData.brlAmount / orderData.usdtAmount;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amount: orderData.usdtAmount,
          network: 'TRC20', // Default para ordens retroativas sem rede específica
          total: orderData.brlAmount,
          locked_price: lockedPrice,
          locked_at: orderData.executedAt,
          quote_client_id: orderData.quoteClientId !== "none" ? orderData.quoteClientId : null,
          status: 'completed', // Ordem retroativa já entra como concluída pro CRM
          receipt_url: receiptUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Operação Lançada!",
        description: "Os dados já constam no seu Dashboard e histórico.",
      });

      // Volta pro dashboard após lançar a ordem manual
      navigate("/dashboard");

    } catch (error) {
      console.error('Error creating retroactive order:', error);
      toast({
        title: "Erro ao lançar",
        description: "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-black relative overflow-x-hidden font-inter">
      {/* Background Ambient Glows */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: 'radial-gradient(ellipse, #00D4FF 0%, transparent 80%)' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#06080E]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-black border border-white/[0.08] flex items-center justify-center shadow-xl">
                <Coins className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div>
                <h1 className="text-sm font-brand tracking-widest text-white uppercase">Mesa de Operações</h1>
                <p className="text-[10px] text-[#00D4FF] font-mono uppercase tracking-[0.2em] mt-0.5">Execução Institucional</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-white/20 text-[10px] font-mono uppercase tracking-widest">
            Acesso Criptografado <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-10 relative z-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Market Info Card - Already has some styles but can be wrapped or refined */}
          <div className="opacity-90">
            {/* MarketInfoCard component was removed */}
          </div>

          {/* Tab Switcher: Digital Dollar vs Bank Wire */}
          <Tabs defaultValue="digital_dollar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-10 h-14 bg-black/40 backdrop-blur-xl border border-white/[0.05] p-1.5 rounded-2xl">
              <TabsTrigger
                value="digital_dollar"
                className="rounded-xl text-[11px] font-mono tracking-[0.2em] uppercase data-[state=active]:bg-[#00D4FF] data-[state=active]:text-[#06080E] data-[state=active]:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-premium"
              >
                Ativos Digitais (USDT)
              </TabsTrigger>
              <TabsTrigger
                value="bank_wire"
                className="rounded-xl text-[11px] font-mono tracking-[0.2em] uppercase data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#06080E] data-[state=active]:shadow-[0_0_20px_rgba(212,168,83,0.2)] transition-premium"
              >
                Câmbio Bancário (USD)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="digital_dollar" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {quoteClients.length > 0 ? (
                <Tabs defaultValue="live" className="w-full">
                  <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-11 bg-white/[0.03] border border-white/[0.05] p-1 rounded-xl">
                      <TabsTrigger value="live" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">
                        📊 Execução Spot
                      </TabsTrigger>
                      <TabsTrigger value="retro" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">
                        📝 Lote Retroativo
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="live" className="animate-in fade-in zoom-in-95 duration-500">
                    <OrderFormCard
                      tkbPrice={tkbPrice}
                      binancePrice={binancePrice}
                      isLoading={isLoading}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                      quoteClients={quoteClients}
                    />
                  </TabsContent>

                  <TabsContent value="retro" className="animate-in fade-in zoom-in-95 duration-500">
                    <RetroactiveOrderForm
                      onSubmit={handleRetroactiveSubmit}
                      isSubmitting={isSubmitting}
                      quoteClients={quoteClients}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <OrderFormCard
                  tkbPrice={tkbPrice}
                  binancePrice={binancePrice}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  quoteClients={quoteClients}
                />
              )}
            </TabsContent>

            <TabsContent value="bank_wire" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <BankWireOrderForm
                binancePrice={binancePrice}
                isLoading={isLoading}
                onSubmit={handleBankWireSubmit}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TradingOrderPage;
