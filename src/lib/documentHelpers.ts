export type DocumentType = 'contrato-quadro' | 'dossie-kyc' | 'politica-pld' | 'termos-de-uso';
export type DocumentStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export const DOCUMENT_DISPLAY_NAMES: Record<DocumentType, string> = {
  'termos-de-uso': 'Termos de Uso e Política de Privacidade',
  'politica-pld': 'Política de Prevenção à Lavagem de Dinheiro (PLD/FTP)',
  'contrato-quadro': 'Contrato-Quadro',
  'dossie-kyc': 'Dossiê KYC/CDD'
};

export const DOCUMENT_ICONS: Record<DocumentType, string> = {
  'termos-de-uso': '📜',
  'politica-pld': '🛡️',
  'contrato-quadro': '📄',
  'dossie-kyc': '🔍'
};

export const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳'
  },
  under_review: {
    label: 'Em Análise',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🔍'
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅'
  },
  rejected: {
    label: 'Reprovado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌'
  }
};

export function getDocumentDisplayName(type: DocumentType): string {
  return DOCUMENT_DISPLAY_NAMES[type] || type;
}

export function getDocumentIcon(type: DocumentType): string {
  return DOCUMENT_ICONS[type] || '📄';
}

export function canUploadDocument(status: DocumentStatus): boolean {
  return status === 'pending' || status === 'rejected';
}

export function getStatusColor(status: DocumentStatus): string {
  return STATUS_CONFIG[status]?.color || '';
}

export function getStatusLabel(status: DocumentStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusIcon(status: DocumentStatus): string {
  return STATUS_CONFIG[status]?.icon || '';
}

export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo inválido. Permitido: PDF, JPG, PNG' };
  }

  return { valid: true };
}

export function getTemplatePath(type: DocumentType): string {
  const paths: Record<DocumentType, string> = {
    'termos-de-uso': '/documents/termos-de-uso.pdf',
    'politica-pld': '/documents/politica-pld.pdf',
    'contrato-quadro': '/documents/templates/contrato-quadro.pdf',
    'dossie-kyc': '/documents/templates/dossie-kyc.pdf'
  };
  return paths[type] || '';
}
