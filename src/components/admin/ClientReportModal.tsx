import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw, Wallet, TrendingUp, Hash } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

interface ClientWallet {
  id?: string;
  wallet_address: string;
  network: string;
  label: string;
}

interface RecurringClient {
  id: string;
  name: string;
  notes: string | null;
  wallets: ClientWallet[];
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  currency: string;
  network: string;
  status: string;
  timestamp: string;
  txId?: string;
  toAddress: string;
  alias: string | null;
}

interface ClientReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: RecurringClient | null;
  withdrawals: Withdrawal[];
  onRefresh: () => void;
  loading: boolean;
}

// Generate period options (last 12 months + custom periods)
const generatePeriodOptions = () => {
  const options = [];
  const now = new Date();
  
  // Monthly options for last 12 months
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    const value = format(date, "yyyy-MM");
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    options.push({ 
      value, 
      label: label.charAt(0).toUpperCase() + label.slice(1),
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  }
  
  return options;
};

export const ClientReportModal = ({
  open,
  onOpenChange,
  client,
  withdrawals,
  onRefresh,
  loading,
}: ClientReportModalProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), "yyyy-MM"));
  const periodOptions = useMemo(() => generatePeriodOptions(), []);

  // Get all wallet addresses for this client (lowercase for comparison)
  const clientWalletAddresses = useMemo(() => {
    if (!client?.wallets) return new Set<string>();
    return new Set(client.wallets.map((w) => w.wallet_address.toLowerCase()));
  }, [client]);

  // Filter withdrawals by client's wallets and selected period
  const filteredWithdrawals = useMemo(() => {
    if (!client || clientWalletAddresses.size === 0) return [];
    
    const period = periodOptions.find((p) => p.value === selectedPeriod);
    if (!period) return [];

    return withdrawals.filter((w) => {
      // Check if withdrawal is to one of client's wallets
      const matchesWallet = w.toAddress && clientWalletAddresses.has(w.toAddress.toLowerCase());
      if (!matchesWallet) return false;

      // Check if withdrawal is within selected period
      try {
        const withdrawalDate = parseISO(w.timestamp);
        return isWithinInterval(withdrawalDate, { start: period.start, end: period.end });
      } catch {
        return false;
      }
    });
  }, [withdrawals, clientWalletAddresses, selectedPeriod, periodOptions]);

  // Calculate totals per wallet
  const walletTotals = useMemo(() => {
    const totals = new Map<string, { amount: number; count: number; network: string; label: string }>();
    
    client?.wallets.forEach((w) => {
      totals.set(w.wallet_address.toLowerCase(), {
        amount: 0,
        count: 0,
        network: w.network,
        label: w.label || "",
      });
    });

    filteredWithdrawals.forEach((w) => {
      const key = w.toAddress.toLowerCase();
      const current = totals.get(key);
      if (current) {
        totals.set(key, {
          ...current,
          amount: current.amount + (w.amount || 0),
          count: current.count + 1,
        });
      }
    });

    return Array.from(totals.entries()).map(([address, data]) => ({
      address,
      ...data,
    }));
  }, [filteredWithdrawals, client]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalAmount = filteredWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalFees = filteredWithdrawals.reduce((sum, w) => sum + (w.fee || 0), 0);
    const operationsCount = filteredWithdrawals.length;
    return { totalAmount, totalFees, operationsCount };
  }, [filteredWithdrawals]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!client) return;

    const period = periodOptions.find((p) => p.value === selectedPeriod);
    const periodLabel = period?.label || selectedPeriod;

    // Prepare data for Excel
    const data = filteredWithdrawals.map((w) => ({
      "Data/Hora": format(new Date(w.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      "Carteira": w.toAddress,
      "Rede": w.network,
      "Valor (USDT)": w.amount,
      "Taxa (USDT)": w.fee,
      "Status": w.status === "2" ? "Concluído" : w.status,
      "Hash": w.txId || "-",
    }));

    // Add summary row
    data.push({
      "Data/Hora": "",
      "Carteira": "",
      "Rede": "",
      "Valor (USDT)": summary.totalAmount,
      "Taxa (USDT)": summary.totalFees,
      "Status": `TOTAL: ${summary.operationsCount} operações`,
      "Hash": "",
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");

    // Add header with client info
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`Relatório de Saques - ${client.name}`],
        [`Período: ${periodLabel}`],
        [`Total: ${summary.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} USDT`],
        [],
      ],
      { origin: "A1" }
    );

    // Download
    const fileName = `relatorio_${client.name.replace(/\s+/g, "_")}_${selectedPeriod}.xlsx`;
    XLSX.writeFile(wb, fileName);

    // Toast would be nice here but we'll keep it simple
  };

  const formatCurrency = (value: number, currency: string = "USDT") => {
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const formatWalletAddress = (address: string) => {
    if (address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Relatório: {client.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selector and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportExcel}
              disabled={filteredWithdrawals.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                RESUMO DO PERÍODO
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Enviado</p>
                    <p className="text-lg font-bold">{formatCurrency(summary.totalAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">💸</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxas</p>
                    <p className="text-lg font-bold">{formatCurrency(summary.totalFees)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Operações</p>
                    <p className="text-lg font-bold">{summary.operationsCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallets Summary */}
          {walletTotals.some((w) => w.count > 0) && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Carteiras Vinculadas
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {walletTotals.map((wallet) => (
                  <div
                    key={wallet.address}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-mono text-xs truncate" title={wallet.address}>
                          {formatWalletAddress(wallet.address)}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {wallet.network}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-medium text-sm">{formatCurrency(wallet.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.count} {wallet.count === 1 ? "op" : "ops"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Transações
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Carregando...</p>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>Nenhuma transação encontrada neste período</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Carteira</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Rede</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-sm">
                          {format(new Date(w.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatWalletAddress(w.toAddress)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(w.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(w.fee)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{w.network}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              w.status === "2"
                                ? "bg-success text-success-foreground"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {w.status === "2" ? "Concluído" : w.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
