import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Eye, AlertCircle } from "lucide-react";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentUploader } from "./DocumentUploader";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DocumentStatus } from "@/lib/documentHelpers";

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
  onView
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

        {status === 'pending' && (
          <p className="text-sm text-muted-foreground">
            Faça o download da minuta, preencha e assine o documento, depois anexe o arquivo assinado.
          </p>
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

        <div className="flex flex-col gap-2">
          {canUpload && !showUploader && (
            <>
              <Button
                variant="outline"
                onClick={onDownloadTemplate}
                className="w-full justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Minuta
              </Button>
              <Button
                onClick={() => setShowUploader(true)}
                className="w-full justify-start"
              >
                <Upload className="mr-2 h-4 w-4" />
                Anexar Documento Assinado
              </Button>
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
            <Button
              variant="outline"
              onClick={() => onView(clientFileUrl, title)}
              className="w-full justify-start"
            >
              <Eye className="mr-2 h-4 w-4" />
              Visualizar Documento Enviado
            </Button>
          )}

          {isApproved && tkbFileUrl && (
            <Button
              onClick={() => onView(tkbFileUrl, `${title} - Completo`)}
              className="w-full justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Documento Completo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
