

# Correção: RLS do Storage para Notas Operacionais

## Problema Identificado

O erro **"new row violates row-level security policy"** está ocorrendo na tabela `storage.objects`, não na tabela `operational_notes`.

Quando o admin aprova uma nota, o código tenta fazer upload do PDF no path:
```
operational-notes/{user_id}/{note_id}.pdf
```

Porém, a política de storage atual só permite que admins façam upload em paths que começam com `tkb/`:
```sql
(bucket_id = 'documents') AND (storage.foldername(name))[1] = 'tkb'
```

## Solução

Criar novas políticas RLS para o bucket `documents` permitindo:
1. **Admins** fazerem upload em `operational-notes/`
2. **Usuários** lerem seus próprios arquivos em `operational-notes/{seu_user_id}/`

## Migração SQL

```sql
-- Política para admins fazerem upload de notas operacionais
CREATE POLICY "Admins can upload operational notes PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'operational-notes'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para usuários lerem suas próprias notas operacionais
CREATE POLICY "Users can view own operational notes PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'operational-notes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Política para admins visualizarem todas as notas operacionais
CREATE POLICY "Admins can view all operational notes PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'operational-notes'
  AND has_role(auth.uid(), 'admin'::app_role)
);
```

## Resultado Esperado

Após aplicar a migração:
- Admin poderá aprovar notas e fazer upload do PDF
- Usuário poderá baixar o PDF da sua nota aprovada
- Admin poderá visualizar/baixar qualquer PDF de nota operacional

