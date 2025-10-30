-- 1. Criar função de verificação de role com SECURITY DEFINER usando o tipo correto
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Criar view materializada para estatísticas de usuários
DROP MATERIALIZED VIEW IF EXISTS public.user_stats CASCADE;
CREATE MATERIALIZED VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.document_type,
  p.document_number,
  p.created_at as registered_at,
  COUNT(o.id) FILTER (WHERE o.status = 'completed') as completed_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'paid') as paid_orders,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'completed'), 0) as total_volume,
  COALESCE(AVG(o.total) FILTER (WHERE o.status = 'completed'), 0) as avg_ticket,
  MAX(o.created_at) as last_order_date
FROM public.profiles p
LEFT JOIN public.orders o ON o.user_id = p.id
GROUP BY p.id, p.full_name, p.document_type, p.document_number, p.created_at;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_stats_volume ON public.user_stats(total_volume DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_orders ON public.user_stats(completed_orders DESC);

-- 4. Criar função para atualizar a view
CREATE OR REPLACE FUNCTION public.refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Criar trigger para atualizar view automaticamente
DROP TRIGGER IF EXISTS refresh_user_stats_trigger ON public.orders;
CREATE TRIGGER refresh_user_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_user_stats();

-- 6. Atualizar políticas RLS de orders para admins
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Políticas RLS para profiles (admins podem ver todos)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));