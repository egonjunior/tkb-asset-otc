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