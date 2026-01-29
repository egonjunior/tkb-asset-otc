import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OperationalNote {
  id: string;
  note_number: string;
  operation_type: string;
  deposited_amount: number;
  purchased_amount: number;
  currency_deposited: string;
  currency_purchased: string;
  operation_date: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  pdf_url: string | null;
  created_at: string;
}

const OPERATION_LABELS: Record<string, string> = {
  brl_to_usdt: "BRL → USDT",
  usdt_to_brl: "USDT → BRL",
  usdt_to_usd_remessa: "USDT → USD",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", className: "bg-warning text-warning-foreground", icon: Clock },
  approved: { label: "Aprovada", className: "bg-success text-success-foreground", icon: CheckCircle2 },
  rejected: { label: "Rejeitada", className: "bg-destructive text-destructive-foreground", icon: XCircle },
};

interface OperationalNotesListProps {
  refreshTrigger?: number;
}

export function OperationalNotesList({ refreshTrigger }: OperationalNotesListProps) {
  const [notes, setNotes] = useState<OperationalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("operational_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes((data || []) as OperationalNote[]);
    } catch (error) {
      console.error("Error fetching operational notes:", error);
      toast({
        title: "Erro ao carregar notas",
        description: "Não foi possível carregar suas notas operacionais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [refreshTrigger]);

  const handleDownloadPDF = async (note: OperationalNote) => {
    if (!note.pdf_url) {
      toast({
        title: "PDF não disponível",
        description: "O PDF ainda não foi gerado para esta nota",
        variant: "destructive",
      });
      return;
    }

    setDownloadingId(note.id);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(note.pdf_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.note_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível baixar o documento",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === "BRL") {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return null; // Don't show anything if there are no notes
  }

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Minhas Notas Operacionais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Data Operação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => {
                const statusConfig = STATUS_CONFIG[note.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {note.note_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{OPERATION_LABELS[note.operation_type] || note.operation_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          {formatCurrency(note.deposited_amount, note.currency_deposited)} →
                        </p>
                        <p className="font-medium">
                          {formatCurrency(note.purchased_amount, note.currency_purchased)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(note.operation_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {note.status === "rejected" && note.rejection_reason && (
                        <p className="text-xs text-destructive mt-1">{note.rejection_reason}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {note.status === "approved" && note.pdf_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(note)}
                          disabled={downloadingId === note.id}
                        >
                          {downloadingId === note.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
