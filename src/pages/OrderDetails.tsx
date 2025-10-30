import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Upload, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [messages, setMessages] = useState([
    { type: "system", content: "Ordem criada - Aguardando pagamento", timestamp: new Date() },
  ]);

  // Dados bancários fixos (não mudam)
  const bankData = {
    bank: "Banco do Brasil",
    agency: "6869-1",
    account: "33826-5",
    cnpj: "45.933.866/0001-93",
    name: "Tokenizacao Management Gestao de negocios e Patrimonio e Inv",
    pix: "45.933.866/0001-93",
  };

  // Buscar ordem do banco de dados
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
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Não foi possível carregar a ordem');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
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
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.locked_at]);

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

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
      setMessages([
        ...messages,
        { 
          type: "client", 
          content: `Comprovante enviado: ${file.name}`, 
          timestamp: new Date() 
        },
      ]);
      toast({
        title: "Comprovante enviado!",
        description: "Aguarde a confirmação do pagamento",
      });
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
                    <Badge className="bg-warning text-warning-foreground">
                      Aguardando Pagamento
                    </Badge>
                    <div className={`flex items-center gap-2 font-mono text-lg font-bold ${
                      isExpired ? "text-danger" : isExpiringSoon ? "text-warning" : "text-foreground"
                    }`}>
                      <Clock className="h-5 w-5" />
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                  
                  {isExpiringSoon && !isExpired && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">Tempo expirando!</p>
                        <p className="text-muted-foreground">Complete o pagamento rapidamente</p>
                      </div>
                    </div>
                  )}

                  {isExpired && (
                    <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-danger">Ordem expirada</p>
                        <p className="text-muted-foreground">Esta ordem foi cancelada automaticamente</p>
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

              {/* Dados Bancários */}
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
            </div>

            {/* Coluna Direita - Chat/Timeline */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Timeline da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${
                        msg.type === "system" ? "items-start" : "items-start"
                      }`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.type === "system" ? "bg-muted" : "bg-primary/10"
                        }`}>
                          {msg.type === "system" ? (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Upload className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {msg.type === "system" ? "Sistema" : "Você"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {msg.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Area */}
                  <div className="border-t pt-4">
                    <Label htmlFor="receipt" className="text-sm font-medium mb-2 block">
                      Enviar Comprovante
                    </Label>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleUploadReceipt}
                      disabled={isExpired}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
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
