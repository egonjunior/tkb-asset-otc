-- Revogar acesso público à materialized view user_stats
-- A view só deve ser acessível internamente por admins, não via API pública
REVOKE ALL ON public.user_stats FROM anon, authenticated;

-- Garantir que apenas o owner (postgres) tenha acesso
GRANT SELECT ON public.user_stats TO postgres;

-- Comentário explicativo
COMMENT ON MATERIALIZED VIEW public.user_stats IS 'View de estatísticas agregadas de usuários - apenas para uso interno/admin';