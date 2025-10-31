-- Adicionar RLS policy para admins lerem todos os comprovantes no bucket receipts
CREATE POLICY "Admins can read all receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);