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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documentId: doc.id, fileType })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao obter documento');
      }

      const { signedUrl } = await response.json();
      
      // Download
      const link = document.createElement('a');
      link.href = signedUrl;
      const suffix = fileType === 'tkb' ? '-TKB' : '';
      link.download = `${documentTypeLabels[doc.document_type] || doc.document_type}${suffix}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download iniciado');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento: ' + error.message);
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
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl">
              Documentos de {user.full_name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {user.document_number}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Progress Section */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progresso de Revisão</span>
                    <span className="text-muted-foreground">
                      {approvedCount}/{user.total_count} documentos aprovados
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <div className="space-y-3">
              {user.documents
                .sort((a, b) => {
                  // Pendentes primeiro
                  const statusOrder = { 'pending': 0, 'under_review': 1, 'rejected': 2, 'approved': 3 };
                  return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                })
                .map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h4 className="font-semibold text-base">
                                {documentTypeLabels[doc.document_type] || doc.document_type}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <DocumentStatusBadge status={doc.status} />
                          </div>

                          {doc.rejection_reason && (
                            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                              <p className="text-sm text-destructive">
                                <strong>Motivo da reprovação:</strong> {doc.rejection_reason}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {(doc.status === 'pending' || doc.status === 'under_review') && (
                              <Button
                                size="sm"
                                onClick={() => handleReview(doc)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Revisar
                              </Button>
                            )}
                            
                            {doc.status === 'approved' && (
                              <>
                                {doc.tkb_file_url ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    ✓ Com documento TKB
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAttachTKB(doc)}
                                    className="border-primary text-primary hover:bg-primary/10"
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Anexar TKB
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(doc, 'client')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar Cliente
                            </Button>
                            
                            {doc.status === 'approved' && doc.tkb_file_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc, 'tkb')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Baixar TKB
                              </Button>
                            )}
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
