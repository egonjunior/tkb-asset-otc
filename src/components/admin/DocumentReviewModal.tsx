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
import { Download, CheckCircle2, XCircle, Loader2, ExternalLink, FileText, AlertTriangle, Eye } from "lucide-react";

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onReviewComplete: () => void;
}

export function DocumentReviewModal({ isOpen, onClose, document: docData, onReviewComplete }: DocumentReviewModalProps) {
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
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!docData?.id) {
        setLoadingUrl(false);
        return;
      }

      setLoadingUrl(true);
      try {
        // Tentar via Edge Function primeiro
        const { data, error } = await supabase.functions.invoke('get-document', {
          body: { documentId: docData.id }
        });

        if (error || !data?.signedUrl) {
          console.warn('Edge Function failed or missing, trying direct storage access...', error);

          // Fallback: Acesso direto ao storage (funciona agora que o Egon é admin e o RLS permite)
          const filePath = docData.client_file_url;
          if (!filePath) throw new Error('Caminho do arquivo não encontrado');

          const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

          const { data: directData, error: storageError } = await supabase.storage
            .from('documents')
            .createSignedUrl(cleanPath, 3600);

          if (storageError) throw storageError;
          setDocumentUrl(directData.signedUrl);
        } else {
          setDocumentUrl(data.signedUrl);
        }

        // Detect if it's an image
        const url = docData.client_file_url || "";
        const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
        setIsImage(isImg);

      } catch (error: any) {
        console.error('Error fetching document URL:', error);
        toast.error('Erro ao carregar documento: ' + (error.message || 'Erro de permissão'));
      } finally {
        setLoadingUrl(false);
      }
    };

    if (isOpen) {
      fetchSignedUrl();
    }
  }, [docData?.id, isOpen]);

  const handleDownload = async () => {
    if (!documentUrl) {
      toast.error('Documento ainda carregando...');
      return;
    }
    window.open(documentUrl, '_blank');
  };

  const handleApproveOnly = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: null
        })
        .eq('id', docData.id);

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
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = tkbFile.name.split('.').pop();
      const fileName = `${docData.document_type}-tkb-${Date.now()}.${fileExt}`;
      const filePath = `tkb/${docData.user_id}/${fileName}`;

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
          reviewed_by: user?.id,
          rejection_reason: null
        })
        .eq('id', docData.id);

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
    if (!rejectionReason.trim() || rejectionReason.length < 10) {
      toast.error('Por favor, forneça um motivo para a reprovação');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', docData.id);

      if (error) throw error;

      toast.success('Documento reprovado');
      onReviewComplete();
      handleClose();
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
    setDocumentUrl('');
    onClose();
  };

  if (!docData) return null;

  const clientName = Array.isArray(docData.profiles) ? docData.profiles[0]?.full_name : docData.profiles?.full_name || 'Sem nome';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[92vh] flex flex-col p-0 bg-black border-white/10 overflow-hidden outline-none">
        <DialogHeader className="px-8 py-6 border-b border-white/5 bg-white/[0.01] shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#00D4FF]" />
                Protocolo de Revisão Compliance
              </DialogTitle>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">Secure Document Validation Interface</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left side - Document Preview */}
          <div className="flex-1 p-8 bg-[#050505] relative flex flex-col group/preview">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 via-transparent to-transparent opacity-30 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Visualização de Ativo</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 border-white/5 bg-white/5 hover:bg-[#00D4FF] hover:text-black transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Abrir Original
                </Button>
              </div>
            </div>

            <div className="flex-1 relative rounded-2xl border border-white/5 bg-black/40 overflow-hidden shadow-2xl">
              {loadingUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-[#00D4FF]" />
                    <div className="absolute inset-0 blur-xl bg-[#00D4FF]/20 animate-pulse" />
                  </div>
                  <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">Descriptografando Documento...</p>
                </div>
              ) : documentUrl ? (
                isImage ? (
                  <div className="h-full w-full p-4 overflow-auto flex items-center justify-center">
                    <img src={documentUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-blue-500/10" />
                  </div>
                ) : (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full border-none"
                    title="Document preview"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-white/10 italic">
                  <AlertTriangle className="h-16 w-16 mb-2 opacity-5" />
                  <p>Incapaz de projetar o ativo visual.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions/Panel */}
          <div className="md:w-[450px] border-l border-white/5 p-8 overflow-y-auto bg-black shrink-0">
            <div className="space-y-10">
              {/* Profile Card */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/20">
                    <Eye className="h-6 w-6 text-[#00D4FF]" />
                  </div>
                  <div>
                    <h5 className="text-sm font-mono text-white/20 uppercase tracking-widest">Perfil Custodiante</h5>
                    <p className="text-xl font-bold text-white tracking-tight">{clientName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden font-mono">
                  <div className="bg-black/40 p-4">
                    <p className="text-[9px] uppercase text-white/20 mb-1">Fiscal ID</p>
                    <p className="text-xs text-white truncate">{Array.isArray(docData.profiles) ? docData.profiles[0]?.document_number : docData.profiles?.document_number || 'Sem documento'}</p>
                  </div>
                  <div className="bg-black/40 p-4">
                    <p className="text-[9px] uppercase text-white/20 mb-1">Asset Type</p>
                    <p className="text-xs text-tkb-cyan truncate capitalize">{docData.document_type.replace(/-/g, ' ')}</p>
                  </div>
                </div>
              </div>

              {mode === 'view' && (
                <>
                  {/* Validation Checklist */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-tkb-cyan font-bold border-l-2 border-tkb-cyan pl-4">Critérios de Validação</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'allPages', label: 'Conformidade de Páginas' },
                        { id: 'validSignature', label: 'Autenticidade de Assinatura' },
                        { id: 'correctData', label: 'Integridade de Dados' },
                        { id: 'dateField', label: 'Validade Temporal' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 transition-all cursor-pointer group/check"
                          onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof checklist] }))}
                        >
                          <Label className="text-xs text-white/60 group-hover/check:text-white transition-colors cursor-pointer">{item.label}</Label>
                          <Checkbox
                            id={item.id}
                            className="h-5 w-5 border-white/10 data-[state=checked]:bg-[#00D4FF] data-[state=checked]:border-[#00D4FF] rounded-md transition-all"
                            checked={checklist[item.id as keyof typeof checklist]}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="space-y-3 pt-6">
                    <Button
                      onClick={handleApproveOnly}
                      disabled={processing || !Object.values(checklist).every(v => v)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest h-12 shadow-[0_10px_30px_rgba(16,185,129,0.2)] disabled:opacity-20 transition-all"
                    >
                      {processing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
                        <><CheckCircle2 className="mr-2 h-4 w-4" /> Validar Ativo</>
                      )}
                    </Button>
                    {docData.document_type.includes('contrato') && (
                      <Button
                        onClick={() => setMode('approve')}
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5 h-12 uppercase text-[10px] font-bold tracking-widest"
                      >
                        <ExternalLink className="mr-2 h-4 w-4 text-[#00D4FF]" />
                        Anexar Certificado TKB
                      </Button>
                    )}
                    <Button
                      onClick={() => setMode('reject')}
                      variant="destructive"
                      className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white h-12 uppercase text-[10px] font-bold tracking-widest transition-all"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Protocolar Rejeição
                    </Button>
                  </div>
                </>
              )}

              {mode === 'approve' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <h3 className="font-bold text-emerald-500 text-sm mb-1 uppercase tracking-wider">Aprovação Master</h3>
                    <p className="text-[10px] text-emerald-500/60 leading-relaxed font-light">
                      Submeta o documento autenticado pela TKB Asset para concluir o fluxo de conformidade deste ativo.
                    </p>
                  </div>
                  <div className="p-1 bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
                    <DocumentUploader
                      onFileSelect={async (file) => setTkbFile(file)}
                      documentType="tkb"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApproveWithTKB}
                      disabled={!tkbFile || processing}
                      className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase text-[10px] h-12"
                    >
                      Confirmar Envio
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMode('view')}
                      disabled={processing}
                      className="px-6 text-white/40 hover:text-white"
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'reject' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <h3 className="font-bold text-red-500 text-sm mb-1 uppercase tracking-wider">Protocolo de Rejeição</h3>
                    <p className="text-[10px] text-red-500/60 leading-relaxed font-light">
                      Especifique a inconsistência detectada. O cliente receberá uma notificação instantânea para regularização.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Especifique o motivo técnico da rejeição..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={8}
                    className="bg-black border-white/10 text-white focus:border-red-500 focus:ring-red-500/10 transition-all text-sm leading-relaxed p-4 rounded-xl"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejectionReason.length < 10 || processing}
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 font-bold uppercase text-[10px] h-12"
                    >
                      Confirmar Rejeição
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMode('view')}
                      disabled={processing}
                      className="px-6 text-white/40 hover:text-white"
                    >
                      Voltar
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
