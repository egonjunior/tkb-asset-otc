-- Adicionar novos tipos de documento KYC ao enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'kyc-faturamento';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'kyc-cnpj';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'kyc-identificacao';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'kyc-comprovante-residencia';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'kyc-outros';