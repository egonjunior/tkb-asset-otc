-- 1. Garantir que a função has_role seja robusta
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- 2. Corrigir políticas RLS para PROFILES (Permissão Total para Admins)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Corrigir políticas RLS para DOCUMENTS
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
CREATE POLICY "Admins can update all documents"
ON public.documents FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Corrigir políticas de STORAGE para o bucket 'documents'
-- Remover as políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Admins can view all documents in storage" ON storage.objects;
CREATE POLICY "Admins can view all documents in storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can upload TKB documents" ON storage.objects;
CREATE POLICY "Admins can upload TKB documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update their uploads" ON storage.objects;
CREATE POLICY "Admins can update any document"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- 5. Garantir que a tabela user_roles seja visível para admins
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
