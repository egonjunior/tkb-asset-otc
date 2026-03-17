import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DocumentReviewModal } from "./DocumentReviewModal";
import { TKBUploadModal } from "./TKBUploadModal";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { FileText, Eye, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface UserDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDocuments;
  onReviewComplete: () => void;
}

const documentTypeLabels: Record<string, string> = {
  'contrato-quadro': 'Contrato-Quadro',
  'dossie-kyc': 'Dossiê KYC (antigo)',
  'kyc-faturamento': 'KYC - Faturamento',
  'kyc-cnpj': 'KYC - CNPJ',
  'kyc-identificacao': 'KYC - Identificação',
  'kyc-comprovante-residencia': 'KYC - Comprovante de Residência',
  'kyc-outros': 'KYC - Outros'
};

export function UserDocumentsModal({ isOpen, onClose, user, onReviewComplete }: UserDocumentsModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [tkbUploadModalOpen, setTkbUploadModalOpen] = useState(false);

  const approvedCount = user.documents.filter(doc => doc.status === 'approved').length;
  const progressPercent = (approvedCount / user.total_count) * 100;

  const handleDownload = async (doc: AdminDocument, fileType: 'client' | 'tkb' = 'client') => {
    try {
      // Tentar via Edge Function primeiro
      const { data, error } = await supabase.functions.invoke('get-document', {
        body: { documentId: doc.id, fileType }
      });

      let signedUrl = data?.signedUrl;

      if (error || !signedUrl) {
        console.warn('Edge Function failed, trying direct storage...', error);
        const filePath = fileType === 'tkb' ? doc.tkb_file_url : doc.client_file_url;
        if (!filePath) throw new Error('Caminho do arquivo não encontrado');

        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .createSignedUrl(cleanPath, 3600);

        if (storageError) throw storageError;
        signedUrl = storageData.signedUrl;
      }

      // Trigger download using the signed URL
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Acesso concedido');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleAttachTKB = (doc: AdminDocument) => {
    setSelectedDocument(doc);
    setTkbUploadModalOpen(true);
  };

  const handleReview = (doc: AdminDocument) => {
    setSelectedDocument(doc);
    setReviewModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-black border-white/10 outline-none overflow-hidden">
          <DialogHeader className="px-8 py-6 border-b border-white/5 bg-white/[0.01] shrink-0">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#00D4FF]" />
                Dossiê de Conformidade
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">{user.full_name}</p>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">{user.document_number}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#050505]">
            {/* Progress Section */}
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#00D4FF]/10 transition-all duration-500" />
              <CardContent className="pt-8 pb-8 px-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-tkb-cyan">Status de Revisão</p>
                      <h4 className="text-sm font-light text-white/60">Auditando <span className="text-white font-bold">{user.total_count} assets</span> institucionais</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white tracking-tighter">{Math.round(progressPercent)}%</p>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{approvedCount} de {user.total_count} validados</p>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20 pl-1">Massa de Dados Processada</h3>
              {user.documents
                .sort((a, b) => {
                  const statusOrder = { 'pending': 0, 'under_review': 1, 'rejected': 2, 'approved': 3 };
                  return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                })
                .map((doc) => (
                  <Card key={doc.id} className="bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group border border-white/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 p-4 bg-white/[0.03] rounded-2xl border border-white/5 group-hover:bg-[#00D4FF]/10 group-hover:border-[#00D4FF]/20 transition-colors">
                          <FileText className="h-6 w-6 text-white/40 group-hover:text-[#00D4FF]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div>
                              <h4 className="font-bold text-lg text-white tracking-tight group-hover:text-[#00D4FF] transition-colors">
                                {documentTypeLabels[doc.document_type] || doc.document_type}
                              </h4>
                              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">
                                Ingresso em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <DocumentStatusBadge status={doc.status} />
                          </div>

                          {doc.rejection_reason && (
                            <div className="mt-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl relative overflow-hidden group/alert">
                              <div className="absolute left-0 top-0 h-full w-1 bg-red-500/40" />
                              <p className="text-xs text-red-500/80 leading-relaxed">
                                <span className="font-black uppercase text-[9px] mr-2 text-red-500/60 font-mono tracking-widest">Inconsistência:</span>
                                {doc.rejection_reason}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 mt-6">
                            {(doc.status === 'pending' || doc.status === 'under_review') && (
                              <Button
                                size="sm"
                                onClick={() => handleReview(doc)}
                                className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-black uppercase text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-[#00D4FF]/10 transition-all"
                              >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Auditoria
                              </Button>
                            )}

                            {doc.status === 'approved' && (
                              <>
                                {doc.tkb_file_url ? (
                                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Certificado Ativo</span>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAttachTKB(doc)}
                                    className="border-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF]/10 h-10 px-6 uppercase text-[10px] font-bold tracking-widest"
                                  >
                                    <Upload className="h-3.5 w-3.5 mr-2" />
                                    Vincular TKB
                                  </Button>
                                )}
                              </>
                            )}

                            <div className="flex gap-2 ml-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc, 'client')}
                                className="bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10 h-10 px-4"
                                title="Baixar Original"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              {doc.status === 'approved' && doc.tkb_file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(doc, 'tkb')}
                                  className="bg-[#00D4FF]/5 border-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 h-10 px-4"
                                  title="Baixar Certificado"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedDocument && (
        <>
          <DocumentReviewModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
            onReviewComplete={() => {
              onReviewComplete();
              setReviewModalOpen(false);
              setSelectedDocument(null);
            }}
          />

          <TKBUploadModal
            isOpen={tkbUploadModalOpen}
            onClose={() => {
              setTkbUploadModalOpen(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
            onUploadComplete={() => {
              onReviewComplete();
              setTkbUploadModalOpen(false);
              setSelectedDocument(null);
            }}
          />
        </>
      )}
    </>
  );
}
