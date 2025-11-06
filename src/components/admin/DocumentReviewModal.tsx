import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onReviewComplete: () => void;
}

export function DocumentReviewModal({ isOpen, onClose, document, onReviewComplete }: DocumentReviewModalProps) {
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [rejectionReason, setRejectionReason] = useState('');
  const [tkbFile, setTkbFile] = useState<File | null>(null);
  const [checklist, setChecklist] = useState({
    allPages: false,
    validSignature: false,
    correctData: false,
    dateField: false
  });
  const [processing, setProcessing] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!document?.id) {
        setLoadingUrl(false);
        return;
      }
      
      setLoadingUrl(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-document`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ documentId: document.id })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao carregar documento');
        }

        const result = await response.json();
        setDocumentUrl(result.signedUrl);
      } catch (error: any) {
        console.error('Error fetching signed URL:', error);
        toast.error('Erro ao carregar documento: ' + error.message);
      } finally {
        setLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [document?.id]);

  const handleDownload = async () => {
    if (!documentUrl) {
      toast.error('Documento ainda carregando...');
      return;
    }
    
    try {
      // Create temporary link element to trigger download
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `documento-${document.document_type}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleApproveOnly = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: null
        })
        .eq('id', document.id);

      if (error) throw error;

      toast.success('Documento aprovado com sucesso');
      onReviewComplete();
      handleClose();
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Erro ao aprovar documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveWithTKB = async () => {
    if (!tkbFile) {
      toast.error('Por favor, anexe o documento assinado pela TKB Asset');
      return;
    }

    setProcessing(true);
    try {
      const fileExt = tkbFile.name.split('.').pop();
      const fileName = `${document.document_type}-tkb-${Date.now()}.${fileExt}`;
      const filePath = `tkb/${document.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, tkbFile);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          tkb_file_url: filePath,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: null
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      toast.success('Documento aprovado com sucesso');
      onReviewComplete();
      handleClose();
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Erro ao aprovar documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.length < 20) {
      toast.error('Por favor, forneça um motivo detalhado para a reprovação (mínimo 20 caracteres)');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', document.id);

      if (error) throw error;

      toast.success('Documento reprovado');
      onReviewComplete();
      onClose();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Erro ao reprovar documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setMode('view');
    setRejectionReason('');
    setTkbFile(null);
    setChecklist({
      allPages: false,
      validSignature: false,
      correctData: false,
      dateField: false
    });
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">
            Revisão de Documento - {document.profiles?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left side - PDF viewer */}
          <div className="flex-1 p-4 md:w-3/5">
            <ScrollArea className="h-full">
              {loadingUrl ? (
                <div className="flex items-center justify-center h-[calc(90vh-200px)]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <iframe
                  src={documentUrl}
                  className="w-full h-[calc(90vh-200px)] border rounded-lg"
                  title="Document preview"
                />
              )}
            </ScrollArea>
          </div>

          {/* Right side - Actions */}
          <div className="md:w-2/5 border-l p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Client Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Informações do Cliente</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Nome:</strong> {document.profiles?.full_name}</p>
                  <p><strong>Documento:</strong> {document.profiles?.document_number}</p>
                  <p><strong>Tipo:</strong> {document.document_type}</p>
                  <p><strong>Enviado em:</strong> {new Date(document.uploaded_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {mode === 'view' && (
                <>
                  {/* Checklist */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Checklist de Validação</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="allPages" 
                          checked={checklist.allPages}
                          onCheckedChange={(checked) => 
                            setChecklist(prev => ({ ...prev, allPages: checked as boolean }))
                          }
                        />
                        <Label htmlFor="allPages" className="text-sm cursor-pointer">
                          Todas as páginas presentes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="validSignature"
                          checked={checklist.validSignature}
                          onCheckedChange={(checked) => 
                            setChecklist(prev => ({ ...prev, validSignature: checked as boolean }))
                          }
                        />
                        <Label htmlFor="validSignature" className="text-sm cursor-pointer">
                          Assinatura legível e válida
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="correctData"
                          checked={checklist.correctData}
                          onCheckedChange={(checked) => 
                            setChecklist(prev => ({ ...prev, correctData: checked as boolean }))
                          }
                        />
                        <Label htmlFor="correctData" className="text-sm cursor-pointer">
                          Dados corretos e completos
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="dateField"
                          checked={checklist.dateField}
                          onCheckedChange={(checked) => 
                            setChecklist(prev => ({ ...prev, dateField: checked as boolean }))
                          }
                        />
                        <Label htmlFor="dateField" className="text-sm cursor-pointer">
                          Data preenchida corretamente
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="w-full justify-start"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Documento
                    </Button>
                    <Button
                      onClick={handleApproveOnly}
                      disabled={processing}
                      className="w-full justify-start bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => setMode('approve')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprovar e Anexar TKB
                    </Button>
                    <Button
                      onClick={() => setMode('reject')}
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reprovar Documento
                    </Button>
                  </div>
                </>
              )}

              {mode === 'approve' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">Aprovar e Anexar TKB</h3>
                  <p className="text-sm text-muted-foreground">
                    Anexe o documento assinado pela TKB Asset para concluir a aprovação.
                  </p>
                  <DocumentUploader
                    onFileSelect={async (file) => setTkbFile(file)}
                    documentType="tkb"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApproveWithTKB}
                      disabled={!tkbFile || processing}
                      className="flex-1"
                    >
                      Confirmar Aprovação
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMode('view')}
                      disabled={processing}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'reject' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-600">Reprovar Documento</h3>
                  <p className="text-sm text-muted-foreground">
                    Descreva detalhadamente o motivo da reprovação para que o cliente possa corrigir.
                  </p>
                  <Textarea
                    placeholder="Motivo da reprovação (mínimo 20 caracteres)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejectionReason.length < 20 || processing}
                      className="flex-1"
                    >
                      Confirmar Reprovação
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMode('view')}
                      disabled={processing}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
