-- =====================================================================
-- Migration 2 de 7: tabelas da denúncia, com RLS
--
-- Regra central do projeto (ADR-004): dados PÚBLICOS e PRIVADOS ficam em
-- tabelas SEPARADAS. O RLS vale por linha, não por coluna; separar as
-- tabelas é a forma segura de garantir que o visitante nunca receba nome,
-- e-mail, telefone ou o ponto exato.
--
--   reports            dados operacionais        -> só agentes
--   report_private     nome, e-mail, telefone    -> só agentes
--   report_photos      caminhos das fotos        -> só agentes
--   report_visits      visitas dos agentes       -> só agentes
--   report_events      histórico (auditoria)     -> só agentes
--   public_reports     versão do mapa            -> QUALQUER PESSOA (leitura)
--   contact_verifications / rate_limits          -> ninguém pelo navegador
--
-- O navegador NUNCA escreve nessas tabelas. Toda gravação passa por Edge
-- Function, que usa a chave de serviço (ADR-008). Por isso aqui não existe
-- política de insert/update/delete para anon nem authenticated.
-- =====================================================================

-- Sequência do número de protocolo (gerado só pelo servidor).
create sequence public.report_protocol_seq start 1;

-- ---------------------------------------------------------------------
-- reports: a ocorrência, com o que é OPERACIONAL. Só agentes leem.
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),

  -- ID gerado no aparelho a cada tentativa de envio. Se a mesma tentativa
  -- chegar duas vezes (queda de rede, clique duplo), o banco reconhece e
  -- NÃO cria outra denúncia (ADR-007, RF-DEN-04).
  submission_id uuid not null unique,

  -- Comprovante de recebimento. Só é gerado quando a gravação completa foi confirmada.
  protocol text not null unique,

  origin public.report_origin not null,
  -- Agente que criou (quando origin = 'agente'). Nunca vai para o mapa público (D50).
  author_id uuid references auth.users (id) on delete set null,

  -- Ponto EXATO marcado no mapa. Só agentes leem. O mapa público usa a célula da grade.
  location_lat double precision not null check (location_lat between -90 and 90),
  location_lng double precision not null check (location_lng between -180 and 180),
  -- Célula da grade fixa de 200 m (D43, ADR-013), calculada no servidor.
  cell_ix integer not null,
  cell_iy integer not null,

  neighborhood_id bigint not null references public.neighborhoods (id),
  category_id smallint not null references public.categories (id),
  description text not null check (length(trim(description)) between 1 and 1000),

  -- Respostas do formulário do cidadão (iguais às da visita, D53). Só a equipe vê.
  focus_location public.focus_location,
  focus_location_other text check (length(focus_location_other) <= 120),
  water_present boolean,
  containers text[] not null default '{}',
  larvae public.larvae_answer,
  -- "Há quanto tempo percebeu" e "outra evidência": só o cidadão informa (decidido em 16/11/2026).
  noticed_since text check (length(noticed_since) <= 120),
  other_evidence text check (length(other_evidence) <= 500),

  -- Rua, número e referência do local. SÓ para ocorrência feita por agente (RF-AGE-10),
  -- que não tem linha em report_private. Na denúncia de cidadão, o endereço fica
  -- em report_private (dado do morador). Nunca vai para o mapa público.
  place_address text check (length(place_address) <= 200),
  place_reference text check (length(place_reference) <= 200),

  stage public.report_stage not null default 'recebida',
  publication public.publication_state not null default 'pendente',
  -- Por que foi arquivada (obrigatório ao arquivar) e quando (inicia os 30 dias da lixeira).
  archive_reason text check (length(archive_reason) <= 500),
  archived_at timestamptz,
  -- Cada decisão de publicação recebe uma versão, para que uma tarefa antiga
  -- não substitua uma decisão mais recente (ARCHITECTURE 7.4).
  publication_version integer not null default 0,

  -- Tentativas de visita sem acesso. Com 3 ou mais, o agente pode encerrar (RF-AGE-03).
  failed_attempts integer not null default 0 check (failed_attempts >= 0),

  -- Versão para conferir antes de gravar: evita que uma ação concorrente
  -- sobrescreva outra (concorrência otimista, ARCHITECTURE 7.3).
  version integer not null default 1,

  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Coerência: arquivada precisa de data e motivo; as outras não podem ter.
  constraint reports_archive_coherent check (
    (publication = 'arquivada' and archived_at is not null and archive_reason is not null)
    or (publication <> 'arquivada' and archived_at is null)
  ),
  -- Ocorrência de agente tem autor; de cidadão não.
  constraint reports_author_coherent check (
    (origin = 'agente' and author_id is not null) or (origin = 'cidadao')
  ),
  -- Ocorrência de agente precisa dizer onde fica (rua e número).
  constraint reports_agent_place_coherent check (
    origin <> 'agente' or length(trim(coalesce(place_address, ''))) >= 3
  ),
  -- "Outro local" exige o texto digitado.
  constraint reports_focus_other_coherent check (
    focus_location is distinct from 'outro' or focus_location_other is not null
  )
);

create index reports_stage_received_idx on public.reports (stage, received_at);
create index reports_neighborhood_idx on public.reports (neighborhood_id);
create index reports_archived_idx on public.reports (archived_at) where publication = 'arquivada';
create index reports_cell_idx on public.reports (cell_ix, cell_iy);

-- ---------------------------------------------------------------------
-- report_private: dados pessoais do morador. Ocorrência feita por agente
-- NÃO tem linha aqui (RF-AGE-10).
-- ---------------------------------------------------------------------
create table public.report_private (
  report_id uuid primary key references public.reports (id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  -- Telefone com DDD, só dígitos (10 ou 11).
  phone text not null check (phone ~ '^[0-9]{10,11}$'),
  address text not null check (length(trim(address)) between 3 and 200),
  reference text check (length(reference) <= 200),
  -- Qual contato foi confirmado por código, e por qual canal (ADR-006).
  -- Confirmar um não marca o outro como confirmado.
  confirmed_channel public.contact_channel not null,
  confirmed_contact text not null
);

-- ---------------------------------------------------------------------
-- report_photos: de uma a três fotos por ocorrência (RF-DEN-03).
-- original_path = bucket PRIVADO; public_path = bucket PÚBLICO (versão tratada,
-- sem EXIF). public_path fica nulo até o tratamento terminar.
-- ---------------------------------------------------------------------
create table public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  original_path text not null,
  public_path text,
  unique (report_id, position)
);

-- ---------------------------------------------------------------------
-- public_reports: a ÚNICA tabela de denúncia com leitura pública.
-- Só tem o que o PRD autoriza para o mapa. NÃO tem: protocolo, ponto exato,
-- autor, nome, contato, endereço, referência, resultado de visita.
-- Só existe linha aqui enquanto a denúncia está "publicada".
-- ---------------------------------------------------------------------
create table public.public_reports (
  report_id uuid primary key references public.reports (id) on delete cascade,
  neighborhood_id bigint not null references public.neighborhoods (id),
  category_id smallint not null references public.categories (id),
  description text not null,
  received_at timestamptz not null,
  stage public.report_stage not null,
  origin public.report_origin not null,
  -- Célula da grade e o CENTRO dela (é o que o mapa desenha; nunca o ponto exato).
  cell_ix integer not null,
  cell_iy integer not null,
  cell_center_lat double precision not null,
  cell_center_lng double precision not null,
  -- Caminhos das fotos tratadas no bucket público (a primeira aparece na prévia).
  photo_paths text[] not null default '{}'
);

create index public_reports_filters_idx on public.public_reports (neighborhood_id, received_at desc);

-- ---------------------------------------------------------------------
-- report_visits: uma linha por visita do agente. Nunca é pública (PRD 8.1).
-- O ID vem do aparelho, para um reenvio depois de falha não gravar a visita duas vezes.
-- ---------------------------------------------------------------------
create table public.report_visits (
  id uuid primary key,
  report_id uuid not null references public.reports (id) on delete cascade,
  visited_on date not null,
  access public.visit_access not null,
  focus_location public.focus_location,
  focus_location_other text check (length(focus_location_other) <= 120),
  water_present boolean,
  -- Valores permitidos: os do formulário (PRD 8.1). O banco recusa qualquer outro.
  containers text[] not null default '{}' check (
    containers <@ array['pneus','baldes_bacias_caixas','vasos_pratos','piscinas',
                        'lonas_coberturas','lixo_entulho','pocas_alagados',
                        'outro_recipiente','nao_identificado']::text[]
  ),
  larvae public.larvae_answer,
  actions text[] not null default '{}' check (
    actions <@ array['orientacao','deposito_eliminado','larvicida_aplicado',
                     'amostra_coletada','pedido_bloqueio_fumace']::text[]
  ),
  notes text check (length(notes) <= 500),
  author_id uuid not null references auth.users (id),
  created_at timestamptz not null default now(),

  -- Visita COM acesso exige as respostas; SEM acesso só tem data, motivo e observação.
  constraint visits_with_access_complete check (
    access <> 'com_acesso' or (
      focus_location is not null and water_present is not null
      and larvae is not null and cardinality(actions) >= 1
    )
  ),
  constraint visits_no_access_minimal check (
    access = 'com_acesso' or (
      focus_location is null and water_present is null and larvae is null
      and cardinality(containers) = 0 and cardinality(actions) = 0
    )
  ),
  -- Se há água, precisa dizer qual recipiente.
  constraint visits_water_needs_container check (
    water_present is not true or cardinality(containers) >= 1
  ),
  constraint visits_focus_other_coherent check (
    focus_location is distinct from 'outro' or focus_location_other is not null
  )
);

create index report_visits_report_idx on public.report_visits (report_id, visited_on);

-- ---------------------------------------------------------------------
-- report_events: histórico (auditoria). Só se acrescenta; nunca se altera.
-- Autor e horário vêm do servidor, nunca do navegador (SECURITY.md 9).
-- ---------------------------------------------------------------------
create table public.report_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports (id) on delete cascade,
  event_type text not null check (event_type in (
    'recebida','analise_iniciada','observacao','visita_registrada',
    'encerrada_sem_acesso','arquivada','voltou_ao_mapa','correcao','publicada'
  )),
  author_id uuid references auth.users (id) on delete set null,
  reason text check (length(reason) <= 500),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index report_events_report_idx on public.report_events (report_id, created_at);

-- Trava de imutabilidade: nenhum UPDATE em report_events, nem pela chave de serviço.
create or replace function internal.block_event_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'report_events é um histórico: não pode ser alterado';
end;
$$;

create trigger report_events_no_update
  before update on public.report_events
  for each row execute function internal.block_event_update();

-- ---------------------------------------------------------------------
-- Tabelas de apoio, só para as Edge Functions (ninguém pelo navegador).
-- ---------------------------------------------------------------------

-- Códigos de confirmação do contato. Guardamos só o HASH do código, nunca o código.
-- purpose: 'envio' (confirmar contato da denúncia) ou 'correcao' (D42).
create table public.contact_verifications (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('envio', 'correcao')),
  -- Para 'envio': a tentativa de denúncia. Para 'correcao': o protocolo consultado.
  subject text not null,
  channel public.contact_channel not null,
  contact text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  -- Tentativas erradas. Depois do limite, o código é invalidado (RNF-08).
  attempts smallint not null default 0,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_verifications_lookup_idx
  on public.contact_verifications (purpose, subject, created_at desc);

-- Contador de repetição por chave (ex.: "codigo:email:fulano@x.com"). Limita abuso e custo (RNF-08).
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------
-- RLS: liga em TODAS as tabelas. Sem política = ninguém lê.
-- ---------------------------------------------------------------------
alter table public.reports enable row level security;
alter table public.report_private enable row level security;
alter table public.report_photos enable row level security;
alter table public.public_reports enable row level security;
alter table public.report_visits enable row level security;
alter table public.report_events enable row level security;
alter table public.contact_verifications enable row level security;
alter table public.rate_limits enable row level security;

-- Agentes autorizados LEEM as tabelas operacionais (D11: veem a cidade inteira).
-- "(select auth.uid())" dentro de select é a forma recomendada: o Postgres
-- calcula uma vez por consulta, em vez de uma vez por linha.
create policy "agente le reports" on public.reports for select to authenticated
  using (internal.is_agent((select auth.uid())));
create policy "agente le report_private" on public.report_private for select to authenticated
  using (internal.is_agent((select auth.uid())));
create policy "agente le report_photos" on public.report_photos for select to authenticated
  using (internal.is_agent((select auth.uid())));
create policy "agente le report_visits" on public.report_visits for select to authenticated
  using (internal.is_agent((select auth.uid())));
create policy "agente le report_events" on public.report_events for select to authenticated
  using (internal.is_agent((select auth.uid())));

-- Leitura PÚBLICA: só public_reports.
create policy "leitura publica do mapa" on public.public_reports for select
  to anon, authenticated
  using (true);

-- contact_verifications e rate_limits: nenhuma política = nenhum acesso pelo navegador.

-- ---------------------------------------------------------------------
-- Privilégios (a camada GRANT; o RLS acima é a segunda camada).
-- anon NÃO recebe nenhum privilégio nas tabelas privadas: nem chega no RLS.
-- ---------------------------------------------------------------------
grant select on public.reports, public.report_private, public.report_photos,
                public.report_visits, public.report_events to authenticated;
grant select on public.public_reports to anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
