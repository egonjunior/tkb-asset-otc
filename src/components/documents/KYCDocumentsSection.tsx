import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentCard } from "./DocumentCard";
import { DocumentType, getDocumentDisplayName, getDocumentIcon } from "@/lib/documentHelpers";

interface Document {
  id: string;
  document_type: DocumentType;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  client_file_url?: string;
  tkb_file_url?: string;
  rejection_reason?: string;
  pld_acknowledged?: boolean;
}

interface KYCDocumentsSectionProps {
  documents: Record<string, Document>;
  onUpload: (type: DocumentType, file: File) => Promise<void>;
  onView: (url: string, title: string) => void;
}

const KYC_INSTRUCTIONS: Record<string, string> = {
  'kyc-faturamento': 'Envie o faturamento da empresa com assinatura reconhecida do contador',
  'kyc-cnpj': 'Cartão CNPJ atualizado (emitido nos últimos 90 dias)',
  'kyc-identificacao': 'RG ou CNH frente e verso em arquivo único',
  'kyc-comprovante-residencia': 'Conta de luz, água ou telefone dos últimos 3 meses',
  'kyc-outros': 'Documentos complementares solicitados pelo compliance'
};

export function KYCDocumentsSection({ documents, onUpload, onView }: KYCDocumentsSectionProps) {
  const kycTypes: DocumentType[] = [
    'kyc-faturamento',
    'kyc-cnpj', 
    'kyc-identificacao',
    'kyc-comprovante-residencia',
    'kyc-outros'
  ];

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Dossiê KYC/CDD - Documentos Complementares
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Para compliance completo, envie todos os documentos abaixo
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {kycTypes.map(type => (
          <DocumentCard
            key={type}
            title={getDocumentDisplayName(type)}
            icon={getDocumentIcon(type)}
            type={type}
            status={documents[type]?.status || 'pending'}
            clientFileUrl={documents[type]?.client_file_url}
            tkbFileUrl={documents[type]?.tkb_file_url}
            rejectionReason={documents[type]?.rejection_reason}
            onDownloadTemplate={() => {}}
            onUpload={(file) => onUpload(type, file)}
            onView={onView}
            hideTemplateButton={true}
            customInstruction={KYC_INSTRUCTIONS[type]}
          />
        ))}
      </CardContent>
    </Card>
  );
}
