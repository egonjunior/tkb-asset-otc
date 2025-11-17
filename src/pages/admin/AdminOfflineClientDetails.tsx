import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Upload, FileSpreadsheet, FileText, Loader2, Trash2 } from "lucide-react";
import { OfflineTransactionModal } from "@/components/admin/OfflineTransactionModal";
import { OfflineDocumentUploader } from "@/components/admin/OfflineDocumentUploader";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface OfflineClient {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

interface OfflineTransaction {
  id: string;
  client_id: string;
  transaction_date: string;
  operation_type: string;
  usdt_amount: number;
  brl_amount: number;
  usdt_rate: number;
  notes?: string;
  created_at: string;
}

interface OfflineDocument {
  id: string;
  client_id: string;
  document_name: string;
  document_type?: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function AdminOfflineClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<OfflineClient | null>(null);
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [documents, setDocuments] = useState<OfflineDocument[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, [clientId]);

  const checkAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roles || roles.role !== 'admin') {
        navigate('/');
        return;
      }

      await Promise.all([
        fetchClient(),
        fetchTransactions(),
        fetchDocuments(),
      ]);
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchClient = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('offline_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      toast({ title: "Erro ao carregar cliente", variant: "destructive" });
      return;
    }

    setClient(data);
  };

  const fetchTransactions = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('offline_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  const fetchDocuments = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('offline_client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('offline_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({ title: "Transação excluída com sucesso" });
      fetchTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts.slice(-2).join('/');

      const { error: storageError } = await supabase.storage
        .from('offline-client-documents')
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('offline_client_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({ title: "Documento excluído com sucesso" });
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    if (!client || transactions.length === 0) {
      toast({ title: "Nenhuma transação para exportar", variant: "destructive" });
      return;
    }

    setExportingExcel(true);

    try {
      const workbook = XLSX.utils.book_new();

      const totalUSDT = transactions.reduce((sum, t) => sum + t.usdt_amount, 0);
      const totalBRL = transactions.reduce((sum, t) => sum + t.brl_amount, 0);
      const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
      const compras = transactions.filter(t => t.operation_type === 'compra');
      const vendas = transactions.filter(t => t.operation_type === 'venda');
      const comprasUSDT = compras.reduce((sum, t) => sum + t.usdt_amount, 0);
      const vendasUSDT = vendas.reduce((sum, t) => sum + t.usdt_amount, 0);

      const summaryData = [
        ['RELATÓRIO DE CLIENTE OFFLINE - TKB ASSET'],
        [''],
        ['Nome', client.full_name],
        ['Documento', `${client.document_type}: ${client.document_number}`],
        ['Email', client.email || '-'],
        ['Telefone', client.phone || '-'],
        [''],
        ['RESUMO DO PERÍODO'],
        ['Volume Total USDT', totalUSDT.toFixed(2)],
        ['Volume Total BRL', `R$ ${totalBRL.toFixed(2)}`],
        ['Cotação Média', `R$ ${avgRate.toFixed(4)}`],
        ['Total de Operações', transactions.length],
        [''],
        ['COMPRAS'],
        ['Quantidade de Compras', compras.length],
        ['Volume USDT (Compras)', comprasUSDT.toFixed(2)],
        [''],
        ['VENDAS'],
        ['Quantidade de Vendas', vendas.length],
        ['Volume USDT (Vendas)', vendasUSDT.toFixed(2)],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Resumo');

      const transactionsData = transactions.map(t => ({
        'Data': new Date(t.transaction_date).toLocaleDateString('pt-BR'),
        'Tipo': t.operation_type.toUpperCase(),
        'USDT': t.usdt_amount.toFixed(2),
        'BRL': `R$ ${t.brl_amount.toFixed(2)}`,
        'Cotação (BRL/USDT)': `R$ ${t.usdt_rate.toFixed(4)}`,
        'Observações': t.notes || '-',
      }));

      const ws2 = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, ws2, 'Transações');

      const fileName = `relatorio-${client.full_name.replace(/\s+/g, '-')}-${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "Excel exportado com sucesso" });
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Erro ao exportar Excel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExportingExcel(false);
    }
  };

  const exportToPDF = () => {
    if (!client || transactions.length === 0) {
      toast({ title: "Nenhuma transação para exportar", variant: "destructive" });
      return;
    }

    setExportingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE CLIENTE OFFLINE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('TKB ASSET', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Client Info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informações do Cliente', 15, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nome: ${client.full_name}`, 15, yPos);
      yPos += 6;
      pdf.text(`${client.document_type}: ${client.document_number}`, 15, yPos);
      yPos += 6;
      if (client.email) {
        pdf.text(`Email: ${client.email}`, 15, yPos);
        yPos += 6;
      }
      if (client.phone) {
        pdf.text(`Telefone: ${client.phone}`, 15, yPos);
        yPos += 6;
      }
      yPos += 10;

      // Summary
      const totalUSDT = transactions.reduce((sum, t) => sum + t.usdt_amount, 0);
      const totalBRL = transactions.reduce((sum, t) => sum + t.brl_amount, 0);
      const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
      const compras = transactions.filter(t => t.operation_type === 'compra');
      const vendas = transactions.filter(t => t.operation_type === 'venda');

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo do Período', 15, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Volume Total USDT: ${totalUSDT.toFixed(2)}`, 15, yPos);
      yPos += 6;
      pdf.text(`Volume Total BRL: R$ ${totalBRL.toFixed(2)}`, 15, yPos);
      yPos += 6;
      pdf.text(`Cotação Média: R$ ${avgRate.toFixed(4)}`, 15, yPos);
      yPos += 6;
      pdf.text(`Total de Operações: ${transactions.length} (${compras.length} compras, ${vendas.length} vendas)`, 15, yPos);
      yPos += 12;

      // Transactions Table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transações', 15, yPos);
      yPos += 8;

      // Table header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data', 15, yPos);
      pdf.text('Tipo', 45, yPos);
      pdf.text('USDT', 70, yPos);
      pdf.text('BRL', 100, yPos);
      pdf.text('Cotação', 130, yPos);
      pdf.text('Obs', 160, yPos);
      yPos += 5;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      transactions.forEach((t, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        const date = new Date(t.transaction_date).toLocaleDateString('pt-BR');
        const tipo = t.operation_type.toUpperCase();
        const usdt = t.usdt_amount.toFixed(2);
        const brl = `R$ ${t.brl_amount.toFixed(2)}`;
        const rate = `R$ ${t.usdt_rate.toFixed(4)}`;
        const obs = t.notes ? t.notes.substring(0, 20) : '-';

        pdf.text(date, 15, yPos);
        pdf.text(tipo, 45, yPos);
        pdf.text(usdt, 70, yPos);
        pdf.text(brl, 100, yPos);
        pdf.text(rate, 130, yPos);
        pdf.text(obs, 160, yPos);
        yPos += 6;
      });

      // Footer
      yPos += 10;
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, 15, yPos);

      const fileName = `relatorio-${client.full_name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      pdf.save(fileName);

      toast({ title: "PDF exportado com sucesso" });
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cliente não encontrado</p>
            <Button onClick={() => navigate('/admin/offline-clients')} className="mt-4">
              Voltar para Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUSDT = transactions.reduce((sum, t) => sum + t.usdt_amount, 0);
  const totalBRL = transactions.reduce((sum, t) => sum + t.brl_amount, 0);
  const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
  const compras = transactions.filter(t => t.operation_type === 'compra');
  const vendas = transactions.filter(t => t.operation_type === 'venda');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/offline-clients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.full_name}</h1>
            <p className="text-muted-foreground">
              {client.document_type}: {client.document_number}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            disabled={exportingExcel || transactions.length === 0}
            variant="outline"
          >
            {exportingExcel ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={exportingPDF || transactions.length === 0}
            variant="outline"
          >
            {exportingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {(client.email || client.phone) && (
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.email && (
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <p className="font-medium">{client.phone}</p>
              </div>
            )}
            {client.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Observações:</span>
                <p className="font-medium">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Volume Total USDT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUSDT.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Volume Total BRL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {totalBRL.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cotação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {avgRate.toFixed(4)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {compras.length} compras, {vendas.length} vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações</CardTitle>
            <Button onClick={() => setIsTransactionModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">USDT</TableHead>
                  <TableHead className="text-right">BRL</TableHead>
                  <TableHead className="text-right">Cotação</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.operation_type === 'compra' ? 'default' : 'secondary'}>
                        {transaction.operation_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaction.usdt_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R$ {transaction.brl_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R$ {transaction.usdt_rate.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction.id)}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <Button onClick={() => setIsDocumentModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum documento enviado
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
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

      <OfflineTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        clientId={clientId!}
        onSuccess={fetchTransactions}
      />

      <OfflineDocumentUploader
        open={isDocumentModalOpen}
        onOpenChange={setIsDocumentModalOpen}
        clientId={clientId!}
        onSuccess={fetchDocuments}
      />
    </div>
  );
}
