import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDocumentsModal } from "@/components/admin/UserDocumentsModal";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
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
        acc[userId] = {
          user_id: userId,
          full_name: doc.profiles?.full_name || 'Sem nome',
          document_number: doc.profiles?.document_number || 'Sem documento',
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

  const pendingCount = documents.filter(d => d.status === 'under_review').length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Validação de Documentos</h1>
        <p className="text-muted-foreground">
          Gerencie e valide os documentos enviados pelos clientes
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
              <div className="text-sm text-blue-600">Pendentes</div>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'approved').length}
              </div>
              <div className="text-sm text-green-600">Aprovados</div>
            </div>
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.status === 'rejected').length}
              </div>
              <div className="text-sm text-red-600">Reprovados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Pendentes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.document_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.total_count} total</Badge>
                      </TableCell>
                      <TableCell>
                        {user.pending_count > 0 ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                            {user.pending_count} pendente{user.pending_count > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 dark:text-green-400">
                            Tudo aprovado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Documentos
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
    </div>
  );
}
