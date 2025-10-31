import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentReviewModal } from "@/components/admin/DocumentReviewModal";
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

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    subscribeToDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles!documents_user_id_fkey(full_name, document_number)')
        .in('document_type', ['contrato-quadro', 'dossie-kyc'])
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

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.profiles?.document_number.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    setFilteredDocuments(filtered);
  };

  const handleReview = (document: AdminDocument) => {
    setSelectedDocument(document);
    setReviewModalOpen(true);
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="contrato-quadro">Contrato-Quadro</SelectItem>
                <SelectItem value="dossie-kyc">Dossiê KYC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum documento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Envio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.profiles?.full_name || '-'}
                      </TableCell>
                      <TableCell>{doc.profiles?.document_number || '-'}</TableCell>
                      <TableCell className="capitalize">
                        {doc.document_type === 'contrato-quadro' ? 'Contrato-Quadro' : 'Dossiê KYC'}
                      </TableCell>
                      <TableCell>
                        <DocumentStatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell>
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(doc)}
                          disabled={!doc.client_file_url}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Revisar
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

      {selectedDocument && (
        <DocumentReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          onReviewComplete={fetchDocuments}
        />
      )}
    </div>
  );
}
