import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Download, CheckCircle2, AlertCircle,
  FileText, Send, Mail, Eye, ExternalLink,
  History, Shield, Zap, Loader2, ArrowUpRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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

  const extractHash = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('tronscan.org')) {
      const match = trimmed.match(/transaction\/([a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    if (trimmed.includes('etherscan.io')) {
      const match = trimmed.match(/tx\/(0x[a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    if (trimmed.includes('bscscan.com')) {
      const match = trimmed.match(/tx\/(0x[a-fA-F0-9]{64})/);
      return match ? match[1] : trimmed;
    }
    return trimmed;
  };

  const validateHash = (hash: string): boolean => {
    if (/^[a-fA-F0-9]{64}$/.test(hash)) return true;
    if (/^0x[a-fA-F0-9]{64}$/.test(hash)) return true;
    return false;
  };

  const getExplorerLink = (hash: string, network: string): string => {
    const links: Record<string, string> = {
      'TRC20': `https://tronscan.org/#/transaction/${hash}`,
      'ERC20': `https://etherscan.io/tx/${hash}`,
      'BEP20': `https://bscscan.com/tx/${hash}`
    };
    return links[network] || '#';
  };

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
        const { data: receiptsData } = await supabase
          .from('order_receipts')
          .select('*')
          .eq('order_id', orderId)
          .order('uploaded_at', { ascending: false });
        setReceipts(receiptsData || []);
        if (receiptsData && receiptsData.length > 0) {
          const previews: Record<string, string> = {};
          for (const receipt of receiptsData) {
            const { data: signedData } = await supabase.storage
              .from('receipts')
              .createSignedUrl(receipt.file_url, 3600);
            if (signedData) previews[receipt.id] = signedData.signedUrl;
          }
          setReceiptPreviews(previews);
        }
        if (orderData.receipt_url && (!receiptsData || receiptsData.length === 0)) {
          const { data: signedData } = await supabase.storage
            .from('receipts')
            .createSignedUrl(orderData.receipt_url, 3600);
          if (signedData) setReceiptPreviews(prev => ({ ...prev, legacy: signedData.signedUrl }));
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
      toast({ title: "Download iniciado", description: "Comprovante baixado com sucesso" });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({ title: "Erro ao baixar", description: "Tente novamente", variant: "destructive" });
    }
  };

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
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'processing', payment_confirmed_at: new Date().toISOString() })
        .eq('id', order.id);
      if (updateError) throw updateError;
      await supabase.from('order_timeline').insert({
        order_id: order.id,
        event_type: 'payment_confirmed',
        actor_type: 'admin',
        message: 'OTC confirmou recebimento do PIX'
      });
      setOrder({ ...order, status: 'processing', payment_confirmed_at: new Date().toISOString() });
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', order.user_id).single();
      if (profileData?.email) {
        await supabase.functions.invoke('send-email', {
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
      }
      toast({ title: "Pagamento confirmado!", description: "Cliente foi notificado" });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({ title: "Erro ao confirmar", description: "Tente novamente", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendHash = async () => {
    const cleanHash = extractHash(transactionHash);
    if (!order || !cleanHash) return;
    if (!validateHash(cleanHash)) {
      toast({ title: "Hash inválida", description: "A hash deve ter 64 caracteres hexadecimais (ou 66 com prefixo 0x)", variant: "destructive" });
      return;
    }
    setIsSendingHash(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ transaction_hash: cleanHash, status: 'completed' })
        .eq('id', order.id);
      if (updateError) throw updateError;
      await supabase.from('order_timeline').insert({
        order_id: order.id,
        event_type: 'usdt_sent',
        actor_type: 'admin',
        message: 'USDT enviado para sua carteira',
        metadata: { transaction_hash: cleanHash }
      });
      setOrder({ ...order, transaction_hash: cleanHash, status: 'completed' });
      setTransactionHash("");
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', order.user_id).single();
      let clientEmail = profileData?.email;
      if (!clientEmail) {
        const { data: authData } = await supabase.functions.invoke('get-user-email', { body: { user_id: order.user_id } });
        if (authData?.email) clientEmail = authData.email;
      }
      if (clientEmail) {
        const explorerLink = getExplorerLink(cleanHash, order.network);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?order_id=${order.id}`;
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'usdt-sent',
            to: clientEmail,
            data: {
              nome_cliente: profileData?.full_name || 'Cliente',
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
              tracking_pixel_url: trackingPixelUrl
            }
          }
        });
      }
      toast({ title: "Hash enviado!", description: "Cliente pode verificar a transação" });
    } catch (error) {
      console.error('Error sending hash:', error);
      toast({ title: "Erro ao enviar hash", description: "Tente novamente", variant: "destructive" });
    } finally {
      setIsSendingHash(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ status: 'rejected' }).eq('id', order.id);
      if (error) throw error;
      await supabase.from('order_timeline').insert({
        order_id: order.id,
        event_type: 'payment_rejected',
        message: 'Pagamento rejeitado pelo administrador',
        actor_type: 'admin'
      });
      setOrder({ ...order, status: 'rejected' });
      toast({ title: "Pagamento rejeitado", description: "Ordem marcada como rejeitada" });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({ title: "Erro ao rejeitar", description: "Tente novamente", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Aguardando Pagamento", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      paid: { label: "Comprovante Enviado", className: "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20" },
      processing: { label: "Aguardando Envio USDT", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      completed: { label: "Concluído", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      expired: { label: "Expirado", className: "bg-white/10 text-white/40 border-white/5" },
      rejected: { label: "Rejeitado", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#00D4FF] mx-auto" />
          <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">Acessando Protocolo de Ordem...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <Card className="max-w-md bg-white/[0.02] border-white/5 backdrop-blur-xl">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">ID de Ordem Inválido</h2>
            <p className="text-white/40 text-sm">{error || 'Registro não encontrado no ledger.'}</p>
            <Button onClick={() => navigate('/admin/dashboard')} className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80">
              Voltar ao Terminal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-black text-white">
        <AppSidebar forceAdmin={true} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hover:bg-white/10 text-white/40"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                    Ordem <span className="text-[#00D4FF]">#{order.id.slice(0, 8)}</span>
                  </h1>
                  <p className="text-white/40 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">Management Interface · Secure Protocol</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-8 px-4 border-white/10 text-white/40 font-mono tracking-widest">
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </Badge>
              </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Protocolo Status */}
                <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <CardHeader className="border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono uppercase tracking-widest text-white/40">Estado do Ativo</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Volume OTC</p>
                          <p className="text-3xl font-bold tracking-tighter">{Number(order.amount).toLocaleString()} <span className="text-white/20 text-sm">USDT</span></p>
                        </div>
                        <div className="h-10 w-px bg-white/5" />
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Liquidação</p>
                          <p className="text-2xl font-bold text-emerald-500 tracking-tighter">R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {((order.status === 'paid' || order.status === 'expired' || allReceipts.length > 0) && !order.payment_confirmed_at) && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-bold"
                            onClick={handleConfirmPayment}
                            disabled={isUpdating}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Liberar USDT
                          </Button>
                          <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                            onClick={handleRejectPayment}
                            disabled={isUpdating}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Dados de Destino */}
                <Card className="bg-white/[0.02] border-white/5">
                  <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-sm uppercase tracking-widest text-white/40 font-mono">Endereço de Custódia</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-sm break-all text-center group cursor-pointer hover:border-[#00D4FF]/40 transition-all">
                      <p className="text-[#00D4FF] mb-2 text-[10px] uppercase font-bold tracking-widest opacity-40 group-hover:opacity-100">{order.network} DESTINATION</p>
                      <span className="text-lg">{order.wallet_address || 'NOT_DEFINED'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Comprovantes */}
                <Card className="bg-white/[0.02] border-white/5">
                  <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-sm uppercase tracking-widest text-white/40 font-mono">Evidências de Liquidação ({allReceipts.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {allReceipts.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {allReceipts.map((receipt, index) => (
                          <div key={receipt.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 group hover:border-[#00D4FF]/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">PIX_REC #{index + 1}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadReceipt(receipt)}
                                className="h-8 w-8 hover:bg-white/10"
                              >
                                <Download className="h-4 w-4 text-[#00D4FF]" />
                              </Button>
                            </div>
                            {receiptPreviews[receipt.id] && (
                              <div className="aspect-video relative rounded-lg overflow-hidden border border-white/5 bg-black">
                                {receipt.file_url.toLowerCase().endsWith('.pdf') ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-40">
                                    <FileText className="h-10 w-10" />
                                    <span className="text-[10px] font-mono">PORTABLE_DOCUMENT</span>
                                  </div>
                                ) : (
                                  <img src={receiptPreviews[receipt.id]} alt="PIX" className="w-full h-full object-contain" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-10" />
                        <p className="text-white/20 font-medium tracking-tight">Aguardando aporte financeiro do cliente.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar da Ordem */}
              <div className="space-y-8">
                {/* Cliente Card */}
                <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg leading-tight">{order.profiles?.full_name || 'N/A'}</h4>
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{order.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/20 uppercase font-mono">Documento</span>
                        <span className="text-white font-mono">{order.profiles?.document_type}: {order.profiles?.document_number}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/20 uppercase font-mono">Quota</span>
                        <span className="text-white font-mono">R$ {Number(order.locked_price).toFixed(3)} / USDT</span>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      onClick={() => navigate(`/admin/users/${order.user_id}`)}
                      className="w-full text-[10px] uppercase font-bold tracking-widest text-[#00D4FF] hover:text-[#00D4FF]/80 mt-4 h-auto p-0"
                    >
                      Ver Perfil Completo <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Envio de Hash */}
                <Card className="bg-white/[0.02] border-white/5 border-l-4 border-l-[#00D4FF]">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest font-mono">Transação Blockchain</CardTitle>
                    <CardDescription className="text-white/20 text-[10px]">Informe a hash após o envio do USDT.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-mono text-white/40">TX_ID / HASH</Label>
                      <Input
                        placeholder="Insira a hash da transação..."
                        value={transactionHash}
                        onChange={(e) => handleHashChange(e.target.value)}
                        className="bg-white/[0.03] border-white/10 focus:border-[#00D4FF] font-mono text-xs"
                      />
                      {hashError && <p className="text-[10px] text-red-500 font-mono italic">{hashError}</p>}
                    </div>

                    {order.transaction_hash && (
                      <a
                        href={getExplorerLink(order.transaction_hash, order.network)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 bg-[#00D4FF]/10 rounded-lg group transition-colors hover:bg-[#00D4FF]/20"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <ExternalLink className="h-4 w-4 text-[#00D4FF]" />
                          <span className="text-[10px] font-mono text-[#00D4FF] truncate">{order.transaction_hash}</span>
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-[#00D4FF] shrink-0" />
                      </a>
                    )}

                    <Button
                      className="w-full bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 font-bold uppercase tracking-widest text-[11px]"
                      onClick={handleSendHash}
                      disabled={isSendingHash || !transactionHash || !!hashError}
                    >
                      {isSendingHash ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Confirmar Envio USDT
                    </Button>
                  </CardContent>
                </Card>

                {/* Timeline Simplificada */}
                <Card className="bg-white/[0.02] border-white/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm uppercase tracking-widest font-mono">Log de Eventos</CardTitle>
                      <History className="h-4 w-4 text-white/10" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative pl-6 border-l border-white/5 space-y-6">
                      {order.payment_confirmed_at && (
                        <div className="relative">
                          <div className="absolute -left-[27px] top-0 h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <p className="text-[10px] font-mono uppercase tracking-tighter text-emerald-500">Pagamento Confirmado</p>
                          <p className="text-[9px] text-white/20 mt-0.5">{new Date(order.payment_confirmed_at).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {order.transaction_hash && (
                        <div className="relative">
                          <div className="absolute -left-[27px] top-0 h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          <p className="text-[10px] font-mono uppercase tracking-tighter text-blue-500">USDT Enviado</p>
                          <p className="text-[9px] text-white/20 mt-0.5">{order.status === 'completed' ? 'Finalizado' : 'Processando'}</p>
                        </div>
                      )}
                      <div className="relative">
                        <div className="absolute -left-[27px] top-0 h-4 w-4 rounded-full bg-white/20" />
                        <p className="text-[10px] font-mono uppercase tracking-tighter text-white/20">Protocolo Iniciado</p>
                        <p className="text-[9px] text-white/20 mt-0.5">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminOrderDetails;
