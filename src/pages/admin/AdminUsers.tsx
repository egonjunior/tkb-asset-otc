import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilterBar, FilterState } from "@/components/admin/FilterBar";
import { UserStatsCard } from "@/components/admin/UserStatsCard";
import {
  LogOut, Search, Download, Users, LayoutGrid, List,
  ChevronLeft, UserPlus, Mail, Shield, ArrowUpRight,
  Loader2, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface UserStat {
  user_id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  registered_at: string;
  completed_orders: number;
  total_volume: number;
  last_order_date: string | null;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filters, setFilters] = useState<FilterState>({
    volumeMin: 0,
    ordersMin: 0,
    registrationPeriod: 'all',
    orderStatus: 'all',
  });

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters, searchTerm]);

  const checkAdminAndFetchUsers = async () => {
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
      return;
    }

    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_stats');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar os dados dos usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        u =>
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.document_number.includes(searchTerm)
      );
    }

    // Volume filter
    if (filters.volumeMin > 0) {
      filtered = filtered.filter(u => Number(u.total_volume) >= filters.volumeMin);
    }

    // Orders filter
    if (filters.ordersMin > 0) {
      filtered = filtered.filter(u => u.completed_orders >= filters.ordersMin);
    }

    // Registration period filter
    if (filters.registrationPeriod !== 'all') {
      const days = Number(filters.registrationPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(u => new Date(u.registered_at) >= cutoffDate);
    }

    setFilteredUsers(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Documento', 'Ordens', 'Volume Total', 'Última Atividade'];
    const rows = filteredUsers.map(u => [
      u.full_name,
      `${u.document_type} ${u.document_number}`,
      u.completed_orders,
      Number(u.total_volume).toFixed(2),
      u.last_order_date || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString()}.csv`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const maskDocument = (doc: string) => {
    if (doc.length <= 4) return doc;
    return `***${doc.slice(-4)}`;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-black text-white">
        <AppSidebar forceAdmin={true} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hover:bg-white/10 text-white/40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                    Gestão de Usuários
                  </h1>
                  <p className="text-white/40 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">
                    Controle de Acessos · Database Protocol v2.0
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportToCSV} className="border-white/10 hover:bg-white/5 h-10 px-4">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout} className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all h-10 px-4">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </header>

            {/* Quick Stats Overlay - Bento Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl group hover:border-[#00D4FF]/20 transition-all">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Total de Clientes</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold text-white tracking-tighter">{users.length}</h3>
                    <Users className="h-5 w-5 text-[#00D4FF] opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl group hover:border-emerald-500/20 transition-all">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Volume Total Acumulado</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-emerald-500 tracking-tighter">
                      {formatCurrency(users.reduce((acc, curr) => acc + Number(curr.total_volume), 0))}
                    </h3>
                    <Shield className="h-5 w-5 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl col-span-1 md:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input
                        placeholder="Buscar por nome corporativo ou documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/[0.03] border-white/10 focus:border-[#00D4FF] transition-all h-12"
                      />
                    </div>
                    <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/10">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('table')}
                        className={`h-10 w-10 ${viewMode === 'table' ? 'bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('grid')}
                        className={`h-10 w-10 ${viewMode === 'grid' ? 'bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <Card className="bg-white/[0.01] border-white/5 shadow-inner">
              <CardContent className="pt-6">
                <FilterBar filters={filters} onFilterChange={setFilters} />
              </CardContent>
            </Card>

            {/* Main Content Area */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
                <p className="text-white/20 font-mono text-xs uppercase tracking-widest text-center">Interrogando Database Protocol...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl py-20 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-white/10" />
                <p className="text-white/40 font-medium">Nenhum registro encontrado com estes parâmetros.</p>
                <Button variant="link" onClick={() => { setSearchTerm(""); setFilters({ volumeMin: 0, ordersMin: 0, registrationPeriod: 'all', orderStatus: 'all' }) }} className="text-[#00D4FF] mt-2">
                  Resetar filtros
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => navigate(`/admin/users/${user.user_id}`)}
                    className="cursor-pointer group"
                  >
                    <UserStatsCard
                      fullName={user.full_name}
                      documentType={user.document_type}
                      documentNumber={user.document_number}
                      totalOrders={user.completed_orders}
                      totalVolume={Number(user.total_volume)}
                      lastActivity={user.last_order_date || undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 p-6">
                  <CardTitle className="text-lg font-bold">Listagem de Perfis</CardTitle>
                  <CardDescription className="text-white/20">Dados agregados baseados no histórico operacional.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Perfil</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Identificação</TableHead>
                          <TableHead className="text-right text-white/40 text-[10px] uppercase font-mono tracking-wider">Ordens</TableHead>
                          <TableHead className="text-right text-white/40 text-[10px] uppercase font-mono tracking-wider">Volume Transacionado</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-mono tracking-wider">Atividade Recente</TableHead>
                          <TableHead className="text-right text-white/40 text-[10px] uppercase font-mono tracking-wider">Operações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.user_id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-white group-hover:text-[#00D4FF] transition-all">{user.full_name}</span>
                                <span className="text-[10px] text-white/20 font-mono tracking-tighter uppercase">ID: {user.user_id.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 font-mono">
                                {user.document_type} {maskDocument(user.document_number)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-white/60">{user.completed_orders}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-500/80 font-mono">
                              {formatCurrency(Number(user.total_volume))}
                            </TableCell>
                            <TableCell className="text-white/20 text-[10px] font-mono">
                              {user.last_order_date
                                ? new Date(user.last_order_date).toLocaleDateString('pt-BR')
                                : 'NULL'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/users/${user.user_id}`);
                                }}
                                className="text-white/40 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 h-8 gap-2"
                              >
                                Ver Detalhes
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}