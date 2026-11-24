-- Cria a tabela dos bairros no esquema "public", o que a API do Supabase expõe.
create table public.neighborhoods (
  -- Número que o banco gera sozinho (1, 2, 3...) e que identifica cada linha.
  id bigint generated always as identity primary key,
  -- Nome do bairro: não pode ficar vazio nem repetir.
  name text not null unique,
  -- Data e hora de criação, preenchida automaticamente.
  created_at timestamptz not null default now()
);

-- Liga a segurança por linha (RLS).
-- Com ela ligada, a tabela nega tudo, a não ser que uma política libere.
alter table public.neighborhoods enable row level security;

-- Política: qualquer visitante (anon) ou usuário logado (authenticated)
-- pode LER (select) todas as linhas. Não libera inserir, alterar nem apagar.
create policy "leitura publica de bairros"
  on public.neighborhoods
  for select
  to anon, authenticated
  using (true);

-- Os 15 bairros atendidos, conforme o PRD (D33). Não existe "Centro".
-- Ficam na migration porque são dados fixos que a produção também precisa.
insert into public.neighborhoods (name) values
  ('Altiplano'),
  ('Boa Vista'),
  ('Gildo Andrade'),
  ('Jardim Bela Vista'),
  ('Loteamento Figueiredo'),
  ('Luís Gonzaga'),
  ('Maracujá'),
  ('Novo Itambé'),
  ('Novo Itambé II'),
  ('Parque das Palmeiras'),
  ('Pedra Bela'),
  ('Planalto'),
  ('Salgadeira'),
  ('Santa Maria'),
  ('Vila Cohab');