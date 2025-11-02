import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wallet
} from "lucide-react";
import { validateWalletAddress, type NetworkType } from "@/lib/walletValidation";

interface OrderFormCardProps {
  tkbPrice: number | null;
  binancePrice: number | null;
  isLoading: boolean;
  onSubmit: (data: { amount: string; network: string; lockedPrice: number; total: number; lockedAt: string; walletAddress: string }) => void;
  isSubmitting?: boolean;
}

const LOCK_DURATION = 300; // 5 minutes in seconds

const OrderFormCard = ({ 
  tkbPrice, 
  binancePrice, 
  isLoading,
  onSubmit,
  isSubmitting = false 
}: OrderFormCardProps) => {
  const [usdtAmount, setUsdtAmount] = useState("");
  const [brlAmount, setBrlAmount] = useState("");
  const [network, setNetwork] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(LOCK_DURATION);
  const [isEditingUSDT, setIsEditingUSDT] = useState(true);

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
    } else {
      setBrlAmount("");
    }

    // Reset lock if amount changes
    if (isLocked) {
      setIsLocked(false);
      setLockedPrice(null);
      setTimeRemaining(LOCK_DURATION);
    }
  };

  const handleBRLChange = (value: string) => {
    setBrlAmount(value);
    setIsEditingUSDT(false);
    
    if (value && tkbPrice) {
      const usdt = parseFloat(value) / tkbPrice;
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
    
    if (!lockedPrice || !usdtAmount || !network || !walletAddress) return;

    // Final validation before submit
    const validation = validateWalletAddress(walletAddress, network as NetworkType);
    if (!validation.isValid) {
      setWalletError(validation.error || "Endereço inválido");
      return;
    }

    const total = parseFloat(usdtAmount) * lockedPrice;
    
    onSubmit({
      amount: usdtAmount,
      network,
      lockedPrice,
      total,
      lockedAt: new Date().toISOString(),
      walletAddress: walletAddress.trim()
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
                type="number"
                placeholder="Ex: 53973.00"
                value={brlAmount}
                onChange={(e) => handleBRLChange(e.target.value)}
                step="0.01"
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

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cotação Base:</span>
                <span className="font-medium">
                  {binancePrice ? `R$ ${binancePrice.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : "Carregando..."}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cotação TKB:</span>
                <span className="font-semibold text-primary">
                  {tkbPrice ? `R$ ${tkbPrice.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : "Carregando..."}
                </span>
              </div>

              {/* Lock Button */}
              {!isLocked ? (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={handleLockPrice}
                  disabled={!canLock || isLoading}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Travar Preço por 5min
                </Button>
              ) : (
                <div className="bg-primary/10 border-2 border-primary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Preço Travado</span>
                    </div>
                    <Badge variant="default" className="text-base">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeRemaining)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Preço garantido até expirar ou confirmar
                  </p>
                </div>
              )}
            </div>
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
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!isLocked || !lockedPrice || isSubmitting}
            >
              {isSubmitting ? "Criando..." : "✅ Confirmar Ordem"}
            </Button>
          </div>

          {/* Helper text */}
          {!isLocked && isFormValid && (
            <p className="text-xs text-center text-muted-foreground">
              ℹ️ Preencha os campos e trave o preço por 5 minutos
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderFormCard;
