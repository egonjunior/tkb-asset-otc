-- Criar índice único na materialized view user_stats para permitir refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS user_stats_user_id_idx 
ON public.user_stats (user_id);

-- Fazer refresh inicial da view com o novo índice
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;