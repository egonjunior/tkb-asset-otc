import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Wallet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  txId?: string;
  from?: string;
}

interface Purchase {
  id: string;
  side: string;
  amount: number;
  price: number;
  total: number;
  currency: string;
  status: string;
  timestamp: string;
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

interface WalletAlias {
  id: string;
  wallet_address: string;
  alias: string;
  notes: string | null;
}

const AdminOkxOperations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Aliases management
  const [aliases, setAliases] = useState<WalletAlias[]>([]);
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<WalletAlias | null>(null);
  
  // Wallet filter for withdrawals
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [newAlias, setNewAlias] = useState({ wallet_address: '', alias: '', notes: '' });

  useEffect(() => {
    const init = async () => {
      await checkAdminAccess();
      await fetchAliases();
      // Auto-load first tab data
      fetchOperations('deposits');
      setInitialLoadDone(true);
    };
    init();
  }, []);

  const checkAdminAccess = async () => {
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
      navigate('/dashboard');
    }
  };

  const fetchAliases = async () => {
    const { data, error } = await supabase
      .from('okx_wallet_aliases')
      .select('*')
      .order('alias');
    
    if (error) {
      console.error('Error fetching aliases:', error);
    } else {
      setAliases(data || []);
    }
  };

  const fetchOperations = async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await supabase.functions.invoke('okx-operations', {
        body: {
          type,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
      });

      clearTimeout(timeoutId);

      if (response.error) {
        const errorMsg = response.error.message || 'Erro ao conectar com OKX';
        throw new Error(errorMsg);
      }

      const result = response.data?.data || [];

      if (type === 'deposits') {
        setDeposits(result);
      } else if (type === 'purchases') {
        setPurchases(result);
      } else if (type === 'withdrawals') {
        setWithdrawals(result);
      }

      if (initialLoadDone) {
        toast({
          title: "Dados atualizados",
          description: `${result.length} registros carregados`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching OKX operations:', error);
      const errorMessage = error.name === 'AbortError' 
        ? 'Tempo limite excedido. Tente novamente.'
        : error.message || 'Erro ao carregar dados. Verifique as credenciais OKX.';
      
      setError(errorMessage);
      
      if (initialLoadDone) {
        toast({
          title: "Erro ao carregar dados",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const typeMap: Record<string, string> = {
      deposits: 'deposits',
      purchases: 'purchases',
      withdrawals: 'withdrawals',
    };
    fetchOperations(typeMap[value]);
  };

  const handleSaveAlias = async () => {
    try {
      if (editingAlias) {
        const { error } = await supabase
          .from('okx_wallet_aliases')
          .update({
            wallet_address: newAlias.wallet_address,
            alias: newAlias.alias,
            notes: newAlias.notes || null,
          })
          .eq('id', editingAlias.id);

        if (error) throw error;
        toast({ title: "Alias atualizado" });
      } else {
        const { error } = await supabase
          .from('okx_wallet_aliases')
          .insert({
            wallet_address: newAlias.wallet_address,
            alias: newAlias.alias,
            notes: newAlias.notes || null,
          });

        if (error) throw error;
        toast({ title: "Alias criado" });
      }

      setNewAlias({ wallet_address: '', alias: '', notes: '' });
      setEditingAlias(null);
      setAliasModalOpen(false);
      fetchAliases();
      
      // Refresh withdrawals to show updated aliases
      if (activeTab === 'withdrawals') {
        fetchOperations('withdrawals');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar alias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlias = async (id: string) => {
    if (!confirm('Deseja excluir este alias?')) return;

    const { error } = await supabase
      .from('okx_wallet_aliases')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Alias excluído" });
      fetchAliases();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      '2': { label: 'Concluído', className: 'bg-success text-success-foreground' },
      '1': { label: 'Pendente', className: 'bg-warning text-warning-foreground' },
      '0': { label: 'Processando', className: 'bg-primary text-primary-foreground' },
      '-1': { label: 'Falhou', className: 'bg-destructive text-destructive-foreground' },
      '-2': { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
      'filled': { label: 'Executado', className: 'bg-success text-success-foreground' },
      'live': { label: 'Ativo', className: 'bg-primary text-primary-foreground' },
      'partially_filled': { label: 'Parcial', className: 'bg-warning text-warning-foreground' },
      'canceled': { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
    };
    const s = statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${currency}`;
  };

  // Filter withdrawals by wallet
  const filteredWithdrawals = useMemo(() => {
    if (walletFilter === 'all') return withdrawals;
    if (walletFilter === 'unknown') return withdrawals.filter(w => !w.alias);
    return withdrawals.filter(w => 
      w.toAddress?.toLowerCase() === walletFilter.toLowerCase()
    );
  }, [withdrawals, walletFilter]);

  // Group withdrawals by wallet/alias for summary
  const withdrawalsByWallet = useMemo(() => {
    const grouped = new Map<string, { 
      alias: string; 
      address: string;
      count: number; 
      total: number;
      fees: number;
    }>();
    
    withdrawals.forEach(w => {
      const key = w.alias || 'Não identificado';
      const address = w.toAddress || '';
      const current = grouped.get(key) || { 
        alias: key, 
        address: w.alias ? address : '',
        count: 0, 
        total: 0,
        fees: 0
      };
      grouped.set(key, {
        ...current,
        count: current.count + 1,
        total: current.total + (w.amount || 0),
        fees: current.fees + (w.fee || 0)
      });
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [withdrawals]);

  // Wallet filter options
  const walletFilterOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todas as carteiras' },
      { value: 'unknown', label: 'Não identificadas' },
    ];
    
    aliases.forEach(a => {
      options.push({ value: a.wallet_address, label: a.alias });
    });
    
    return options;
  }, [aliases]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Operações OKX</h1>
                <p className="text-xs text-muted-foreground">Depósitos, Compras e Saques</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={aliasModalOpen} onOpenChange={setAliasModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Aliases
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Aliases de Carteiras</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Form to add/edit alias */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Endereço</Label>
                        <Input
                          placeholder="0x..."
                          value={newAlias.wallet_address}
                          onChange={(e) => setNewAlias({ ...newAlias, wallet_address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Alias</Label>
                        <Input
                          placeholder="Ex: Black Hole"
                          value={newAlias.alias}
                          onChange={(e) => setNewAlias({ ...newAlias, alias: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleSaveAlias} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          {editingAlias ? 'Atualizar' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>

                    {/* List of aliases */}
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Alias</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead className="w-20">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aliases.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nenhum alias cadastrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            aliases.map((alias) => (
                              <TableRow key={alias.id}>
                                <TableCell className="font-medium">{alias.alias}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {alias.wallet_address.slice(0, 10)}...{alias.wallet_address.slice(-8)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setEditingAlias(alias);
                                        setNewAlias({
                                          wallet_address: alias.wallet_address,
                                          alias: alias.alias,
                                          notes: alias.notes || '',
                                        });
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => handleDeleteAlias(alias.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-success">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Depósitos BRL</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0), 'BRL')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{deposits.length} operações</p>
                  </div>
                  <Download className="h-8 w-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Compras USDT</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(purchases.filter(p => p.side === 'buy').reduce((sum, p) => sum + p.amount, 0), 'USDT')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(purchases.filter(p => p.side === 'buy').reduce((sum, p) => sum + p.total, 0), 'BRL')} em BRL
                    </p>
                  </div>
                  <span className="text-3xl opacity-50">🛒</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saques USDT</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(withdrawals.reduce((sum, w) => sum + w.amount, 0), 'USDT')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxas: {formatCurrency(withdrawals.reduce((sum, w) => sum + w.fee, 0), 'USDT')}
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => fetchOperations(activeTab)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deposits" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Depósitos BRL
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                🛒 Compras USDT
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Saques USDT
              </TabsTrigger>
            </TabsList>

            {/* Deposits Tab */}
            <TabsContent value="deposits">
              <Card>
                <CardHeader>
                  <CardTitle>Depósitos em BRL</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                      <p className="text-muted-foreground mt-3">Carregando depósitos...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-destructive mb-2">⚠️</div>
                      <p className="text-destructive font-medium">Erro ao carregar dados</p>
                      <p className="text-muted-foreground text-sm mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => fetchOperations('deposits')}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : deposits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum depósito encontrado no período</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>ID Transação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deposits.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>
                              {format(new Date(d.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium text-success">
                              {formatCurrency(d.amount, 'BRL')}
                            </TableCell>
                            <TableCell>{getStatusBadge(d.status)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {d.txId?.slice(0, 16) || '-'}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle>Compras de USDT</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                      <p className="text-muted-foreground mt-3">Carregando compras...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-destructive mb-2">⚠️</div>
                      <p className="text-destructive font-medium">Erro ao carregar dados</p>
                      <p className="text-muted-foreground text-sm mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => fetchOperations('purchases')}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma compra encontrada no período</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade USDT</TableHead>
                          <TableHead>Preço Médio</TableHead>
                          <TableHead>Total BRL</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {format(new Date(p.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge className={p.side === 'buy' ? 'bg-success' : 'bg-destructive'}>
                                {p.side === 'buy' ? 'Compra' : 'Venda'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(p.amount, 'USDT')}
                            </TableCell>
                            <TableCell>{formatCurrency(p.price, 'BRL')}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(p.total, 'BRL')}
                            </TableCell>
                            <TableCell>{getStatusBadge(p.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals">
              <div className="space-y-4">
                {/* Summary Cards by Wallet */}
                {!loading && !error && withdrawalsByWallet.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {withdrawalsByWallet.map((wallet) => (
                      <Card 
                        key={wallet.alias} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          walletFilter === (wallet.alias === 'Não identificado' ? 'unknown' : 
                            aliases.find(a => a.alias === wallet.alias)?.wallet_address || 'all')
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                        onClick={() => {
                          if (wallet.alias === 'Não identificado') {
                            setWalletFilter(walletFilter === 'unknown' ? 'all' : 'unknown');
                          } else {
                            const aliasData = aliases.find(a => a.alias === wallet.alias);
                            if (aliasData) {
                              setWalletFilter(
                                walletFilter === aliasData.wallet_address ? 'all' : aliasData.wallet_address
                              );
                            }
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate" title={wallet.alias}>
                                {wallet.alias}
                              </p>
                              <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(wallet.total, 'USDT')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {wallet.count} {wallet.count === 1 ? 'operação' : 'operações'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Filter and Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle>Saques de USDT</CardTitle>
                      
                      {/* Wallet Filter */}
                      {!loading && !error && withdrawals.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select value={walletFilter} onValueChange={setWalletFilter}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Filtrar por carteira" />
                            </SelectTrigger>
                            <SelectContent>
                              {walletFilterOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {walletFilter !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              {filteredWithdrawals.length} de {withdrawals.length}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        <p className="text-muted-foreground mt-3">Carregando saques...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <div className="text-destructive mb-2">⚠️</div>
                        <p className="text-destructive font-medium">Erro ao carregar dados</p>
                        <p className="text-muted-foreground text-sm mt-1">{error}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => fetchOperations('withdrawals')}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar novamente
                        </Button>
                      </div>
                    ) : filteredWithdrawals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>
                          {walletFilter !== 'all' 
                            ? 'Nenhum saque encontrado para esta carteira'
                            : 'Nenhum saque encontrado no período'
                          }
                        </p>
                        {walletFilter !== 'all' && (
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => setWalletFilter('all')}
                          >
                            Limpar filtro
                          </Button>
                        )}
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Destino</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Taxa</TableHead>
                              <TableHead>Rede</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredWithdrawals.map((w) => (
                              <TableRow key={w.id}>
                                <TableCell>
                                  {w.timestamp ? format(new Date(w.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        {w.alias ? (
                                          <div>
                                            <Badge className="bg-primary mb-1">{w.alias}</Badge>
                                            <p className="font-mono text-xs text-muted-foreground">
                                              {w.toAddress ? `${w.toAddress.slice(0, 8)}...${w.toAddress.slice(-6)}` : '-'}
                                            </p>
                                          </div>
                                        ) : w.toAddress ? (
                                          <span className="font-mono text-xs">
                                            {w.toAddress.slice(0, 10)}...{w.toAddress.slice(-8)}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p className="font-mono text-xs break-all">{w.toAddress || 'Endereço não disponível'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(w.amount || 0, 'USDT')}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatCurrency(w.fee || 0, 'USDT')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{w.network || '-'}</Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(w.status || 'unknown')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TooltipProvider>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminOkxOperations;
