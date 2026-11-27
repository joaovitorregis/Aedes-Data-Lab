-- Acrescenta o Centro às localidades (PRD D33).
insert into public.neighborhoods (name) values ('Centro')
on conflict (name) do nothing;
