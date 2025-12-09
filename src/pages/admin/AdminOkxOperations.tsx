import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Aliases management
  const [aliases, setAliases] = useState<WalletAlias[]>([]);
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<WalletAlias | null>(null);
  const [newAlias, setNewAlias] = useState({ wallet_address: '', alias: '', notes: '' });

  useEffect(() => {
    checkAdminAccess();
    fetchAliases();
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('okx-operations', {
        body: {
          type,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.data || [];

      if (type === 'deposits') {
        setDeposits(result);
      } else if (type === 'purchases') {
        setPurchases(result);
      } else if (type === 'withdrawals') {
        setWithdrawals(result);
      }

      toast({
        title: "Dados atualizados",
        description: `${result.length} registros carregados`,
      });
    } catch (error: any) {
      console.error('Error fetching OKX operations:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Verifique as credenciais OKX",
        variant: "destructive",
      });
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
                      <p className="text-muted-foreground mt-3">Carregando...</p>
                    </div>
                  ) : deposits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Clique em "Atualizar" para carregar os depósitos</p>
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
                      <p className="text-muted-foreground mt-3">Carregando...</p>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Clique em "Atualizar" para carregar as compras</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Saques de USDT</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                      <p className="text-muted-foreground mt-3">Carregando...</p>
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Clique em "Atualizar" para carregar os saques</p>
                    </div>
                  ) : (
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
                        {withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell>
                              {format(new Date(w.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {w.alias ? (
                                <div>
                                  <Badge className="bg-primary mb-1">{w.alias}</Badge>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {w.toAddress.slice(0, 8)}...{w.toAddress.slice(-6)}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs">
                                  {w.toAddress.slice(0, 10)}...{w.toAddress.slice(-8)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(w.amount, 'USDT')}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatCurrency(w.fee, 'USDT')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{w.network}</Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(w.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminOkxOperations;
