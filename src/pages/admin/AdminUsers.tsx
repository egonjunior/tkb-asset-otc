import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar, FilterState } from "@/components/admin/FilterBar";
import { UserStatsCard } from "@/components/admin/UserStatsCard";
import { LogOut, Search, Download, Users, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        .from('user_stats')
        .select('*')
        .order('total_volume', { ascending: false });

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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
              ← Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
              <p className="text-muted-foreground">
                Total: {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </CardContent>
        </Card>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                onClick={() => navigate(`/admin/users/${user.user_id}`)}
                className="cursor-pointer"
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
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Ordens</TableHead>
                    <TableHead className="text-right">Volume Total</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>
                        {user.document_type} {maskDocument(user.document_number)}
                      </TableCell>
                      <TableCell className="text-right">{user.completed_orders}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(user.total_volume))}
                      </TableCell>
                      <TableCell>
                        {user.last_order_date
                          ? new Date(user.last_order_date).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.user_id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}