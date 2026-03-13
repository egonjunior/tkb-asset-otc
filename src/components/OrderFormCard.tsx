import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lock,
  Clock,
  AlertCircle,
  ArrowDownUp,
  Network,
  CheckCircle2,
  Coins,
  Wallet,
  Users,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { validateWalletAddress, type NetworkType } from "@/lib/walletValidation";

interface OrderFormCardProps {
  tkbPrice: number | null;
  binancePrice: number | null;
  isLoading: boolean;
  onSubmit: (data: { amount: string; network: string; lockedPrice: number; total: number; lockedAt: string; walletAddress: string; quoteClientId?: string }) => void;
  isSubmitting?: boolean;
  quoteClients?: any[];
}

const LOCK_DURATION = 300; // 5 minutes in seconds

const OrderFormCard = ({
  tkbPrice,
  binancePrice,
  isLoading,
  onSubmit,
  isSubmitting = false,
  quoteClients = []
}: OrderFormCardProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [brlAmount, setBrlAmount] = useState("");
  const [brlAmountFormatted, setBrlAmountFormatted] = useState(""); // Valor visual formatado
  const [network, setNetwork] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(LOCK_DURATION);
  const [isEditingUSDT, setIsEditingUSDT] = useState(true);

  // Função para formatar valor no padrão brasileiro
  const formatBRL = (value: string): string => {
    // Remove tudo exceto dígitos
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) return '';

    // Converte para número e divide por 100 (para ter 2 decimais)
    const number = parseFloat(numericValue) / 100;

    // Formata no padrão brasileiro
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para extrair valor numérico
  const unformatBRL = (value: string): number => {
    // Remove pontos (separadores de milhares) e troca vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const networks = [
    { value: "TRC20", label: "TRC20 (Tron)", icon: "🟢" },
    { value: "ERC20", label: "ERC20 (Ethereum)", icon: "🔷" },
    { value: "BEP20", label: "BEP20 (BSC)", icon: "🟡" },
    { value: "POLYGON", label: "Polygon", icon: "🟣" },
  ];

  // Countdown timer
  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setLockedPrice(null);
          return LOCK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked]);

  const handleUSDTChange = (value: string) => {
    setUsdtAmount(value);
    setIsEditingUSDT(true);

    if (value && tkbPrice) {
      const brl = parseFloat(value) * tkbPrice;
      setBrlAmount(brl.toFixed(2));

      // Formatar visualmente
      const formatted = brl.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setBrlAmountFormatted(formatted);
    } else {
      setBrlAmount("");
      setBrlAmountFormatted("");
    }

    // Reset lock if amount changes
    if (isLocked) {
      setIsLocked(false);
      setLockedPrice(null);
      setTimeRemaining(LOCK_DURATION);
    }
  };

  const handleBRLChange = (value: string) => {
    // Atualiza valor formatado visualmente
    const formatted = formatBRL(value);
    setBrlAmountFormatted(formatted);

    // Extrai valor numérico puro
    const numericValue = unformatBRL(formatted);
    setBrlAmount(numericValue.toString());

    setIsEditingUSDT(false);

    // Calcula USDT baseado no valor numérico
    if (numericValue > 0 && tkbPrice) {
      const usdt = numericValue / tkbPrice;
      setUsdtAmount(usdt.toFixed(2));
    } else {
      setUsdtAmount("");
    }

    // Reset lock if amount changes
    if (isLocked) {
      setIsLocked(false);
      setLockedPrice(null);
      setTimeRemaining(LOCK_DURATION);
    }
  };

  const handleWalletAddressChange = (value: string) => {
    setWalletAddress(value);

    // Clear error when user starts typing
    if (walletError) {
      setWalletError(null);
    }

    // Validate on change if network is selected and value is not empty
    if (network && value.trim()) {
      const validation = validateWalletAddress(value, network as NetworkType);
      if (!validation.isValid) {
        setWalletError(validation.error || null);
      }
    }
  };

  const handleLockPrice = () => {
    if (tkbPrice && parseFloat(usdtAmount) >= 100) {
      setIsLocked(true);
      setLockedPrice(tkbPrice);
      setTimeRemaining(LOCK_DURATION);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Se não tiver preço travado, tenta usar o preço atual do TKB
    const finalPrice = lockedPrice || tkbPrice;

    if (!finalPrice || !usdtAmount || !network || !walletAddress) {
      if (!finalPrice) {
        toast({
          title: "Aguardando cotação",
          description: "Aguarde um instante até que a cotação seja carregada.",
          variant: "destructive",
        });
      }
      return;
    }

    // Final validation before submit
    const validation = validateWalletAddress(walletAddress, network as NetworkType);
    if (!validation.isValid) {
      setWalletError(validation.error || "Endereço inválido");
      return;
    }

    const total = parseFloat(usdtAmount) * finalPrice;

    onSubmit({
      amount: usdtAmount,
      network,
      lockedPrice: finalPrice,
      total,
      lockedAt: new Date().toISOString(),
      walletAddress: walletAddress.trim(),
      quoteClientId: selectedClientId !== "none" ? selectedClientId : undefined
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isWalletValid = walletAddress.trim().length > 0 && !walletError && network;
  const isFormValid = usdtAmount && parseFloat(usdtAmount) >= 100 && network && isWalletValid;
  const canLock = isFormValid && !isLocked && tkbPrice;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Nova Ordem de Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* Selecionar Cliente (Para Parceiros) */}
          {quoteClients && quoteClients.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="client" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Vincular a um Cliente (Opcional)
              </Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente (ou deixe em branco)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente (Ordem própria)</SelectItem>
                  {quoteClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantidade USDT */}
          <div className="space-y-2">
            <Label htmlFor="usdt">Quantidade de USDT</Label>
            <div className="relative">
              <Input
                id="usdt"
                type="number"
                placeholder="Ex: 10000"
                value={usdtAmount}
                onChange={(e) => handleUSDTChange(e.target.value)}
                min="100"
                step="0.01"
                className={isEditingUSDT ? "border-primary" : ""}
                disabled={isLoading}
              />
              {usdtAmount && parseFloat(usdtAmount) >= 100 && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Ícone de conversão */}
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-2">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Valor em Reais */}
          <div className="space-y-2">
            <Label htmlFor="brl">Valor em Reais (BRL)</Label>
            <div className="relative">
              <Input
                id="brl"
                type="text"
                placeholder="Ex: 53.973,00"
                value={brlAmountFormatted}
                onChange={(e) => handleBRLChange(e.target.value)}
                className={!isEditingUSDT ? "border-primary" : ""}
                disabled={isLoading}
              />
              {brlAmount && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {usdtAmount && parseFloat(usdtAmount) < 100 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Valor mínimo: 100 USDT {tkbPrice && `(≈ R$ ${(100 * tkbPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
              </p>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Rede Blockchain */}
          <div className="space-y-2">
            <Label htmlFor="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Rede Blockchain
            </Label>
            <Select value={network} onValueChange={setNetwork}>
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

          {/* Endereço da Wallet */}
          {network && (
            <>
              <div className="h-px bg-border" />

              <div className="space-y-2">
                <Label htmlFor="wallet" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Endereço da Carteira ({network})
                </Label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder={`Digite seu endereço ${network}`}
                  value={walletAddress}
                  onChange={(e) => handleWalletAddressChange(e.target.value)}
                  className={`font-mono text-sm ${walletError ? 'border-destructive' : ''}`}
                />
                {walletError ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {walletError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Confira com atenção. USDT será enviado para este endereço.
                  </p>
                )}
                {walletAddress.trim() && !walletError && network && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Endereço válido para {network}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="h-px bg-border" />

          {/* Cotação e Trava de Preço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Cotação e Trava de Preço</h3>
            </div>

            <Card className="w-full bg-black/40 backdrop-blur-xl border-white/[0.05] shadow-2xl overflow-hidden group">
              <CardHeader className="pb-6 border-b border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-[12px] font-brand tracking-[0.3em] text-white uppercase italic">Nova Operação USDT</CardTitle>
                    <CardDescription className="text-[8px] text-[#00D4FF]/60 font-mono tracking-[0.2em] uppercase">Liquidez Spot OTC</CardDescription>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                    <span className="text-[9px] font-bold text-[#00D4FF] uppercase tracking-wider">Market Order</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lado Esquerdo: Input */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">Volume da Ordem</Label>
                      <div className="relative group/input">
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="h-14 bg-white/[0.02] border-white/[0.05] text-xl font-medium text-white pl-4 pr-16 focus:ring-1 focus:ring-[#00D4FF]/30 transition-all"
                          value={usdtAmount}
                          onChange={(e) => handleUSDTChange(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-white/20">USDT</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">Rede de Transferência</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['TRC20', 'ERC20'].map((r) => (
                          <button
                            key={r}
                            onClick={() => setNetwork(r)}
                            className={`h-11 rounded-xl border text-[11px] font-bold tracking-widest transition-all ${network === r
                              ? 'bg-[#00D4FF] border-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                              : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'
                              }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Cotação */}
                  <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.03] space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <TrendingUp className="w-12 h-12 text-[#00D4FF]" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-white/20 font-mono">Cotação Travada (5m)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-brand tracking-tighter text-white">R$ {tkbPrice ? tkbPrice.toFixed(3) : "0.000"}</span>
                        {timeRemaining > 0 && <span className="text-[10px] text-[#00D4FF] font-mono">{formatTime(timeRemaining)}</span>}
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/[0.03]">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/30">Subtotal</span>
                        <span className="text-white/60 font-mono">R$ {(parseFloat(usdtAmount || '0') * (tkbPrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/30">Taxa de Execução</span>
                        <span className="text-emerald-500 font-mono">Zerada (OTC)</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-white/[0.05]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00D4FF]">Total a Pagar</span>
                        <span className="text-lg font-bold text-white font-mono">R$ {(parseFloat(usdtAmount || '0') * (tkbPrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-14 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold text-xs uppercase tracking-[0.3em] shadow-xl group/btn"
                  disabled={isSubmitting || !usdtAmount || parseFloat(usdtAmount) <= 0 || !network || !walletAddress || walletError !== null}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? "Processando Ordem..." : "Abrir Ordem de Compra"}
                  <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resumo da Ordem - só aparece quando travado */}
          {isLocked && lockedPrice && usdtAmount && network && (
            <>
              <div className="h-px bg-border" />

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Resumo da Ordem
                </h3>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantidade:</span>
                        <span className="font-medium">{parseFloat(usdtAmount).toLocaleString('pt-BR')} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rede:</span>
                        <span className="font-medium">{network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço Travado:</span>
                        <span className="font-medium text-primary">R$ {lockedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total a pagar:</span>
                        <span className="font-bold text-primary text-lg">
                          R$ {(parseFloat(usdtAmount) * lockedPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Expira em: {formatTime(timeRemaining)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
              onClick={() => {
                setIsLocked(false);
                setLockedPrice(null);
              }}
            >
              Resetar Operação
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-14 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#06080E] rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,212,255,0.2)] disabled:opacity-20 transition-apple"
              disabled={!isLocked || !lockedPrice || isSubmitting}
            >
              {isSubmitting ? "Autenticando..." : "✅ Confirmar e Executar Ordem"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderFormCard;
