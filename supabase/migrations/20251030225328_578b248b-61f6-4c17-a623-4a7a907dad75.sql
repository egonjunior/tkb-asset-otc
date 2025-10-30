-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Criar tabela de roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Habilitar RLS na tabela de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Criar função de verificação de role com SECURITY DEFINER
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

-- 6. Criar view materializada para estatísticas de usuários
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

-- 7. Criar índices para performance
CREATE INDEX idx_user_stats_volume ON public.user_stats(total_volume DESC);
CREATE INDEX idx_user_stats_orders ON public.user_stats(completed_orders DESC);

-- 8. Habilitar RLS na view
ALTER MATERIALIZED VIEW public.user_stats OWNER TO postgres;

-- 9. Criar função para atualizar a view
CREATE OR REPLACE FUNCTION public.refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Criar trigger para atualizar view automaticamente
CREATE TRIGGER refresh_user_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_user_stats();

-- 11. Atualizar políticas RLS de orders para admins
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 12. Políticas RLS para profiles (admins podem ver todos)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));