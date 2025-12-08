import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Upload, Copy, CheckCircle2, AlertCircle, Package, Send, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Aguardando Pagamento", className: "bg-warning text-warning-foreground" },
      paid: { label: "Pagamento Recebido", className: "bg-blue-500 text-white" },
      completed: { label: "Concluída", className: "bg-success text-white" },
      expired: { label: "Expirada", className: "bg-destructive text-white" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Dados bancários fixos (não mudam)
  const bankData = {
    bank: "Banco do Brasil",
    agency: "6869-1",
    account: "33826-5",
    cnpj: "45.933.866/0001-93",
    name: "Tokenizacao Management Gestao de negocios e Patrimonio e Inv",
    pix: "45.933.866/0001-93",
  };

  // Buscar ordem e eventos da timeline
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError('Ordem não encontrada');
          return;
        }

        setOrder(data);

        // Buscar eventos da timeline
        const { data: timelineData } = await supabase
          .from('order_timeline')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        if (timelineData) {
          setTimelineEvents(timelineData);
        }

        // Registrar visualização da hash se a ordem estiver concluída
        if (data.status === 'completed' && data.transaction_hash) {
          trackHashViewed(data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Não foi possível carregar a ordem');
      } finally {
        setLoading(false);
      }
    };

    // Função para registrar visualização da hash
    const trackHashViewed = async (orderData: any) => {
      try {
        const isFirstView = !orderData.hash_viewed_at;
        const currentCount = orderData.hash_viewed_count || 0;

        // Atualizar ordem com informações de visualização
        const updateData: any = {
          hash_viewed_count: currentCount + 1
        };

        // Registrar primeira visualização
        if (isFirstView) {
          updateData.hash_viewed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderData.id);

        if (updateError) {
          console.error('[OrderDetails] Error updating hash view count:', updateError);
          return; // Não continua se falhou
        }

        // Adicionar evento na timeline apenas na primeira visualização
        if (isFirstView) {
          const { error: timelineError } = await supabase
            .from('order_timeline')
            .insert({
              order_id: orderData.id,
              event_type: 'hash_viewed',
              message: 'Cliente visualizou a transação na plataforma',
              actor_type: 'user'
            });

          if (timelineError) {
            console.error('[OrderDetails] Error inserting timeline event:', timelineError);
          } else {
            console.log(`[OrderDetails] Timeline event created for hash view on order ${orderData.id}`);
          }
        }

        console.log(`[OrderDetails] Hash viewed tracked for order ${orderData.id}, first view: ${isFirstView}, count: ${currentCount + 1}`);
      } catch (error) {
        console.error('[OrderDetails] Error tracking hash view:', error);
      }
    };

    fetchOrder();

    // Realtime subscription para atualizações da ordem e timeline
    const orderChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_timeline',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setTimelineEvents((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [orderId]);

  // Calcular tempo restante baseado em locked_at
  useEffect(() => {
    if (!order?.locked_at) return;

    const calculateTimeRemaining = () => {
      const lockedAt = new Date(order.locked_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - lockedAt) / 1000);
      const remaining = Math.max(0, 300 - elapsed); // 300s = 5 min
      return remaining;
    };

    // Calcular inicialmente
    setTimeRemaining(calculateTimeRemaining());

    // Atualizar a cada segundo
    const interval = setInterval(async () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Quando o tempo expirar e o status ainda for pending, atualizar para expired
      if (remaining <= 0) {
        clearInterval(interval);
        
        if (order.status === 'pending') {
          try {
            await supabase
              .from('orders')
              .update({ status: 'expired' })
              .eq('id', order.id);
            
            // Registrar evento na timeline
            await supabase
              .from('order_timeline')
              .insert({
                order_id: order.id,
                event_type: 'order_expired',
                message: 'Ordem expirada automaticamente por timeout',
                actor_type: 'system'
              });
          } catch (error) {
            console.error('Error expiring order:', error);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.locked_at, order?.status, order?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyBankData = () => {
    if (!order) return;
    const data = `Banco: ${bankData.bank}\nAgência: ${bankData.agency}\nConta: ${bankData.account}\nCNPJ: ${bankData.cnpj}\nPIX: ${bankData.pix}\nFavorecido: ${bankData.name}\nValor: R$ ${order.total.toFixed(2)}`;
    navigator.clipboard.writeText(data);
    toast({
      title: "Dados copiados!",
      description: "Informações bancárias copiadas para a área de transferência",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendReceipt = async () => {
    if (!selectedFile || !order) return;
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      
      // 1. PRIMEIRO: Upload para Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${order.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // 2. DEPOIS: Atualizar ordem com URL do comprovante (só se upload funcionou)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          receipt_url: fileName,
          status: 'paid'
        })
        .eq('id', order.id);
      
      if (updateError) {
        // Rollback: deletar arquivo se falhar ao salvar no banco
        await supabase.storage.from('receipts').remove([fileName]);
        throw updateError;
      }

      // 3. Registrar evento na timeline
      await supabase
        .from('order_timeline')
        .insert({
          order_id: order.id,
          event_type: 'receipt_uploaded',
          message: 'Comprovante de pagamento enviado',
          actor_type: 'user',
          metadata: {
            file_name: fileName
          }
        });
      
      toast({
        title: "Comprovante enviado com sucesso!",
        description: "Aguarde a análise do admin para confirmação do pagamento",
      });

      // 🚨 NOTIFICAÇÃO CRÍTICA: Comprovante enviado
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'receipt-uploaded',
          to: 'tkb.assetgestao@gmail.com',
          internal: true,
          data: {
            ordem_id: order.id,
            nome_cliente: order.profiles?.full_name || 'Cliente',
            valor_brl: order.total.toFixed(2),
            quantidade_usdt: order.amount,
            rede: order.network,
            carteira_destino: order.wallet_address,
            hora_envio_comprovante: new Date().toLocaleTimeString('pt-BR'),
            link_comprovante: `${window.location.origin}/admin/order/${order.id}`,
            link_admin_ordem: `${window.location.origin}/admin/order/${order.id}`
          }
        }
      }).catch(err => console.error('Error sending critical notification:', err));
      
      setSelectedFile(null);
      setOrder({ ...order, receipt_url: fileName });
      
    } catch (error: any) {
      console.error('Erro ao enviar comprovante:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 120; // últimos 2 minutos
  const isExpired = timeRemaining === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando ordem...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Ordem não encontrada</h2>
            <p className="text-muted-foreground">{error || 'Esta ordem não existe ou você não tem permissão para visualizá-la'}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ordem {order.id}</h1>
              <p className="text-xs text-muted-foreground">Detalhes da compra</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Informações da Ordem */}
            <div className="space-y-6">
              {/* Status e Timer */}
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusBadge(order.status).className}>
                      {getStatusBadge(order.status).label}
                    </Badge>
                    
                    {/* Mostrar timer APENAS se status for 'pending' */}
                    {order.status === 'pending' && (
                      <div className={`flex items-center gap-2 font-mono text-lg font-bold ${
                        isExpired ? "text-danger" : isExpiringSoon ? "text-warning" : "text-foreground"
                      }`}>
                        <Clock className="h-5 w-5" />
                        {formatTime(timeRemaining)}
                      </div>
                    )}
                  </div>
                  
                  {/* Alertas condicionais baseados no status */}
                  {order.status === 'pending' && isExpiringSoon && !isExpired && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">Tempo expirando!</p>
                        <p className="text-muted-foreground">Complete o pagamento rapidamente</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'expired' && (
                    <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-danger">Ordem expirada</p>
                        <p className="text-muted-foreground">Esta ordem foi cancelada automaticamente</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-success">Ordem concluída com sucesso!</p>
                        <p className="text-muted-foreground">Os USDT foram enviados para sua carteira</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'paid' && (
                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-500">Pagamento confirmado</p>
                        <p className="text-muted-foreground">Estamos processando o envio dos USDT</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados da Ordem */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantidade</p>
                      <p className="font-semibold">{order.amount.toLocaleString()} USDT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rede</p>
                      <p className="font-semibold">{order.network}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Carteira de Recebimento</p>
                      <p className="font-mono text-xs break-all">{order.wallet_address || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço unitário</p>
                      <p className="font-semibold">R$ {order.locked_price.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-primary text-base">
                        R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Criada em: {new Date(order.created_at).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              {/* Dados Bancários - mostrar apenas se pendente */}
              {order.status === 'pending' && (
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Dados Bancários</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopyBankData}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-3">
                    <div>
                      <p className="text-muted-foreground">Banco</p>
                      <p className="font-semibold">{bankData.bank}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">Agência</p>
                        <p className="font-semibold">{bankData.agency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conta</p>
                        <p className="font-semibold">{bankData.account}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ</p>
                      <p className="font-semibold">{bankData.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Favorecido</p>
                      <p className="font-semibold">{bankData.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Chave PIX (CNPJ)</p>
                      <p className="font-semibold font-mono">{bankData.pix}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground">Valor exato</p>
                      <p className="font-bold text-primary text-lg">
                        R$ {order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Use o número da ordem <strong>{order.id}</strong> como identificador no PIX/TED
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

            {/* Coluna Direita - Chat/Timeline */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Timeline da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timeline Events */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Evento: Ordem criada */}
                    <div className="flex gap-3 items-start">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sistema</p>
                        <p className="text-sm text-muted-foreground mt-1">Ordem criada - Aguardando pagamento</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Evento: Comprovante enviado */}
                    {order.receipt_url && (
                      <div className="flex gap-3 items-start">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-success/10">
                          <Upload className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Você</p>
                          <p className="text-sm text-muted-foreground mt-1">Comprovante de pagamento enviado</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.updated_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Eventos da timeline */}
                    {timelineEvents.map((event) => (
                      <div key={event.id} className="flex gap-3 items-start">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          event.event_type === 'payment_confirmed' ? 'bg-success/10' :
                          event.event_type === 'usdt_sent' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {event.event_type === 'payment_confirmed' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : event.event_type === 'usdt_sent' ? (
                            <Send className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {event.actor_type === 'admin' ? 'OTC' : event.actor_type === 'system' ? 'Sistema' : 'Você'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
                          {event.metadata?.transaction_hash && (
                            <a
                              href={event.metadata.transaction_hash}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                            >
                              Ver transação <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Status final */}
                    {order.status === 'completed' && !timelineEvents.some(e => e.event_type === 'usdt_sent') && (
                      <div className="flex gap-3 items-start">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-success/10">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Sistema</p>
                          <p className="text-sm text-muted-foreground mt-1">Ordem concluída</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.updated_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="border-t pt-4 space-y-3">
                    <Label htmlFor="receipt" className="text-sm font-medium block">
                      Anexar Comprovante
                    </Label>
                    
                    {/* Input de arquivo */}
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      disabled={['completed', 'expired'].includes(order.status) || isUploading || order.receipt_url !== null}
                      className="cursor-pointer"
                    />
                    
                    {/* Preview do arquivo selecionado */}
                    {selectedFile && !order.receipt_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-primary" />
                          <span className="text-sm">{selectedFile.name}</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleSendReceipt}
                          disabled={isUploading}
                        >
                          {isUploading ? "Enviando..." : "Enviar Comprovante"}
                        </Button>
                      </div>
                    )}
                    
                    {/* Confirmação visual após envio */}
                    {order.receipt_url && (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Comprovante enviado com sucesso</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Aceita imagens (JPG, PNG) e PDFs
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
