import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Upload, Loader2, Trash2, Pencil, Download } from "lucide-react";
import { OfflineTransactionModal } from "@/components/admin/OfflineTransactionModal";
import { OfflineDocumentUploader } from "@/components/admin/OfflineDocumentUploader";
import { ExportFilterModal } from "@/components/admin/ExportFilterModal";
import { formatCurrency, formatUSDT, formatRate, formatDate } from "@/lib/formatters";
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
  const [isExportFilterModalOpen, setIsExportFilterModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<OfflineTransaction | undefined>(undefined);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('all');

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

  const handleEditTransaction = (transaction: OfflineTransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(undefined);
    setIsTransactionModalOpen(true);
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

  // Generate list of available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Map<string, string>();
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      months.set(key, capitalizedLabel);
    });
    return Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [transactions]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    if (filterMonth === 'all') return transactions;
    
    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === filterMonth;
    });
  }, [transactions, filterMonth]);

  // Calculate summary based on filtered transactions
  const summary = useMemo(() => {
    const totalUSDT = filteredTransactions.reduce((sum, t) => sum + Number(t.usdt_amount), 0);
    const totalBRL = filteredTransactions.reduce((sum, t) => sum + Number(t.brl_amount), 0);
    const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
    const buyTransactions = filteredTransactions.filter(t => t.operation_type === 'compra');
    const sellTransactions = filteredTransactions.filter(t => t.operation_type === 'venda');
    const totalBuy = buyTransactions.reduce((sum, t) => sum + Number(t.usdt_amount), 0);
    const totalSell = sellTransactions.reduce((sum, t) => sum + Number(t.usdt_amount), 0);

    return {
      totalUSDT,
      totalBRL,
      avgRate,
      totalTransactions: filteredTransactions.length,
      totalBuy,
      totalSell,
      buyCount: buyTransactions.length,
      sellCount: sellTransactions.length,
    };
  }, [filteredTransactions]);

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

  const handleExport = async (startDate: Date, endDate: Date, format: 'pdf' | 'excel') => {
    if (!client) return;

    // Filtrar transações pelo período
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    if (filteredTransactions.length === 0) {
      toast({ 
        title: "Nenhuma transação encontrada", 
        description: "Não há transações no período selecionado",
        variant: "destructive" 
      });
      return;
    }

    if (format === 'excel') {
      exportToExcel(filteredTransactions, startDate, endDate);
    } else {
      exportToPDF(filteredTransactions, startDate, endDate);
    }
  };

  const exportToExcel = (filteredTransactions: OfflineTransaction[], startDate: Date, endDate: Date) => {
    setExportingExcel(true);

    try {
      const workbook = XLSX.utils.book_new();

      const totalUSDT = filteredTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
      const totalBRL = filteredTransactions.reduce((sum, t) => sum + t.brl_amount, 0);
      const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
      const compras = filteredTransactions.filter(t => t.operation_type === 'compra');
      const vendas = filteredTransactions.filter(t => t.operation_type === 'venda');
      const comprasUSDT = compras.reduce((sum, t) => sum + t.usdt_amount, 0);
      const vendasUSDT = vendas.reduce((sum, t) => sum + t.usdt_amount, 0);

      const periodStr = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;

      const summaryData = [
        ['RELATÓRIO DE CLIENTE OFFLINE - TKB ASSET'],
        [''],
        ['Período', periodStr],
        ['Nome', client!.full_name],
        ['Documento', `${client!.document_type}: ${client!.document_number}`],
        ['Email', client!.email || '-'],
        ['Telefone', client!.phone || '-'],
        [''],
        ['RESUMO DO PERÍODO'],
        ['Volume Total USDT', formatUSDT(totalUSDT)],
        ['Volume Total BRL', formatCurrency(totalBRL)],
        ['Cotação Média', `R$ ${formatRate(avgRate)}`],
        ['Total de Operações', filteredTransactions.length],
        [''],
        ['COMPRAS'],
        ['Quantidade de Compras', compras.length],
        ['Volume USDT (Compras)', formatUSDT(comprasUSDT)],
        [''],
        ['VENDAS'],
        ['Quantidade de Vendas', vendas.length],
        ['Volume USDT (Vendas)', formatUSDT(vendasUSDT)],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Resumo');

      const transactionsData = filteredTransactions.map(t => ({
        'Data': new Date(t.transaction_date).toLocaleDateString('pt-BR'),
        'Tipo': t.operation_type.toUpperCase(),
        'USDT': formatUSDT(t.usdt_amount),
        'BRL': formatCurrency(t.brl_amount),
        'Cotação (BRL/USDT)': `R$ ${formatRate(t.usdt_rate)}`,
        'Observações': t.notes || '-',
      }));

      const ws2 = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, ws2, 'Transações');

      const fileName = `relatorio-${client!.full_name.replace(/\s+/g, '-')}-${Date.now()}.xlsx`;
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

  const exportToPDF = (filteredTransactions: OfflineTransaction[], startDate: Date, endDate: Date) => {
    setExportingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      const periodStr = `${startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`.toUpperCase();

      // Header Premium
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 10, 'F');
      
      yPos = 25;
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TKB ASSET', 15, yPos);
      
      yPos += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('RELATÓRIO DE OPERAÇÕES OTC', 15, yPos);
      
      // Período
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(periodStr, pageWidth - 15, 25, { align: 'right' });
      
      yPos = 40;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      
      // Client Info
      yPos += 10;
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
      
      yPos += 8;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('CLIENTE', 20, yPos);
      
      yPos += 6;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(client!.full_name, 20, yPos);
      
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${client!.document_type}: ${client!.document_number}`, 20, yPos);
      
      // Resumo Executivo
      yPos += 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('RESUMO EXECUTIVO', 15, yPos);
      
      yPos += 8;
      const totalUSDT = filteredTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
      const totalBRL = filteredTransactions.reduce((sum, t) => sum + t.brl_amount, 0);
      const avgRate = totalUSDT > 0 ? totalBRL / totalUSDT : 0;
      const compras = filteredTransactions.filter(t => t.operation_type === 'compra');
      const vendas = filteredTransactions.filter(t => t.operation_type === 'venda');
      const totalCompras = compras.reduce((sum, t) => sum + t.usdt_amount, 0);
      const totalVendas = vendas.reduce((sum, t) => sum + t.usdt_amount, 0);
      
      // Metrics Cards
      const cardWidth = (pageWidth - 45) / 4;
      const metrics = [
        { label: 'VOLUME USDT', value: formatUSDT(totalUSDT) },
        { label: 'VOLUME BRL', value: formatCurrency(totalBRL) },
        { label: 'COTAÇÃO MÉDIA', value: `R$ ${formatRate(avgRate)}` },
        { label: 'OPERAÇÕES', value: filteredTransactions.length.toString() }
      ];
      
      metrics.forEach((metric, i) => {
        const x = 15 + (i * (cardWidth + 5));
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(x, yPos, cardWidth, 20, 2, 2, 'S');
        
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.text(metric.label, x + 3, yPos + 5);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(metric.value, x + 3, yPos + 14);
      });
      
      // Compras/Vendas
      yPos += 30;
      pdf.setFillColor(220, 252, 231);
      pdf.setDrawColor(22, 163, 74);
      pdf.rect(15, yPos, (pageWidth - 35) / 2, 20, 'FD');
      
      pdf.setFontSize(7);
      pdf.setTextColor(22, 163, 74);
      pdf.text('COMPRAS', 20, yPos + 5);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatUSDT(totalCompras), 20, yPos + 13);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${compras.length} operações`, 20, yPos + 18);
      
      const xVendas = 15 + (pageWidth - 35) / 2 + 5;
      pdf.setFillColor(255, 237, 213);
      pdf.setDrawColor(234, 88, 12);
      pdf.rect(xVendas, yPos, (pageWidth - 35) / 2, 20, 'FD');
      
      pdf.setTextColor(234, 88, 12);
      pdf.text('VENDAS', xVendas + 5, yPos + 5);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatUSDT(totalVendas), xVendas + 5, yPos + 13);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${vendas.length} operações`, xVendas + 5, yPos + 18);
      
      // Table
      yPos += 30;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('DETALHAMENTO DE OPERAÇÕES', 15, yPos);
      
      yPos += 8;
      // Table header
      pdf.setFillColor(50, 50, 50);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('DATA', 18, yPos + 5);
      pdf.text('TIPO', 45, yPos + 5);
      pdf.text('USDT', 95, yPos + 5, { align: 'right' });
      pdf.text('BRL', 145, yPos + 5, { align: 'right' });
      pdf.text('COTAÇÃO', 190, yPos + 5, { align: 'right' });
      
      yPos += 8;
      
      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      filteredTransactions.forEach((t, index) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(15, yPos, pageWidth - 30, 7, 'F');
        }
        
        pdf.setFontSize(8);
        pdf.text(formatDate(t.transaction_date), 18, yPos + 5);
        
        if (t.operation_type === 'compra') {
          pdf.setTextColor(22, 163, 74);
        } else {
          pdf.setTextColor(234, 88, 12);
        }
        pdf.text(t.operation_type.toUpperCase(), 45, yPos + 5);
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(formatUSDT(t.usdt_amount), 95, yPos + 5, { align: 'right' });
        pdf.text(formatCurrency(t.brl_amount), 145, yPos + 5, { align: 'right' });
        pdf.text(`R$ ${formatRate(t.usdt_rate)}`, 190, yPos + 5, { align: 'right' });
        
        yPos += 7;
      });
      
      // Footer
      const footerY = pageHeight - 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, footerY, pageWidth - 15, footerY);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`TKB Asset © ${new Date().getFullYear()}`, pageWidth / 2, footerY + 5, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Gerado em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, footerY + 9, { align: 'center' });
      pdf.text('DOCUMENTO DE USO INTERNO E CONFIDENCIAL', pageWidth / 2, footerY + 13, { align: 'center' });

      const fileName = `relatorio-${client!.full_name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
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
        <Button
          onClick={() => setIsExportFilterModalOpen(true)}
          disabled={exportingExcel || exportingPDF || transactions.length === 0}
          variant="outline"
        >
          {(exportingExcel || exportingPDF) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar Relatório
        </Button>
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
            <p className="text-2xl font-bold">{formatUSDT(totalUSDT)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Volume Total BRL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBRL)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cotação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {formatRate(avgRate)}</p>
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
            <Button onClick={handleAddTransaction}>
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
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada para o período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
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
                      {formatUSDT(transaction.usdt_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(transaction.brl_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R$ {formatRate(transaction.usdt_rate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              )))}
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
        transactionToEdit={selectedTransaction}
      />

      <OfflineDocumentUploader
        open={isDocumentModalOpen}
        onOpenChange={setIsDocumentModalOpen}
        clientId={clientId!}
        onSuccess={fetchDocuments}
      />

      <ExportFilterModal
        open={isExportFilterModalOpen}
        onOpenChange={setIsExportFilterModalOpen}
        onExport={handleExport}
      />
    </div>
  );
}
