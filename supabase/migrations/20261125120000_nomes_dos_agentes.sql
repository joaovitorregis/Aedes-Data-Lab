-- Nomes dos agentes para o histórico da ocorrência (RF-AGE-01: "o nome de quem fez cada passo").
-- A tabela profiles continua fechada: cada pessoa lê só a própria linha. Esta função
-- entrega, apenas a um agente ativo, o par identificador → nome, e nada mais.
-- Inclui agentes desativados, porque os passos antigos deles seguem no histórico.
create or replace function public.agent_profile_names()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform internal.require_agent((select auth.uid()));
  return coalesce(
    (select jsonb_object_agg(p.id, p.display_name) from public.profiles p),
    '{}'::jsonb);
end;
$$;

revoke all on function public.agent_profile_names() from public, anon;
grant execute on function public.agent_profile_names() to authenticated, service_role;
