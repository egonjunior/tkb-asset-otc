import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Plus, FileDown, FileSpreadsheet, ArrowLeft, Upload, Trash2, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OfflineTransactionModal } from "@/components/admin/OfflineTransactionModal";
import { OfflineDocumentUploader } from "@/components/admin/OfflineDocumentUploader";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OfflineClientReport } from "@/components/admin/OfflineClientReport";

interface OfflineClient {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface OfflineTransaction {
  id: string;
  transaction_date: string;
  usdt_amount: number;
  brl_amount: number;
  usdt_rate: number;
  operation_type: string;
  notes?: string;
  created_at: string;
}

interface OfflineDocument {
  id: string;
  document_name: string;
  file_url: string;
  document_type?: string;
  uploaded_at: string;
}

export default function AdminOfflineClientDetails() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [client, setClient] = useState<OfflineClient | null>(null);
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [documents, setDocuments] = useState<OfflineDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, [clientId]);

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

    await Promise.all([fetchClient(), fetchTransactions(), fetchDocuments()]);
  };

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error: any) {
      console.error("Erro ao buscar cliente:", error);
      toast({ title: "Erro ao carregar cliente", variant: "destructive" });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Excluir esta transação?")) return;

    try {
      const { error } = await supabase
        .from('offline_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      toast({ title: "Transação excluída" });
      fetchTransactions();
    } catch (error: any) {
      console.error("Erro ao excluir transação:", error);
      toast({ title: "Erro ao excluir transação", variant: "destructive" });
    }
  };

  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    if (!confirm("Excluir este documento?")) return;

    try {
      // Extract file path from URL
      const filePath = fileUrl.split('/offline-client-documents/')[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('offline-client-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('offline_client_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      toast({ title: "Documento excluído" });
      fetchDocuments();
    } catch (error: any) {
      console.error("Erro ao excluir documento:", error);
      toast({ title: "Erro ao excluir documento", variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    if (!client || transactions.length === 0) {
      toast({ title: "Nenhuma transação para exportar", variant: "destructive" });
      return;
    }

    // Calculate totals
    const totalUSDT = transactions.reduce((sum, t) => sum + Number(t.usdt_amount), 0);
    const totalBRL = transactions.reduce((sum, t) => sum + Number(t.brl_amount), 0);
    const avgRate = totalBRL / totalUSDT;

    // Prepare data
    const summaryData = [
      ['RELATÓRIO DE TRANSAÇÕES OFFLINE'],
      [''],
      ['Cliente:', client.full_name],
      ['Documento:', `${client.document_type}: ${client.document_number}`],
      ['Email:', client.email || '-'],
      ['Período:', `${new Date(transactions[transactions.length - 1].transaction_date).toLocaleDateString('pt-BR')} a ${new Date(transactions[0].transaction_date).toLocaleDateString('pt-BR')}`],
      [''],
      ['RESUMO'],
      ['Total USDT:', totalUSDT.toFixed(2)],
      ['Total BRL:', `R$ ${totalBRL.toFixed(2)}`],
      ['Cotação Média:', `R$ ${avgRate.toFixed(4)}`],
      ['Total de Operações:', transactions.length],
      [''],
      ['TRANSAÇÕES'],
    ];

    const transactionsData = transactions.map(t => ({
      'Data': new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      'Tipo': t.operation_type === 'compra' ? 'Compra' : 'Venda',
      'USDT': Number(t.usdt_amount).toFixed(2),
      'BRL': `R$ ${Number(t.brl_amount).toFixed(2)}`,
      'Cotação': `R$ ${Number(t.usdt_rate).toFixed(4)}`,
      'Observações': t.notes || '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.sheet_add_json(ws, transactionsData, { origin: -1, skipHeader: false });

    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `TKB_Cliente_${client.full_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({ title: "Excel exportado com sucesso" });
  };

  const exportToPDF = async () => {
    if (!client) return;

    const reportElement = document.getElementById('offline-client-report');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`TKB_Relatorio_${client.full_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({ title: "PDF gerado com sucesso" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-foreground">{client.full_name}</h1>
                <p className="text-xs text-muted-foreground">Relatório de Operações Offline</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/offline-clients')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p className="font-medium">{client.document_type}: {client.document_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{client.phone || '-'}</p>
                </div>
                {client.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{client.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={exportToExcel} disabled={transactions.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button onClick={exportToPDF} variant="outline" disabled={transactions.length === 0}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF Visual
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visual Report (hidden, for PDF generation) */}
          <div id="offline-client-report" className="hidden">
            <OfflineClientReport client={client} transactions={transactions} />
          </div>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transações</CardTitle>
                <Button onClick={() => setIsTransactionModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Transação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação registrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>USDT</TableHead>
                      <TableHead>BRL</TableHead>
                      <TableHead>Cotação</TableHead>
                      <TableHead>Obs</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge variant={tx.operation_type === 'compra' ? 'default' : 'secondary'}>
                            {tx.operation_type === 'compra' ? 'Compra' : 'Venda'}
                          </Badge>
                        </TableCell>
                        <TableCell>{Number(tx.usdt_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {Number(tx.brl_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {Number(tx.usdt_rate).toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{tx.notes || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransaction(tx.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documentos</CardTitle>
                <Button onClick={() => setIsDocUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum documento enviado
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')} às {new Date(doc.uploaded_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <OfflineTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        clientId={clientId!}
        onSuccess={fetchTransactions}
      />

      <OfflineDocumentUploader
        open={isDocUploadOpen}
        onOpenChange={setIsDocUploadOpen}
        clientId={clientId!}
        onSuccess={fetchDocuments}
      />
    </div>
  );
}
