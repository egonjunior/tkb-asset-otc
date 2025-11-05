import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Eye, AlertCircle } from "lucide-react";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentUploader } from "./DocumentUploader";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DocumentStatus } from "@/lib/documentHelpers";

const DOCUMENTS_REQUIRING_SIGNATURE = ['contrato-quadro', 'dossie-kyc'];

interface DocumentCardProps {
  title: string;
  icon: string;
  type: string;
  status: DocumentStatus;
  clientFileUrl?: string | null;
  tkbFileUrl?: string | null;
  rejectionReason?: string | null;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
  onView: (url: string, title: string) => void;
  hideTemplateButton?: boolean;
  customInstruction?: string;
}

export function DocumentCard({
  title,
  icon,
  type,
  status,
  clientFileUrl,
  tkbFileUrl,
  rejectionReason,
  onDownloadTemplate,
  onUpload,
  onView,
  hideTemplateButton = false,
  customInstruction
}: DocumentCardProps) {
  const [showUploader, setShowUploader] = useState(false);

  const canUpload = status === 'pending' || status === 'rejected';
  const isUnderReview = status === 'under_review';
  const isApproved = status === 'approved';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {title}
          </CardTitle>
          <DocumentStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rejectionReason && status === 'rejected' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da reprovação:</strong> {rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {status === 'pending' && !DOCUMENTS_REQUIRING_SIGNATURE.includes(type) && customInstruction && (
          <p className="text-sm text-muted-foreground">
            💡 {customInstruction}
          </p>
        )}

        {status === 'pending' && DOCUMENTS_REQUIRING_SIGNATURE.includes(type) && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📥 <strong>Passo 1:</strong> Baixe a minuta</p>
            <p>✍️ <strong>Passo 2:</strong> Preencha seus dados</p>
            <p>🔏 <strong>Passo 3:</strong> Assine digitalmente (Gov.br ou Certificado Digital)</p>
            <p>📤 <strong>Passo 4:</strong> Anexe o documento assinado</p>
          </div>
        )}

        {isUnderReview && (
          <p className="text-sm text-muted-foreground">
            Seu documento está em análise pela equipe TKB Asset. Você será notificado quando a análise for concluída.
          </p>
        )}

        {isApproved && tkbFileUrl && (
          <p className="text-sm text-muted-foreground">
            Documento aprovado! Faça o download da versão completa assinada pela TKB Asset.
          </p>
        )}

        <TooltipProvider>
          <div className="flex flex-col gap-2">
            {canUpload && !showUploader && (
              <>
                {!hideTemplateButton && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={onDownloadTemplate}
                        className="w-full justify-start"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Minuta
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download do documento em branco para preencher</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowUploader(true)}
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {DOCUMENTS_REQUIRING_SIGNATURE.includes(type) 
                        ? "Anexar Documento Assinado"
                        : "Enviar Documento"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {DOCUMENTS_REQUIRING_SIGNATURE.includes(type)
                        ? "Envie o documento preenchido e assinado"
                        : "Envie o documento solicitado"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

          {canUpload && showUploader && (
            <div className="space-y-2">
              <DocumentUploader
                onFileSelect={async (file) => {
                  await onUpload(file);
                  setShowUploader(false);
                }}
                documentType={type}
              />
              <Button
                variant="ghost"
                onClick={() => setShowUploader(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          )}

            {isUnderReview && clientFileUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => onView(clientFileUrl, title)}
                    className="w-full justify-start"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar Documento Enviado
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver o documento que você enviou</p>
                </TooltipContent>
              </Tooltip>
            )}

            {isApproved && tkbFileUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onView(tkbFileUrl, `${title} - Completo`)}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Documento Completo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download da versão final assinada pela TKB Asset</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
