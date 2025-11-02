-- Criar função SECURITY DEFINER que retorna user_stats apenas para admins
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS SETOF public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem visualizar estatísticas de usuários.';
  END IF;
  
  -- Retornar todos os dados de user_stats
  RETURN QUERY SELECT * FROM public.user_stats;
END;
$$;

-- Conceder acesso à função para authenticated
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;