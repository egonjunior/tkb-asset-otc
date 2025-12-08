-- Migração: Popular emails na tabela profiles a partir de auth.users
-- Atualiza todos os profiles que não têm email com o email do auth.users

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id 
  AND (p.email IS NULL OR p.email = '');

-- Atualizar o trigger handle_new_user para incluir o email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, document_type, document_number, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'CPF'),
    COALESCE(NEW.raw_user_meta_data->>'document_number', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;