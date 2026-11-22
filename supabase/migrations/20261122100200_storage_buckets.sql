-- =====================================================================
-- Migration 3 de 7: buckets de fotos (Supabase Storage)
--
-- Dois depósitos com regras diferentes (ADR-003, SECURITY.md seções 4 e 5):
--
--   fotos-originais  PRIVADO. Guarda a foto como o cidadão enviou.
--                    Só agentes leem. Ninguém grava pelo navegador.
--   fotos-publicas   PÚBLICO. Guarda só a versão tratada (sem EXIF, ou seja,
--                    sem coordenadas nem dados da câmera). Qualquer pessoa
--                    abre a foto pelo endereço, mas NÃO consegue listar a pasta.
--
-- O upload é feito pela Edge Function com a chave de serviço, que confere
-- tipo, tamanho e renomeia o arquivo. Por isso não há política de INSERT
-- para anon nem authenticated.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Limite de 10 MiB por foto e só imagens. Os valores finais saem de DEP-03.
  ('fotos-originais', 'fotos-originais', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('fotos-publicas',  'fotos-publicas',  true,  10485760,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Só agentes ativos leem os ORIGINAIS.
create policy "agente le fotos originais"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fotos-originais'
    and internal.is_agent((select auth.uid()))
  );

-- Para fotos-publicas não existe política de SELECT de propósito:
-- bucket público serve o arquivo pelo endereço direto, e sem política ninguém
-- consegue LISTAR todos os arquivos. Arquivar uma denúncia apaga a foto daqui
-- (a Edge Function faz isso), então o endereço antigo deixa de funcionar
-- (ARCHITECTURE 7.4).
