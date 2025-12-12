import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, FileText, Send, Mail, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminOrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptPreviews, setReceiptPreviews] = useState<Record<string, string>>({});
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

        // Buscar comprovantes da tabela order_receipts
        const { data: receiptsData } = await supabase
          .from('order_receipts')
          .select('*')
          .eq('order_id', orderId)
          .order('uploaded_at', { ascending: false });

        setReceipts(receiptsData || []);

        // Para cada comprovante, buscar URL assinada
        if (receiptsData && receiptsData.length > 0) {
          const previews: Record<string, string> = {};
          
          for (const receipt of receiptsData) {
            const { data: signedData } = await supabase.storage
              .from('receipts')
              .createSignedUrl(receipt.file_url, 3600);
            
            if (signedData) {
              previews[receipt.id] = signedData.signedUrl;
            }
          }
          
          setReceiptPreviews(previews);
        }

        // Retrocompatibilidade: buscar URL assinada do receipt_url legado se não houver receipts na tabela nova
        if (orderData.receipt_url && (!receiptsData || receiptsData.length === 0)) {
          const { data: signedData } = await supabase.storage
            .from('receipts')
            .createSignedUrl(orderData.receipt_url, 3600);
          
          if (signedData) {
            setReceiptPreviews(prev => ({ ...prev, legacy: signedData.signedUrl }));
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

  const handleDownloadReceipt = async (receipt: { file_url: string; file_name?: string }) => {
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(receipt.file_url);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = receipt.file_name || receipt.file_url.split('/').pop() || 'comprovante';
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

  // Combinar comprovantes: retrocompatibilidade com receipt_url legado
  const allReceipts = [
    ...(order?.receipt_url && receipts.length === 0 ? [{
      id: 'legacy',
      file_name: order.receipt_url.split('/').pop() || 'comprovante',
      file_url: order.receipt_url,
      uploaded_at: order.updated_at
    }] : []),
    ...receipts
  ];

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

      // Buscar email do cliente - primeiro do profile, depois do auth.users via edge function
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      let clientEmail = profileData?.email;
      const clientName = profileData?.full_name || 'Cliente';

      // Se não tem email no profile, buscar do auth.users via edge function
      if (!clientEmail) {
        console.log('Email não encontrado no profile, buscando via edge function...');
        try {
          const { data: authData, error: authError } = await supabase.functions.invoke('get-user-email', {
            body: { user_id: order.user_id }
          });
          
          if (authError) {
            console.error('Erro ao buscar email via edge function:', authError);
          } else if (authData?.email) {
            clientEmail = authData.email;
            console.log('Email recuperado via edge function:', clientEmail);
          }
        } catch (err) {
          console.error('Erro na chamada get-user-email:', err);
        }
      }

      if (!clientEmail) {
        console.warn('Não foi possível encontrar email do cliente', { user_id: order.user_id, order_id: order.id });
        toast({
          title: "⚠️ Hash enviada",
          description: "Email do cliente não encontrado. Verifique o cadastro do usuário.",
          variant: "destructive",
        });
      } else {
        const explorerLink = getExplorerLink(cleanHash, order.network);
        
        // Gerar URL do tracking pixel
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?order_id=${order.id}`;
        
        console.log('Enviando email usdt-sent para:', clientEmail);
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'usdt-sent',
            to: clientEmail,
            data: {
              nome_cliente: clientName,
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
              whatsapp: '(11) 9XXXX-XXXX',
              tracking_pixel_url: trackingPixelUrl
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
          toast({
            title: "✅ Email enviado!",
            description: `Notificação enviada para ${clientEmail}`,
          });
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
        .update({ status: 'rejected' })
        .eq('id', order.id);
      
      if (error) throw error;

      // Registrar rejeição no timeline
      await supabase.from('order_timeline').insert({
        order_id: order.id,
        event_type: 'payment_rejected',
        message: 'Pagamento rejeitado pelo administrador',
        actor_type: 'admin'
      });
      
      setOrder({ ...order, status: 'rejected' });
      
      toast({
        title: "Pagamento rejeitado",
        description: "Ordem marcada como rejeitada",
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
      rejected: { label: "Rejeitado", className: "bg-destructive text-destructive-foreground" },
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
                      allReceipts.length > 0 ||
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
                  <CardTitle className="text-lg">
                    Comprovantes de Pagamento ({allReceipts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allReceipts.length > 0 ? (
                    <div className="space-y-4">
                      {allReceipts.map((receipt, index) => (
                        <div key={receipt.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">
                              #{index + 1} - {receipt.file_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(receipt.uploaded_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          
                          {/* Preview da imagem ou ícone de PDF */}
                          {receiptPreviews[receipt.id] && (
                            receipt.file_url.toLowerCase().endsWith('.pdf') ? (
                              <div className="flex items-center gap-3 p-4 bg-muted rounded">
                                <FileText className="h-8 w-8 text-primary" />
                                <span className="text-sm">Arquivo PDF</span>
                              </div>
                            ) : (
                              <img 
                                src={receiptPreviews[receipt.id]} 
                                alt={`Comprovante ${index + 1}`}
                                className="w-full h-auto rounded border"
                              />
                            )
                          )}
                          
                          {/* Botão de download */}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleDownloadReceipt(receipt)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">
                          {allReceipts.length} comprovante{allReceipts.length > 1 ? 's' : ''} recebido{allReceipts.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
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

              {/* Card de Rastreamento de Visualização */}
              {order.status === 'completed' && order.transaction_hash && (
                <Card className="shadow-lg border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Rastreamento de Visualização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Email aberto */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${
                      order.hash_email_opened_at 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-muted border border-border'
                    }`}>
                      <Mail className={`h-5 w-5 ${order.hash_email_opened_at ? 'text-success' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email Aberto</p>
                        {order.hash_email_opened_at ? (
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.hash_email_opened_at).toLocaleString('pt-BR')}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Ainda não abriu o email</p>
                        )}
                      </div>
                      {order.hash_email_opened_at && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>

                    {/* Visualização na plataforma */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${
                      order.hash_viewed_at 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-muted border border-border'
                    }`}>
                      <Eye className={`h-5 w-5 ${order.hash_viewed_at ? 'text-success' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Visualizado na Plataforma</p>
                        {order.hash_viewed_at ? (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Primeira visualização: {new Date(order.hash_viewed_at).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-blue-500 font-medium">
                              Total de visualizações: {order.hash_viewed_count || 1}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">Ainda não acessou a página</p>
                        )}
                      </div>
                      {order.hash_viewed_at && (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      )}
                    </div>

                    {/* Status geral */}
                    {!order.hash_email_opened_at && !order.hash_viewed_at && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          ⚠️ Cliente ainda não visualizou a transação. Considere entrar em contato.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Card para enviar hash da transação - aparece quando há comprovante OU pagamento confirmado OU ordem concluída */}
              {(order.payment_confirmed_at || allReceipts.length > 0 || order.status === 'completed') && (
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
