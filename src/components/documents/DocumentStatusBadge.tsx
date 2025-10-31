import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatusColor, getStatusIcon, getStatusLabel, type DocumentStatus } from "@/lib/documentHelpers";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const STATUS_DESCRIPTIONS: Record<DocumentStatus, string> = {
  pending: 'Aguardando envio do documento pelo cliente',
  under_review: 'Documento enviado e em análise pela equipe TKB Asset',
  approved: 'Documento aprovado e validado pela TKB Asset',
  rejected: 'Documento reprovado. Verifique o motivo e reenvie corrigido'
};

export function DocumentStatusBadge({ status, className = '' }: DocumentStatusBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${getStatusColor(status)} ${className}`}>
            <span className="mr-1">{getStatusIcon(status)}</span>
            {getStatusLabel(status)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{STATUS_DESCRIPTIONS[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
