import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Clock, CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OperationalNoteReviewModal } from "@/components/admin/OperationalNoteReviewModal";

interface OperationalNoteWithProfile {
  id: string;
  note_number: string;
  user_id: string;
  operation_type: string;
  deposited_amount: number;
  purchased_amount: number;
  currency_deposited: string;
  currency_purchased: string;
  operation_date: string;
  bank_details: any;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  pdf_url: string | null;
  verification_code: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    document_type: string;
    document_number: string;
    email: string | null;
  };
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

const AdminOperationalNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<OperationalNoteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<OperationalNoteWithProfile | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from("operational_notes")
        .select(`
          *,
          profiles!operational_notes_user_id_fkey (
            full_name,
            document_type,
            document_number,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes((data || []) as OperationalNoteWithProfile[]);
    } catch (error) {
      console.error("Error fetching operational notes:", error);
      toast({
        title: "Erro ao carregar notas",
        description: "Não foi possível carregar as notas operacionais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [statusFilter]);

  const handleReview = (note: OperationalNoteWithProfile) => {
    setSelectedNote(note);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    fetchNotes();
    setIsReviewModalOpen(false);
    setSelectedNote(null);
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === "BRL") {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const pendingCount = notes.filter((n) => n.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Notas Operacionais</h1>
                <p className="text-xs text-muted-foreground">Aprovar e rejeitar solicitações</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-warning text-warning-foreground">
                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Filtrar por status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="approved">Aprovadas</SelectItem>
                      <SelectItem value="rejected">Rejeitadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Todas as Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma nota operacional encontrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valores</TableHead>
                        <TableHead>Data Op.</TableHead>
                        <TableHead>Solicitado em</TableHead>
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
                            <TableCell className="font-mono text-sm">{note.note_number}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{note.profiles?.full_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {note.profiles?.document_type}: {note.profiles?.document_number}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {OPERATION_LABELS[note.operation_type] || note.operation_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="space-y-1">
                                <p className="text-muted-foreground">
                                  {formatCurrency(note.deposited_amount, note.currency_deposited)}
                                </p>
                                <p className="font-medium">
                                  → {formatCurrency(note.purchased_amount, note.currency_purchased)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(note.operation_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => handleReview(note)}>
                                <Eye className="h-4 w-4 mr-1" />
                                {note.status === "pending" ? "Revisar" : "Ver"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Review Modal */}
      {selectedNote && (
        <OperationalNoteReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          note={selectedNote}
          onSuccess={handleReviewComplete}
        />
      )}
    </div>
  );
};

export default AdminOperationalNotes;
