import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, LogOut, Download, Search, ShieldCheck, ShieldX, FileText, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PLDRecord {
  user_id: string;
  full_name: string;
  document_number: string;
  document_type: string;
  pld_acknowledged: boolean;
  pld_acknowledged_at: string | null;
}

const AdminPLDCompliance = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PLDRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PLDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending">("all");

  useEffect(() => {
    const checkAdminAndFetch = async () => {
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

      fetchRecords();
    };

    checkAdminAndFetch();
  }, [navigate]);

  const fetchRecords = async () => {
    setLoading(true);
    
    // Buscar documentos do tipo politica-pld com status de aceite
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('user_id, pld_acknowledged, pld_acknowledged_at')
      .eq('document_type', 'politica-pld');

    if (docsError) {
      console.error('Erro ao buscar documentos PLD:', docsError);
      toast({
        title: "Erro ao carregar dados",
        description: "Tente recarregar a página",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!documents || documents.length === 0) {
      setRecords([]);
      setFilteredRecords([]);
      setLoading(false);
      return;
    }

    // Buscar perfis dos usuários
    const userIds = [...new Set(documents.map(d => d.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, document_number, document_type')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]));

    const combinedRecords: PLDRecord[] = documents.map(doc => {
      const profile = profilesMap.get(doc.user_id);
      return {
        user_id: doc.user_id,
        full_name: profile?.full_name || 'N/A',
        document_number: profile?.document_number || 'N/A',
        document_type: profile?.document_type || 'CPF',
        pld_acknowledged: doc.pld_acknowledged || false,
        pld_acknowledged_at: doc.pld_acknowledged_at,
      };
    });

    setRecords(combinedRecords);
    setFilteredRecords(combinedRecords);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = records;

    // Aplicar filtro de status
    if (filter === "confirmed") {
      filtered = filtered.filter(r => r.pld_acknowledged);
    } else if (filter === "pending") {
      filtered = filtered.filter(r => !r.pld_acknowledged);
    }

    // Aplicar busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.full_name.toLowerCase().includes(term) ||
        r.document_number.includes(term)
      );
    }

    setFilteredRecords(filtered);
  }, [records, filter, searchTerm]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/admin/login");
  };

  const maskDocument = (doc: string) => {
    if (doc.length <= 6) return doc;
    return doc.slice(0, 3) + '***' + doc.slice(-3);
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Documento', 'Tipo', 'Status', 'Data/Hora Confirmação'];
    const rows = filteredRecords.map(r => [
      r.full_name,
      r.document_number,
      r.document_type,
      r.pld_acknowledged ? 'Confirmado' : 'Pendente',
      r.pld_acknowledged_at 
        ? format(new Date(r.pld_acknowledged_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
        : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compliance-pld-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV gerado com sucesso",
    });
  };

  // Estatísticas
  const stats = {
    total: records.length,
    confirmed: records.filter(r => r.pld_acknowledged).length,
    pending: records.filter(r => !r.pld_acknowledged).length,
    last24h: records.filter(r => {
      if (!r.pld_acknowledged_at) return false;
      const date = new Date(r.pld_acknowledged_at);
      const now = new Date();
      return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
    }).length,
  };

  const compliancePercent = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Compliance PLD</h1>
                <p className="text-xs text-muted-foreground">Gestão de Aceites</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                ← Voltar
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Estatísticas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Usuários</p>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-success">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-success">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground mt-1">{compliancePercent}% compliance</p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-warning">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <ShieldX className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-warning">{stats.pending}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Últimas 24h</p>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">{stats.last24h}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Ações */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Registros de Aceite PLD
                </CardTitle>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-3">Carregando registros...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora Confirmação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.user_id}>
                          <TableCell className="font-medium">{record.full_name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {maskDocument(record.document_number)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.document_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {record.pld_acknowledged ? (
                              <Badge className="bg-success text-success-foreground">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Confirmado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-warning/20 text-warning">
                                <ShieldX className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.pld_acknowledged_at ? (
                              <span className="text-sm">
                                {format(new Date(record.pld_acknowledged_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 text-sm text-muted-foreground text-right">
                Exibindo {filteredRecords.length} de {records.length} registros
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPLDCompliance;
