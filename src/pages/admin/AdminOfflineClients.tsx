import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Plus, Search, Eye, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OfflineClientModal } from "@/components/admin/OfflineClientModal";

interface OfflineClient {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminOfflineClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<OfflineClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<OfflineClient | null>(null);

  useEffect(() => {
    checkAdminAndFetch();

    // Realtime subscription
    const channel = supabase
      .channel('admin-offline-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offline_clients' }, fetchClients)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      toast({ title: "Acesso negado", variant: "destructive" });
      navigate('/admin/dashboard');
      return;
    }

    fetchClients();
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offline_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error);
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente? Todas as transações e documentos também serão removidos.")) return;

    try {
      const { error } = await supabase
        .from('offline_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      toast({ title: "Cliente excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document_number.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Clientes Offline</h1>
                <p className="text-xs text-muted-foreground">Gestão de operações manuais</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                Voltar
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clientes com Operações Manuais</CardTitle>
                <Button onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, documento ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-3">Carregando...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.full_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">{client.document_type}</span>
                              <span>{client.document_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>{client.email || '-'}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>{new Date(client.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/offline-clients/${client.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(client.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <OfflineClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={selectedClient}
        onSuccess={fetchClients}
      />
    </div>
  );
}
