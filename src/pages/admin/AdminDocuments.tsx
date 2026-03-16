import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDocumentsModal } from "@/components/admin/UserDocumentsModal";
import { Eye, Search, FileText, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { DocumentStatus } from "@/lib/documentHelpers";

interface AdminDocument {
  id: string;
  document_type: string;
  status: DocumentStatus;
  uploaded_at: string;
  client_file_url: string;
  tkb_file_url: string | null;
  rejection_reason: string | null;
  user_id: string;
  profiles: {
    full_name: string;
    document_number: string;
  };
}

interface UserDocuments {
  user_id: string;
  full_name: string;
  document_number: string;
  documents: AdminDocument[];
  pending_count: number;
  total_count: number;
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [userDocuments, setUserDocuments] = useState<UserDocuments[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserDocuments | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    subscribeToDocuments();
  }, []);

  useEffect(() => {
    const grouped = groupDocumentsByUser(documents);
    setUserDocuments(grouped);
  }, [documents]);

  useEffect(() => {
    filterUsers();
  }, [userDocuments, searchTerm, statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles!documents_user_id_fkey(full_name, document_number)')
        .in('document_type', [
          'contrato-quadro',
          'dossie-kyc',
          'kyc-faturamento',
          'kyc-cnpj',
          'kyc-identificacao',
          'kyc-comprovante-residencia',
          'kyc-outros'
        ])
        .order('uploaded_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setDocuments(data as AdminDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDocuments = () => {
    const channel = supabase
      .channel('admin-documents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents'
      }, () => {
        fetchDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const groupDocumentsByUser = (docs: AdminDocument[]): UserDocuments[] => {
    const grouped = docs.reduce((acc, doc) => {
      const userId = doc.user_id;
      if (!acc[userId]) {
        const profile = doc.profiles;
        const profileData = Array.isArray(profile) ? profile[0] : profile;

        acc[userId] = {
          user_id: userId,
          full_name: profileData?.full_name || 'Sem nome',
          document_number: profileData?.document_number || 'Sem documento',
          documents: [],
          pending_count: 0,
          total_count: 0
        };
      }
      acc[userId].documents.push(doc);
      acc[userId].total_count++;
      if (doc.status === 'under_review' || doc.status === 'pending') {
        acc[userId].pending_count++;
      }
      return acc;
    }, {} as Record<string, UserDocuments>);

    return Object.values(grouped)
      .sort((a, b) => b.pending_count - a.pending_count);
  };

  const filterUsers = () => {
    let filtered = [...userDocuments];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.document_number.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        user.documents.some(doc => doc.status === statusFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'under_review' || d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-black text-white">
        <AppSidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight">
                  Validação de <span className="text-[#00D4FF]">Documentos</span>
                </h1>
                <p className="text-white/40 mt-2 text-lg font-light">
                  Mesa de Compliance: Autentique e valide a documentação institucional dos clientes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDocuments()}
                className="border-white/10 hover:bg-white/5 bg-white/[0.02] backdrop-blur-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sincronizar Protocolos
              </Button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-all" />
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Total Geral</p>
                      <h3 className="text-3xl font-bold text-white tracking-tighter">{stats.total}</h3>
                    </div>
                    <FileText className="h-8 w-8 text-white/10" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/10 backdrop-blur-xl relative overflow-hidden group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60 mb-1">Aguardando Revisão</p>
                      <h3 className="text-3xl font-bold text-amber-500 tracking-tighter">{stats.pending}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/10 backdrop-blur-xl relative overflow-hidden group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/60 mb-1">Certificados</p>
                      <h3 className="text-3xl font-bold text-emerald-500 tracking-tighter">{stats.approved}</h3>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/10 backdrop-blur-xl relative overflow-hidden group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-red-500/60 mb-1">Inconsistências</p>
                      <h3 className="text-3xl font-bold text-red-500 tracking-tighter">{stats.rejected}</h3>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl border border-white/5">
              <CardHeader className="bg-white/[0.01] border-b border-white/5 p-6 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent opacity-50" />
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="w-full md:w-96 relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#00D4FF] transition-colors" />
                    <Input
                      placeholder="Filtrar por nome ou documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-black/40 border-white/10 text-white focus:border-[#00D4FF] focus:ring-[#00D4FF]/10 transition-all h-11"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[220px] bg-black/40 border-white/10 text-white h-11">
                      <SelectValue placeholder="Status de Conformidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      <SelectItem value="all">Todos os Protocolos</SelectItem>
                      <SelectItem value="pending">Apenas Pendentes</SelectItem>
                      <SelectItem value="under_review">Em Análise</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="rejected">Reprovados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading && documents.length === 0 ? (
                  <div className="flex flex-col justify-center items-center p-32 space-y-6">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 animate-spin text-[#00D4FF]" />
                      <div className="absolute inset-0 blur-xl bg-[#00D4FF]/20 animate-pulse" />
                    </div>
                    <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.3em]">Varrendo Protocolos...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-24">
                    <AlertCircle className="h-16 w-16 mx-auto mb-6 text-white/5" />
                    <p className="text-white/20 text-lg font-light italic">Nenhum registro de conformidade para os filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/[0.03]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5 pl-8">Identificação Cliente</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Registro Fiscal</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5">Massa Documental</TableHead>
                          <TableHead className="text-white/40 text-[10px] uppercase font-bold tracking-[0.15em] py-5 text-right pr-8">Ação Decisória</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.user_id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="py-6 pl-8">
                              <span className="font-bold text-white text-base tracking-tight group-hover:text-[#00D4FF] transition-colors">{user.full_name}</span>
                            </TableCell>
                            <TableCell className="py-6">
                              <span className="text-white/40 font-mono text-xs tracking-wider">{user.document_number}</span>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-white/10 text-white/40 bg-white/[0.01] px-2 py-0.5 text-[10px] font-mono">
                                  {user.total_count} arquivos
                                </Badge>
                                {user.pending_count > 0 && (
                                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">
                                    {user.pending_count} Alerta{user.pending_count > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-6 pr-8">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF]/10 bg-[#00D4FF]/5 font-bold uppercase text-[10px] tracking-widest h-9 px-6 transition-all"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserModalOpen(true);
                                }}
                              >
                                {user.pending_count > 0 ? (
                                  <><Clock className="h-3 w-3 mr-2" /> Analisar</>
                                ) : (
                                  <><Eye className="h-3 w-3 mr-2" /> Visualizar</>
                                )}
                              </Button>
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

          {selectedUser && (
            <UserDocumentsModal
              isOpen={userModalOpen}
              onClose={() => {
                setUserModalOpen(false);
                setSelectedUser(null);
              }}
              user={selectedUser}
              onReviewComplete={fetchDocuments}
            />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
