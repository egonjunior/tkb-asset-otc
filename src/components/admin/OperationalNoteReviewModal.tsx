import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateOperationalNotePDF, generateVerificationCode } from "@/lib/generateOperationalNotePDF";

interface BrazilianBankDetails {
  type: "brazilian";
  bank_name: string;
  agency: string;
  account: string;
  account_type: string;
  holder_name: string;
  holder_document: string;
}

interface InternationalBankDetails {
  type: "international";
  bank_name: string;
  bank_address: string;
  swift_code: string;
  account_number: string;
  routing_number: string;
  beneficiary_name: string;
  beneficiary_address: string;
}

type BankDetails = BrazilianBankDetails | InternationalBankDetails | null;

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
  usdt_to_usd_remessa: "USDT → USD (Remessa Internacional)",
};

interface OperationalNoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: OperationalNoteWithProfile;
  onSuccess: () => void;
}

export function OperationalNoteReviewModal({ isOpen, onClose, note, onSuccess }: OperationalNoteReviewModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const formatCurrency = (value: number, currency: string) => {
    if (currency === "BRL") {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get admin profile name
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const reviewedAt = new Date().toISOString();

      // Generate PDF
      const clientData = {
        full_name: note.profiles?.full_name || "N/A",
        document_type: note.profiles?.document_type || "CPF",
        document_number: note.profiles?.document_number || "N/A",
        email: note.profiles?.email || undefined,
      };

      const noteData = {
        note_number: note.note_number,
        operation_type: note.operation_type,
        deposited_amount: note.deposited_amount,
        purchased_amount: note.purchased_amount,
        currency_deposited: note.currency_deposited,
        currency_purchased: note.currency_purchased,
        operation_date: note.operation_date,
        bank_details: note.bank_details as BankDetails,
        verification_code: verificationCode,
        reviewed_at: reviewedAt,
        reviewer_name: adminProfile?.full_name || "Admin TKB",
      };

      const pdfBlob = generateOperationalNotePDF(clientData, noteData);

      // Upload PDF to storage
      const pdfPath = `operational-notes/${note.user_id}/${note.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(pdfPath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update note in database
      const { error: updateError } = await supabase
        .from("operational_notes")
        .update({
          status: "approved",
          pdf_url: pdfPath,
          verification_code: verificationCode,
          reviewed_by: user.id,
          reviewed_at: reviewedAt,
        })
        .eq("id", note.id);

      if (updateError) throw updateError;

      toast({
        title: "Nota aprovada!",
        description: "O PDF foi gerado e disponibilizado para o cliente",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error approving note:", error);
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("operational_notes")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Nota rejeitada",
        description: "O cliente será notificado",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error rejecting note:", error);
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!note.pdf_url) return;

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
    }
  };

  const bankDetails = note.bank_details as BankDetails;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Revisar Nota Operacional
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono">{note.note_number}</Badge>
            <Badge 
              className={
                note.status === "pending" ? "bg-warning text-warning-foreground" :
                note.status === "approved" ? "bg-success text-success-foreground" :
                "bg-destructive text-destructive-foreground"
              }
            >
              {note.status === "pending" ? "Pendente" : note.status === "approved" ? "Aprovada" : "Rejeitada"}
            </Badge>
          </div>

          {/* Client Data */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <h4 className="font-semibold text-sm">Dados do Cliente</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{note.profiles?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{note.profiles?.document_type}</p>
                  <p className="font-medium">{note.profiles?.document_number}</p>
                </div>
                {note.profiles?.email && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{note.profiles.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operation Data */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <h4 className="font-semibold text-sm">Detalhes da Operação</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{OPERATION_LABELS[note.operation_type]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data da Operação</p>
                  <p className="font-medium">{format(new Date(note.operation_date), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Depositado</p>
                  <p className="font-medium">{formatCurrency(note.deposited_amount, note.currency_deposited)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Adquirido</p>
                  <p className="font-medium text-primary">{formatCurrency(note.purchased_amount, note.currency_purchased)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          {bankDetails && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h4 className="font-semibold text-sm">
                  {bankDetails.type === "brazilian" ? "Conta Recebedora" : "Conta Internacional"}
                </h4>
                
                {bankDetails.type === "brazilian" && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Banco</p>
                      <p className="font-medium">{bankDetails.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">{bankDetails.account_type === "corrente" ? "Corrente" : "Poupança"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agência</p>
                      <p className="font-medium">{bankDetails.agency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conta</p>
                      <p className="font-medium">{bankDetails.account}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Titular</p>
                      <p className="font-medium">{bankDetails.holder_name} ({bankDetails.holder_document})</p>
                    </div>
                  </div>
                )}

                {bankDetails.type === "international" && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Bank</p>
                        <p className="font-medium">{bankDetails.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SWIFT/BIC</p>
                        <p className="font-medium">{bankDetails.swift_code}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank Address</p>
                      <p className="font-medium">{bankDetails.bank_address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Account Number</p>
                        <p className="font-medium">{bankDetails.account_number}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Routing Number</p>
                        <p className="font-medium">{bankDetails.routing_number}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Beneficiary</p>
                      <p className="font-medium">{bankDetails.beneficiary_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Beneficiary Address</p>
                      <p className="font-medium">{bankDetails.beneficiary_address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejection reason if rejected */}
          {note.status === "rejected" && note.rejection_reason && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-sm text-destructive">Motivo da Rejeição</h4>
                <p className="text-sm mt-1">{note.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {note.status === "pending" && (
            <>
              {showRejectionForm ? (
                <div className="space-y-3">
                  <Label>Motivo da Rejeição</Label>
                  <Textarea
                    placeholder="Informe o motivo da rejeição..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowRejectionForm(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={isRejecting}
                    >
                      {isRejecting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Rejeição
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setShowRejectionForm(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button 
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Aprovar e Gerar PDF
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Download PDF if approved */}
          {note.status === "approved" && note.pdf_url && (
            <Button className="w-full" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
