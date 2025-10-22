import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Coins, Network } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const NewOrder = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("");
  
  const binancePrice = 5.40;
  const otcPrice = 5.449;
  const total = amount ? parseFloat(amount) * otcPrice : 0;

  const networks = [
    { value: "TRC20", label: "TRC20 (Tron)", icon: "🟢" },
    { value: "ERC20", label: "ERC20 (Ethereum)", icon: "🔷" },
    { value: "BEP20", label: "BEP20 (BSC)", icon: "🟡" },
    { value: "POLYGON", label: "Polygon", icon: "🟣" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !network) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) < 100) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para compra é 100 USDT",
        variant: "destructive",
      });
      return;
    }

    // Criar ordem (mock)
    const orderId = `OTC-${Date.now()}`;
    toast({
      title: "Ordem criada com sucesso!",
      description: `Ordem ${orderId} aguardando pagamento`,
    });
    navigate(`/order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Nova Ordem</h1>
                <p className="text-xs text-muted-foreground">Compra de USDT</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Informações da Ordem</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Quantidade de USDT</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ex: 1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="100"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor mínimo: 100 USDT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network">Rede Blockchain</Label>
                  <Select value={network} onValueChange={setNetwork} required>
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

                {amount && network && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Resumo da Ordem
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantidade:</span>
                          <span className="font-medium">{parseFloat(amount).toLocaleString()} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rede:</span>
                          <span className="font-medium">{network}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cotação Binance:</span>
                          <span className="font-medium">R$ {binancePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço OTC (+0,9%):</span>
                          <span className="font-medium text-primary">R$ {otcPrice.toFixed(3)}</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between text-base">
                          <span className="font-semibold">Total a pagar:</span>
                          <span className="font-bold text-primary text-lg">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Confirmar e Abrir Ordem
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewOrder;
