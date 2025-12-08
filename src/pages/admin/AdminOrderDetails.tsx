import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, FileText, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminOrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
const [transactionHash, setTransactionHash] = useState("");
  const [isSendingHash, setIsSendingHash] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);

  // Função para extrair hash de URL ou validar formato
  const extractHash = (input: string): string => {
    const trimmed = input.trim();
    
    // Se for URL do TronScan
    if (trimmed.includes('tronscan.org')) {
      const match = trimmed.match(/transaction\/([a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    
    // Se for URL do Etherscan
    if (trimmed.includes('etherscan.io')) {
      const match = trimmed.match(/tx\/(0x[a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    
    // Se for URL do BscScan
    if (trimmed.includes('bscscan.com')) {
      const match = trimmed.match(/tx\/(0x[a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    
    // Retorna o input limpo
    return trimmed;
  };

  // Validar formato da hash
  const validateHash = (hash: string): boolean => {
    // TRC20: 64 caracteres hexadecimais
    if (/^[a-fA-F0-9]{64}$/.test(hash)) return true;
    // ERC20/BEP20: 0x + 64 caracteres hexadecimais
    if (/^0x[a-fA-F0-9]{64}$/.test(hash)) return true;
    return false;
  };

  // Gerar link do explorer
  const getExplorerLink = (hash: string, network: string): string => {
    const links: Record<string, string> = {
      'TRC20': `https://tronscan.org/#/transaction/${hash}`,
      'ERC20': `https://etherscan.io/tx/${hash}`,
      'BEP20': `https://bscscan.com/tx/${hash}`
    };
    return links[network] || '#';
  };

  // Handler para mudança no input de hash
  const handleHashChange = (value: string) => {
    const extracted = extractHash(value);
    setTransactionHash(extracted);
    
    if (extracted && !validateHash(extracted)) {
      setHashError('Formato inválido. Hash deve ter 64 caracteres hexadecimais');
    } else {
      setHashError(null);
    }
  };

  useEffect(() => {
  const checkAdminAndFetchOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão de administrador",
        variant: "destructive",
      });
      navigate('/admin/dashboard');
      return;
    }

    fetchOrder();
  };

  const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        
        if (!orderData) {
          setError('Ordem não encontrada');
          return;
        }

        // Buscar dados do perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, document_number, document_type, email')
          .eq('id', orderData.user_id)
          .single();

        const orderWithProfile = {
          ...orderData,
          profiles: profileData || { full_name: 'N/A', document_number: 'N/A', document_type: 'N/A' }
        };

        setOrder(orderWithProfile);

        // Se tem comprovante, buscar URL assinada
        if (orderData.receipt_url) {
          const { data: signedData, error: storageError } = await supabase.storage
            .from('receipts')
            .createSignedUrl(orderData.receipt_url, 3600);
          
          if (storageError) {
            console.error('Erro ao buscar comprovante:', storageError);
            setReceiptPreview(null);
            setReceiptError('Arquivo não encontrado no storage. Solicite reenvio ao cliente.');
          } else if (signedData) {
            setReceiptPreview(signedData.signedUrl);
            setReceiptError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Não foi possível carregar a ordem');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchOrder();
  }, [orderId, navigate]);

  const handleDownloadReceipt = async () => {
    if (!order.receipt_url) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(order.receipt_url);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = order.receipt_url.split('/').pop() || 'comprovante';
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "Comprovante baixado com sucesso",
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Erro ao baixar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    
    setIsUpdating(true);
    
    try {
      // Atualizar status para 'processing' (aguardando envio USDT) e payment_confirmed_at
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (updateError) throw updateError;

      // Adicionar evento na timeline
      const { error: timelineError } = await supabase
        .from('order_timeline')
        .insert({
          order_id: order.id,
          event_type: 'payment_confirmed',
          actor_type: 'admin',
          message: 'OTC confirmou recebimento do PIX'
        });

      if (timelineError) throw timelineError;
      
      setOrder({ ...order, status: 'processing', payment_confirmed_at: new Date().toISOString() });

      // Buscar email do cliente
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (profileData?.email) {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'payment-confirmed',
            to: profileData.email,
            data: {
              nome_cliente: profileData.full_name,
              valor_brl: order.total.toFixed(2),
              quantidade_usdt: order.amount,
              carteira_destino: order.wallet_address
            }
          }
        });

        if (emailError) {
          console.error('Erro ao enviar email payment-confirmed:', emailError);
        } else {
          console.log('Email payment-confirmed enviado com sucesso:', emailData);
        }
      } else {
        console.warn('Perfil sem email; não foi possível enviar payment-confirmed', { user_id: order.user_id, order_id: order.id });
        toast({
          title: "Pagamento confirmado",
          description: "Email do cliente não cadastrado. Atualize o perfil para enviar notificações.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Pagamento confirmado!",
        description: "Cliente foi notificado",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Erro ao confirmar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendHash = async () => {
    const cleanHash = extractHash(transactionHash);
    if (!order || !cleanHash) return;
    
    if (!validateHash(cleanHash)) {
      toast({
        title: "Hash inválida",
        description: "A hash deve ter 64 caracteres hexadecimais (ou 66 com prefixo 0x)",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingHash(true);
    
    try {
      // Atualizar ordem com hash e status para completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          transaction_hash: cleanHash,
          status: 'completed'
        })
        .eq('id', order.id);
      
      if (updateError) throw updateError;

      // Adicionar evento na timeline
      const { error: timelineError } = await supabase
        .from('order_timeline')
        .insert({
          order_id: order.id,
          event_type: 'usdt_sent',
          actor_type: 'admin',
          message: 'USDT enviado para sua carteira',
          metadata: { transaction_hash: cleanHash }
        });

      if (timelineError) throw timelineError;
      
      setOrder({ ...order, transaction_hash: cleanHash, status: 'completed' });
      setTransactionHash("");

      // Buscar email do cliente
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      if (!profileData?.email) {
        console.warn('Perfil sem email; não foi possível enviar usdt-sent', { user_id: order.user_id, order_id: order.id });
        toast({
          title: "⚠️ Hash enviada",
          description: "Email do cliente não cadastrado. Atualize o perfil para enviar notificações.",
          variant: "destructive",
        });
      } else {
        const explorerLink = getExplorerLink(cleanHash, order.network);
        
        console.log('Enviando email usdt-sent para:', profileData.email);
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'usdt-sent',
            to: profileData.email,
            data: {
              nome_cliente: profileData.full_name,
              ordem_id: order.id,
              quantidade_usdt: order.amount,
              carteira_destino: order.wallet_address,
              transaction_hash: cleanHash,
              link_explorer: explorerLink,
              link_ordem: `${window.location.origin}/order/${order.id}`,
              valor_brl: order.total.toFixed(2),
              rede: order.network,
              data_hora: new Date().toLocaleString('pt-BR'),
              link_plataforma: `${window.location.origin}/trading-order`,
              whatsapp: '(11) 9XXXX-XXXX'
            }
          }
        });

        if (emailError) {
          console.error('Erro ao enviar email usdt-sent:', emailError);
          toast({
            title: "⚠️ Hash enviada",
            description: "Hash salva, mas houve erro ao enviar email ao cliente",
            variant: "destructive",
          });
        } else {
          console.log('Email usdt-sent enviado com sucesso:', emailData);
        }
      }
      
      toast({
        title: "Hash enviado!",
        description: "Cliente pode verificar a transação",
      });
    } catch (error) {
      console.error('Error sending hash:', error);
      toast({
        title: "Erro ao enviar hash",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSendingHash(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!order) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', order.id);
      
      if (error) throw error;
      
      setOrder({ ...order, status: 'pending' });
      
      toast({
        title: "Pagamento rejeitado",
        description: "Ordem retornou para status pendente",
      });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Erro ao rejeitar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Aguardando Pagamento", className: "bg-warning text-warning-foreground" },
      paid: { label: "Comprovante Enviado", className: "bg-primary text-primary-foreground" },
      processing: { label: "Aguardando Envio USDT", className: "bg-blue-500 text-white" },
      completed: { label: "Concluído", className: "bg-success text-success-foreground" },
      expired: { label: "Expirado", className: "bg-muted text-muted-foreground" },
    };
    
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

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
            <p className="text-muted-foreground">{error || 'Esta ordem não existe'}</p>
            <Button onClick={() => navigate('/admin/dashboard')}>
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gerenciar Ordem {order.id}</h1>
              <p className="text-xs text-muted-foreground">Painel administrativo</p>
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
              {/* Status */}
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Status da Ordem</p>
                      {getStatusBadge(order.status)}
                    </div>
                    {/* Mostrar botões de confirmar/rejeitar quando há comprovante (mesmo em ordens expiradas) */}
                    {(order.status === 'paid' || 
                      order.status === 'expired' ||
                      (order.receipt_url && order.status === 'pending')) && !order.payment_confirmed_at && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={handleConfirmPayment}
                          disabled={isUpdating}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {order.status === 'expired' ? 'Reabrir e Confirmar' : 'Confirmar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleRejectPayment}
                          disabled={isUpdating}
                          className="w-full sm:w-auto"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Cliente */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-semibold">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documento</p>
                    <p className="font-semibold">
                      {order.profiles?.document_type}: {order.profiles?.document_number || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dados da Ordem */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantidade</p>
                      <p className="font-semibold">{Number(order.amount).toLocaleString()} USDT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rede</p>
                      <p className="font-semibold">{order.network}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Carteira de Destino</p>
                      <p className="font-mono text-xs break-all">{order.wallet_address || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço unitário</p>
                      <p className="font-semibold">R$ {Number(order.locked_price).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-primary text-base">
                        R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Criada em: {new Date(order.created_at).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Comprovante e Hash */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Comprovante de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.receipt_url ? (
                    <>
                      {/* Preview do comprovante */}
                      {receiptError ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 border-2 border-dashed border-destructive rounded-lg bg-destructive/5">
                          <AlertCircle className="h-12 w-12 text-destructive" />
                          <div>
                            <p className="font-medium text-destructive">Erro ao carregar comprovante</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {receiptError}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden bg-muted">
                          {receiptPreview ? (
                            order.receipt_url.toLowerCase().endsWith('.pdf') ? (
                              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                <FileText className="h-16 w-16 text-primary" />
                                <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                                <Button size="sm" onClick={handleDownloadReceipt}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar PDF
                                </Button>
                              </div>
                            ) : (
                              <img 
                                src={receiptPreview} 
                                alt="Comprovante" 
                                className="w-full h-auto"
                              />
                            )
                          ) : (
                            <div className="flex items-center justify-center p-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão de download */}
                      {receiptPreview && !order.receipt_url.toLowerCase().endsWith('.pdf') && (
                        <Button 
                          className="w-full" 
                          onClick={handleDownloadReceipt}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Comprovante
                        </Button>
                      )}

                      {!receiptError && (
                        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">Comprovante recebido</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 border-2 border-dashed rounded-lg">
                      <AlertCircle className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Nenhum comprovante enviado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Aguardando o cliente enviar o comprovante de pagamento
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card para enviar hash da transação - aparece quando há comprovante OU pagamento confirmado OU ordem concluída */}
              {(order.payment_confirmed_at || order.receipt_url || order.status === 'completed') && (
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Hash da Transação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.transaction_hash ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Hash enviado:</p>
                          <p className="text-sm font-mono break-all">{order.transaction_hash}</p>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">Cliente pode verificar a transação</span>
                        </div>
                      </div>
                    ) : !order.payment_confirmed_at ? (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning-foreground">
                          ⚠️ Confirme o pagamento primeiro para liberar o envio da hash
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="hash">Hash da transação USDT</Label>
                          <Input
                            id="hash"
                            placeholder="Cole o hash ou URL do explorer aqui"
                            value={transactionHash}
                            onChange={(e) => handleHashChange(e.target.value)}
                            disabled={isSendingHash}
                            className={hashError ? "border-destructive" : ""}
                          />
                          {hashError ? (
                            <p className="text-xs text-destructive">{hashError}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Cole a hash ou URL completa do explorer - extraímos a hash automaticamente
                            </p>
                          )}
                        </div>
                        
                        {/* Preview do link que será gerado */}
                        {transactionHash && !hashError && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Link que será enviado ao cliente:</p>
                            <a 
                              href={getExplorerLink(transactionHash, order.network)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {getExplorerLink(transactionHash, order.network)}
                            </a>
                          </div>
                        )}
                        
                        <Button
                          className="w-full"
                          onClick={handleSendHash}
                          disabled={!transactionHash.trim() || !!hashError || isSendingHash}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSendingHash ? "Enviando..." : "Enviar Hash e Concluir Ordem"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOrderDetails;
