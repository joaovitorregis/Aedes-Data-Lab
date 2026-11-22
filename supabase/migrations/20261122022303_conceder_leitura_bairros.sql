-- Dá ao visitante (anon) e ao usuário logado (authenticated)
-- o privilégio de LER a tabela de bairros.
-- Sem isto, o Postgres barra o acesso antes mesmo de olhar a política de RLS.
grant select on public.neighborhoods to anon, authenticated;