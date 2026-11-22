# Back-end (Supabase): guia explicado

Este guia explica o back-end do Aedes Data Lab: o que existe, por que foi feito assim, como rodar os testes e como colocar no ar. Foi escrito para quem está aprendendo: cada parte diz **o que faz** e **por quê**. As decisões de fundo estão em [DECISIONS.md](./DECISIONS.md) (ADR-004, 007, 008, 015, 017) e as regras de segurança em [SECURITY.md](./SECURITY.md).

Tudo está na pasta `supabase/`:

```
supabase/
  config.toml          configuração das Edge Functions e do projeto local
  migrations/          o banco, em ordem (cada arquivo = um passo)
  seed.sql             dados FICTÍCIOS, só para teste local (nunca vai ao banco real)
  functions/           Edge Functions (código Deno/TypeScript)
    _shared/           peças usadas por várias funções
    tests/             teste de ponta a ponta das funções
  tests/               testes do banco (rodam sem Docker)
```

## 1. A ideia geral em 5 linhas

1. O navegador **só lê** do banco, e só o que é público (mapa, bairros, categorias).
2. Toda **escrita** passa por uma Edge Function, que valida, trata as fotos e chama uma função do banco.
3. Os dados pessoais e a localização exata ficam em tabelas **privadas**, separadas das públicas (ADR-004).
4. Cada função do banco (`api_*`) só pode ser chamada pela chave de serviço, que **nunca** vai para o navegador.
5. O agente entra com login individual; a função confere o login e o banco confere de novo se é agente.

### Duas camadas de proteção: GRANT e RLS

No Postgres, uma tabela só é acessível se **as duas** camadas deixarem:

- **GRANT**: "este papel pode fazer SELECT/INSERT nesta tabela?". É a porta.
- **RLS** (Row Level Security): "e dentro da tabela, quais linhas ele vê?". É o segurança na porta.

Aqui, a regra é negar por padrão: `revoke ... from anon, authenticated` em tudo e depois conceder só o necessário. Os papéis do Supabase são `anon` (visitante), `authenticated` (logado) e `service_role` (servidor; ignora o RLS, por isso a chave dele nunca sai das Edge Functions).

## 2. As migrations (o banco, passo a passo)

Migration é um arquivo SQL que muda o banco e fica guardado no Git. Elas rodam em ordem pelo nome (a data no começo).

| Arquivo | O que faz |
|---|---|
| `20261121041104_criar_bairros` | Tabela `neighborhoods` (bairros). |
| `20261122022303_conceder_leitura_bairros` | Dá ao visitante leitura dos bairros. |
| `20261122100000_base_tipos_perfis_catalogos` | Tira privilégios padrão, cria o esquema `internal`, os tipos (enums), `profiles` (quem é agente) e `categories`. |
| `20261122100100_denuncias_tabelas_rls` | Tabelas da denúncia, públicas e privadas, com RLS e grants. |
| `20261122100200_storage_buckets` | Dois buckets de fotos: `fotos-originais` (privado) e `fotos-publicas`. |
| `20261122100300_funcoes_base` | Funções de apoio: grade de 200 m, território, distância, protocolo, limite de tentativas, código de confirmação. |
| `20261122100400_funcoes_denuncia` | `api_save_report` e `api_publish_report`. |
| `20261122100500_funcoes_agente` | Ações do agente (analisar, visita, observação, encerrar, arquivar, voltar ao mapa, criar ocorrência). |
| `20261122100600_funcoes_consulta` | Correção, lixeira, limpeza e as leituras do agente. |

### As tabelas

| Tabela | Quem vê | Conteúdo |
|---|---|---|
| `reports` | só servidor e agente | A denúncia (etapa, categoria, local exato, versão, protocolo). |
| `report_private` | só servidor e agente | Nome, e-mail, telefone, endereço. Separada de propósito. |
| `report_photos` | só servidor e agente | Caminho das fotos **originais**. |
| `public_reports` | **visitante** | Só o que pode aparecer no mapa: célula da grade de 200 m, categoria, etapa, fotos públicas. Sem dado pessoal e sem ponto exato. |
| `report_visits` | agente | Visitas de campo. |
| `report_events` | agente | Histórico; um gatilho impede alterar ou apagar linhas (é um registro de auditoria). |
| `contact_verifications` | só servidor | Hash do código de confirmação, tentativas, validade. |
| `rate_limits` | só servidor | Contagem de pedidos por pessoa (IP em hash) para frear abuso. |
| `profiles` / `categories` / `neighborhoods` | ver RLS | Agentes, categorias (provisórias) e bairros. |

O mapa público usa `public_reports`: o ponto exato do cidadão **não existe** nessa tabela (D43).

### As funções `api_*`

Todas são `security definer` (rodam com o poder do dono, não de quem chama) com `set search_path = ''` (evita que alguém "troque" uma tabela por outra de mesmo nome) e `execute` só para `service_role`. O Postgres expõe funções do esquema `public` como RPC; por isso o `revoke` é essencial.

- **Cidadão:** `api_start_verification`, `api_confirm_verification`, `api_save_report`, `api_publish_report`, `api_find_report_for_correction`, `api_get_report_for_citizen`, `api_correct_fields_citizen`.
- **Agente:** `api_start_analysis`, `api_register_visit`, `api_add_note`, `api_close_without_access`, `api_archive_report`, `api_restore_to_map`, `api_create_agent_report`, `api_correct_fields_agent`. Cada uma começa com `internal.require_agent(p_agent)`, que confere na tabela `profiles` se o usuário é agente.
- **Rotina:** `api_trash_due`, `api_purge_report`, `api_pending_public_cleanup`, `api_clear_public_photo_paths`, `api_pending_publication`, `api_get_original_paths`, `api_check_restore`, `api_hit_rate_limit`.
- **Leitura do agente (pelo navegador, logado):** `agent_nearby_reports` (denúncias num raio de 150 m) e `agent_queue_summary`.

Duas ideias que aparecem várias vezes:

- **Idempotência** (ADR-007): o navegador cria um `submission_id` por tentativa. Se o envio se repetir (rede ruim, duplo clique), o banco devolve o mesmo protocolo em vez de criar outra denúncia.
- **Versão (concorrência otimista):** cada denúncia tem `version`. Quem altera diz qual versão leu; se mudou no meio, o banco recusa com `versao_desatualizada`. Assim, dois agentes não sobrescrevem um ao outro sem perceber.

## 3. As Edge Functions

Cada função tem `index.ts` (liga o servidor) e `handler.ts` (a lógica, testável). As peças comuns estão em `_shared/`:

| Arquivo | Função |
|---|---|
| `servico.ts` | Interface `Servico`: tudo o que a função usa de fora (banco, arquivos, login, e-mail, configuração). Nos testes, uma versão falsa (PGlite) ocupa o lugar. |
| `erros.ts` | Traduz erro do banco em código curto e frase em português. O navegador nunca recebe mensagem técnica. |
| `codigo.ts` | Gera o código de 6 dígitos e calcula o hash HMAC com `CODE_PEPPER`. |
| `token.ts` | Token assinado (HMAC) de correção: curto, de uso único e preso a uma denúncia e versão. |
| `imagem.ts` / `fotos.ts` | Valida JPEG/PNG pelos primeiros bytes e pelo tamanho. Para a cópia pública, lê a estrutura do arquivo e descarta todos os metadados (EXIF com GPS, XMP, comentários, miniatura) e qualquer dado colado depois do fim da imagem, **sem decodificar** (rápido e sem biblioteca nativa, que o Supabase não roda). Mantém só a orientação da foto. Grava o original (privado) e a cópia pública. |
| `http.ts` | CORS, leitura segura de JSON, limite de tentativas, resposta padronizada. |

### Contratos (o que o front-end envia e recebe)

Troque `URL` por `https://<projeto>.supabase.co/functions/v1`. Todas respondem JSON. Em erro: `{ "erro": "codigo", "mensagem": "texto em português" }` com o status HTTP certo.

**`enviar-codigo`** (POST JSON, público): pede o código por e-mail.
```js
await fetch(`${URL}/enviar-codigo`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  body: JSON.stringify({ submission_id, channel: "email", contact: "pessoa@exemplo.com" }),
});
// -> { ok: true, expira_em_segundos: 600 }
```

**`confirmar-codigo`** (POST JSON, público): `{ submission_id, contact, code }` -> `{ confirmed: true|false }`. No 5º erro o código morre.

**`salvar-denuncia`** (POST multipart, público): campo `dados` (JSON) + 1 a 3 arquivos em `fotos`.
```js
const form = new FormData();
form.append("dados", JSON.stringify({ submission_id, lat, lng, category_id, description,
  name, email, phone, confirmed_channel: "email", confirmed_contact: email /* ... */ }));
fotos.forEach((f) => form.append("fotos", f));
const r = await fetch(`${URL}/salvar-denuncia`, { method: "POST", headers: { apikey: ANON_KEY }, body: form });
// -> { protocol: "AED-2026-000123", publication: "publicada" | "pendente", already_existed: false }
```
Se a publicação das fotos falhar, o protocolo é entregue mesmo assim com `publication: "pendente"`; a rotina diária tenta de novo (D14).

**`acesso-correcao`** (POST JSON, público), três ações:
1. `{ acao: "solicitar", protocol }` envia código ao contato confirmado. Resposta **sempre** `{ ok: true }`, exista o protocolo ou não.
2. `{ acao: "confirmar", protocol, code }` -> `{ confirmed: true, token, report }` ou `{ confirmed: false }`.
3. `{ acao: "salvar", token, changes, reason }` -> `{ ok: true, version }`. Só na etapa Recebida; o contato confirmado não muda.

**`agente`** (POST, exige login do agente): cabeçalho `Authorization: Bearer <access_token do usuário>`.
```js
const { data } = await supabase.auth.getSession();
await fetch(`${URL}/agente`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
  body: JSON.stringify({ acao: "iniciar_analise", report_id, version }),
});
```
Ações: `iniciar_analise {report_id, version}`, `registrar_visita {report_id, version, visita}`, `adicionar_observacao {report_id, texto}`, `encerrar_sem_acesso {report_id, version}` (exige 3 tentativas sem acesso), `arquivar {report_id, motivo, confirmado: true}`, `voltar_ao_mapa {report_id}`, `corrigir {report_id, changes, reason, version?}`, e multipart `acao=criar_ocorrencia` com `dados` + `fotos`.

**`rotina-diaria`** (POST sem corpo; só com `Authorization: Bearer <CRON_SECRET>`): limpa fotos públicas de arquivadas, apaga a lixeira vencida (30 dias: **arquivos primeiro, registro depois**) e tenta de novo publicações pendentes. Devolve contagens.

### Por que `verify_jwt = false` em todas

O `verify_jwt` do gateway aceita qualquer JWT válido, inclusive a chave pública `anon`, então não distingue agente de visitante. Por isso cada função se protege sozinha (explicado no `config.toml`). A `agente` confere o usuário no Supabase Auth e o banco confere o papel.

## 4. Testes

Sem Docker e sem internet para o Supabase.

**Banco** (PGlite, um Postgres em memória; aplica todas as migrations e testa regras e acessos negados):
```
cd supabase/tests
npm install
npm test        # 96 testes
```
O arquivo `stubs_supabase.sql` só **simula** o que o Supabase já tem (papéis, `auth.users`, `auth.uid()`, esquema `storage`). Não é migration.

**Funções** (Deno; unitários + ponta a ponta, usando o banco em memória no lugar do Supabase):
```
cd supabase/functions
deno test -A .  # 41 testes
deno check */index.ts
```
Dica: o que os testes provam de privacidade: foto pública sem EXIF, XMP, comentário nem dado colado no fim; tabela pública sem coluna privada; `anon` negado em todas as tabelas privadas e em todas as `api_*`; denúncia arquivada não é republicada por tarefa atrasada; token de correção só vale uma vez; protocolo existente e inexistente dão a mesma resposta.

**O que os testes NÃO provam:** o comportamento no Supabase hospedado (criação de buckets e políticas por migration, Storage real, envio real de e-mail). Isso se confere no projeto de teste (seção 5).

## 5. Colocando no ar (projeto de TESTE)

> Nunca aplique nada no projeto de produção sem decisão da equipe (TASK-101).

1. **Entrar e ligar ao projeto de teste**
   ```
   npx supabase login
   npx supabase link --project-ref <ref do projeto de teste>
   ```
2. **Conferir o alvo e aplicar as migrations.** Veja o que falta e confirme que o "Target" é o projeto de **teste**:
   ```
   npx supabase migration list --remote
   npx supabase db push --remote   # pede a senha do banco
   ```
   O `seed.sql` **não** vai junto (é só para ambiente local).
3. **Definir os segredos** (valores longos e aleatórios; guarde no gerenciador de senhas):
   ```
   npx supabase secrets set CODE_PEPPER=... CORRECTION_TOKEN_SECRET=... CRON_SECRET=... \
     ALLOWED_ORIGINS=https://seu-site.vercel.app RESEND_API_KEY=... EMAIL_FROM="Aedes <no-reply@seu-dominio>"
   ```
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase já injeta. **Não** defina `EMAIL_MODE=log` fora do desenvolvimento (ele escreve o código no log em vez de enviar).
4. **Publicar as funções:**
   ```
   npx supabase functions deploy enviar-codigo confirmar-codigo salvar-denuncia acesso-correcao agente rotina-diaria
   ```
5. **Desligar o cadastro público** (Dashboard > Authentication > Providers/Settings: *Allow new users to sign up* desligado). Agentes são criados pela equipe (D22).
6. **Criar um agente:** no Dashboard, Authentication > Users > *Add user* (com e-mail e senha). Depois, no SQL Editor:
   ```sql
   insert into public.profiles (id, display_name)
   values ('<uuid do usuário criado>', 'Nome do agente');
   ```
   Sem a linha em `profiles`, o login existe mas o banco recusa as ações (`nao_autorizado`).
7. **Agendar a rotina diária.** Opções: Supabase Cron/`pg_cron`+`pg_net`, ou GitHub Actions. Em qualquer uma, a chamada é:
   ```
   POST https://<projeto>.supabase.co/functions/v1/rotina-diaria
   Authorization: Bearer <CRON_SECRET>
   ```
8. **Teste de fumaça:** pelo front (ou com `curl`) envie uma denúncia de teste, confirme o protocolo, veja as fotos nos dois buckets (a pública sem EXIF) e confira que `anon` não lê `reports` (deve voltar vazio ou erro de permissão).

## 6. Limitações conhecidas e pendências

- **E-mail:** só e-mail está implementado. SMS e WhatsApp respondem `canal_indisponivel` até a decisão de custo (DEP-03).
- **Território e categorias** são provisórios (um retângulo; DEP-01). Trocar o contorno é uma nova migration.
- **Fotos:** só JPEG e PNG (WebP/HEIC são recusados). A cópia pública não é redimensionada (tem o mesmo tamanho do original, até 10 MB): reduzir a foto no navegador antes de enviar economiza banda e deixa o mapa mais rápido.
- **Migrations de Storage** (buckets e políticas) foram testadas só no simulador; confira no projeto real ao aplicar.
- **Funções ainda não reutilizam `js/dominio/`** (TASK-060a, ADR-015): as regras estão duplicadas no SQL e em `_shared/`.
- **Front-end:** trocar o serviço fictício pelas chamadas acima é a TASK-063.
