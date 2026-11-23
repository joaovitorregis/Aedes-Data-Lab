-- Cria a tabela dos bairros no esquema "public".
create table public.neighborhoods (
  -- Número gerado pelo banco, identifica cada linha.
  id bigint generated always as identity primary key,
  -- Nome do bairro: não pode ficar vazio nem repetir.
  name text not null unique,
  -- Data de criação, preenchida automaticamente.
  created_at timestamptz not null default now()
);

-- Liga o RLS: a tabela passa a negar tudo, a menos que uma política libere.
alter table public.neighborhoods enable row level security;

-- Política: visitante e usuário logado podem LER todas as linhas.
create policy "leitura publica de bairros"
  on public.neighborhoods
  for select
  to anon, authenticated
  using (true);

-- Os 15 bairros atendidos (PRD D33).
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
