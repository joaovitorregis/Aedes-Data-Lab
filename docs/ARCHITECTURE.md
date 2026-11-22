# Aedes Data Lab: Arquitetura

| Campo | Valor |
|---|---|
| Versão | 3.7 · 16/11/2026 |
| Documentos relacionados | [PRD](./PRD.md) · [Decisões](./DECISIONS.md) · [Segurança](./SECURITY.md) · [Tarefas](../TASKS.md) |

Este documento descreve **como** o Aedes Data Lab será construído. O que o produto faz e as regras de aceite estão no [PRD](./PRD.md); se os dois divergirem sobre comportamento, vale o PRD. As escolhas técnicas e seus motivos ficam registrados em [DECISIONS.md](./DECISIONS.md).

## 1. Stack

| Camada | Escolha | Registro |
|---|---|---|
| Interface | HTML, um CSS compartilhado e JavaScript em módulos ES, sem framework | ADR-001, ADR-002 |
| Mapas | Leaflet, com provedor de camada visual a escolher | ADR-005, DEP-07 |
| Backend | Supabase (D38): Edge Functions para as operações que validam e autorizam | ADR-003, ADR-008 |
| Banco de dados | Postgres do Supabase, com tabelas separadas para dados públicos e privados e políticas de acesso por linha (RLS) | ADR-004 |
| Arquivos | Supabase Storage, com um bucket privado para os originais e um bucket público para as fotos tratadas | ADR-003 |
| Autenticação | Supabase Auth para agentes, com contas criadas pela equipe do projeto no Supabase (D22). O cidadão não tem conta: confirma por código o contato escolhido em cada denúncia (e-mail; SMS e WhatsApp se ativos, D45) | ADR-006, DEP-03 |
| Cliente | Biblioteca `supabase-js` importada como módulo ES, usada só em `js/servicos/` | ADR-003 |
| Ambiente local | Supabase CLI, que sobe banco, Auth, Storage e funções na própria máquina (exige Docker); Vite opcional, quando ajudar | ADR-003 |
| Hospedagem | Vercel para o site estático (D46) | ADR-016, DEP-07 |
| Versionamento | Git e GitHub, com PR revisado antes de entrar no `main` | RULES.md |
| Relatório do agente | jsPDF com o complemento AutoTable para PDF e a biblioteca `docx` para Word, carregadas como módulos ES só na tela do relatório | ADR-012 |
| Gráficos | Chart.js, só na fase do dashboard | D15 (depois da V1) |

## 2. Como os dados circulam

```
Morador ou agente
      ↓
Página HTML (site/)
      ↓
Módulo da tela (site/js/cidadao ou site/js/agentes)
      ↓
Camada de serviços (site/js/servicos)
      ↓
Edge Functions: validar, autorizar, gravar
      ↓
Postgres (com RLS) e Storage
      ↓
Versão pública (public_reports) → Mapa
```

As telas nunca falam direto com o banco. Toda leitura e escrita passa pela camada de serviços. As leituras usam a chave pública do Supabase e só alcançam o que as políticas de RLS liberam; toda operação que muda dados passa por uma Edge Function que confere permissão, etapa e território.

## 3. Estrutura de pastas

```
Aedes-Data-Lab/
├── docs/                  Documentação do produto e do projeto
├── site/
│   ├── inicio.html        Início (área pública)
│   ├── paginas/           Demais páginas públicas
│   ├── agentes/           Páginas da área dos agentes
│   ├── css/estilos.css    Único CSS do site
│   ├── js/
│   │   ├── cidadao/       Um módulo por página pública
│   │   ├── agentes/       Um módulo por página dos agentes
│   │   ├── compartilhado/ Menu e utilidades de interface
│   │   ├── dominio/       Regras: validação, etapas, território, aproximação
│   │   └── servicos/      Chamadas ao Supabase e dados fictícios
│   └── assets/imagens/
├── supabase/              Criada na Fase 6 pela Supabase CLI
│   ├── migrations/        Tabelas, políticas de RLS e buckets, em SQL versionado
│   ├── functions/         Edge Functions
│   └── seed.sql           Dados fictícios para o ambiente local
├── tests/                 Testes (criada junto com a primeira lógica)
├── wireframes/            Telas finais exportadas do Figma
├── TASKS.md
├── .env.example
└── README.md
```

As pastas `js/dominio/`, `supabase/` e `tests/` ainda não existem; elas são criadas pelas tarefas indicadas em [TASKS.md](../TASKS.md).

## 4. Regras de arquitetura

- A página HTML contém estrutura; o comportamento fica no módulo JavaScript da própria tela.
- Nenhum módulo de tela importa o `supabase-js` nem acessa o banco ou o Storage. Isso é papel de `js/servicos/`.
- Toda mudança no banco é feita por migração em `supabase/migrations/`, revisada no PR. Ninguém altera tabelas ou políticas pelo painel do Supabase.
- Regras de negócio (etapas, território, grade de 200 m) ficam em `js/dominio/`, um módulo compartilhado: o navegador o usa para orientar a pessoa e as Edge Functions o importam para decidir (ADR-015). Nunca existem duas versões da mesma regra.
- Permissão, etapa e território são conferidos no servidor em toda operação que altera dados.
- O navegador do visitante só recebe a tabela pública. Esconder campos na tela não conta como proteção.
- Componentes visuais repetidos (botão, cartão, etiqueta de etapa) usam as classes de [DESIGN.md](./DESIGN.md), nunca estilos soltos por página.

## 5. Contratos da camada de serviços

| Contrato | Quem pode chamar |
|---|---|
| `enviarCodigo` | Qualquer pessoa, depois de preencher os dados da denúncia; envia o código ao canal escolhido (e-mail e, se ativos, SMS ou WhatsApp), com limite de pedidos e reenvios (RNF-08) |
| `confirmarCodigo` | Qualquer pessoa; liga o contato confirmado àquela tentativa de envio, sem criar conta |
| `salvarDenuncia` | Pessoa com o contato confirmado para aquela tentativa |
| `listarDenunciasPublicas` | Qualquer pessoa; lê só a versão pública |
| `listarOcorrencias` | Agente autorizado; aceita os filtros da lista, inclusive origem, e devolve também o resumo do recorte (D54), a origem, os dias em aberto e as tentativas sem acesso |
| `listarOcorrenciasProximas` | Agente autorizado; ocorrências num raio de 150 m do ponto exato (D34) |
| `obterOcorrencia` | Agente autorizado; devolve uma ocorrência com `reports`, `report_private`, `report_visits`, `report_events` e endereços temporários das fotos do bucket privado |
| `iniciarAnalise`, `registrarObservacao` | Agente autorizado. Na tela, "Iniciar análise" chama `iniciarAnalise` e abre o registro da visita em seguida (D52) |
| `registrarVisita` | Agente autorizado, só com a ocorrência Em análise; com acesso leva a Atendida, sem acesso soma uma tentativa |
| `registrarFocoSemDenuncia` | Agente autorizado; cria uma ocorrência de origem agente, já Atendida, com local, categoria, descrição, fotos e a visita, numa única transação (D51, RF-AGE-10) |
| `encerrarSemAcesso` | Agente autorizado, só com três ou mais tentativas sem acesso |
| `arquivarOcorrencia` | Agente autorizado, em qualquer etapa; exige motivo e tira a denúncia do mapa na mesma transação, iniciando a contagem da lixeira. Em Recebida ou Em análise, também leva a Encerrada; em Atendida ou Encerrada, a etapa não muda (D44, D48, D49, RF-AGE-04) |
| `dadosRelatorio` | Agente autorizado; devolve totais e visitas de um período e bairro, separados por origem e por tipo de encerramento (D56), sem nome, e-mail ou telefone do morador |
| `voltarAoMapa` | Agente autorizado; devolve ao mapa uma denúncia arquivada, só dentro dos 30 dias da lixeira, sem mudar a etapa (D44, RF-AGE-06). Substitui `republicarOcorrencia`; `ocultarPublicacao` deixou de existir, incorporado a `arquivarOcorrencia` |
| `solicitarAcessoCorrecao`, `confirmarAcessoCorrecao` | Qualquer pessoa; com o protocolo, envia um código ao contato confirmado na denúncia e, confirmado o código, devolve a autorização temporária de edição. A resposta é igual para protocolo inexistente ou sem vínculo, e os pedidos têm limite (D42, RNF-08) |
| `limparLixeira` | Rotina agendada do servidor, sem chamada pelo navegador; remove as denúncias arquivadas há mais de 30 dias (D44) |
| `corrigirCamposDenuncia` | Agente autorizado, em qualquer etapa, com motivo, sem trocar o contato confirmado; cidadão com vínculo comprovado, só na própria denúncia e só enquanto Recebida (D26) |

O agente corrige os campos com motivo, menos o contato confirmado, que só a equipe do projeto troca direto no Supabase (D42). Enquanto o backend não existe, os mesmos contratos são atendidos por dados fictícios em `js/servicos/`, para que as telas não mudem quando o Supabase entrar.

## 6. Modelo de dados

| Tabela ou recurso | Conteúdo | Acesso |
|---|---|---|
| `reports` | Dados operacionais: protocolo, origem (`cidadao`, `agente`) e o autor quando a origem é agente, ponto exato, bairro, categoria, etapa (`recebida`, `em_analise`, `atendida`, `encerrada`), estado de publicação (`pendente`, `publicada`, `arquivada`) com o motivo, o momento do arquivamento e a versão da decisão, datas, contador de tentativas sem acesso e versão | Agentes autorizados |
| `report_visits` | Uma linha por visita: data, acesso (`com_acesso`, `fechado`, `recusado`, `nao_localizado`), onde está o foco (`residencia`, `comercio`, `terreno_baldio`, `outro`, com o texto digitado em `outro`), água acumulada, recipientes com água (a lista do formulário do cidadão), larvas ou pupas (`sim`, `nao`, `nao_sei`), o que foi feito, observação, autor e momento. Os códigos da ficha do PNCD não são usados (D53) | Agentes autorizados; nunca público |
| `neighborhoods` | Catálogo dos 15 bairros de D33, com nome e, depois de DEP-01, o contorno no mapa | Leitura pública |
| `report_private` | Nome, e-mail, telefone, endereço digitado (D39), referência do local e qual desses contatos foi confirmado no envio, por qual canal (D06). Ocorrência de origem agente não tem linha aqui | Todos os agentes autorizados (D11); o cidadão lê e corrige só a própria denúncia, enquanto Recebida |
| `public_reports` | Célula da grade de 200 m (D43), no lugar do ponto, bairro, categoria, data, etapa, origem (só `cidadao` ou `agente`, sem nome, D50), foto tratada e descrição | Leitura pública |
| `report_events` | Início de análise, observações, visitas, encerramento, arquivamento, volta ao mapa e correções, com autor e data | Agentes autorizados; nunca público nem liberado ao cidadão |
| `profiles` | Habilitação e papel (agente), ligados ao usuário do Supabase Auth | Acesso mínimo; mantido pela equipe do projeto direto no Supabase, sem tela (D22) |
| Storage | Bucket `fotos-originais` (privado) e bucket `fotos-publicas` (versões tratadas) | Políticas separadas para cada bucket |

Cada tabela tem RLS ativado e nega tudo por padrão; as políticas liberam só o que a coluna Acesso descreve. O modelo será refinado durante a implementação. Nenhum caractere de nome, e-mail ou telefone vai para `public_reports`, e a foto pública é gerada sem metadados pessoais. As regras de proteção de cada recurso estão em [SECURITY.md](./SECURITY.md).

## 7. Fluxos técnicos da V1

### 7.1 Envio

1. Coletar ponto exato, bairro, endereço digitado (obrigatório, D39), categoria, descrição, de uma a três fotos, nome, e-mail e telefone.
2. Depois dos dados, enviar um código ao contato escolhido pela pessoa (e-mail; e, se ativos, telefone por SMS ou WhatsApp, D45) e conferir o código digitado. A confirmação fica vinculada à tentativa, não cria conta e não marca o outro contato como confirmado. Provedores, expiração, reenvio e limites são definidos em DEP-03.
3. Validar no servidor o território, os tipos e tamanhos de arquivo e os dados.
4. Usar um ID estável por tentativa: reservar o registro como pendente, receber as fotos na área restrita, finalizar e só então gerar o protocolo.
5. Gerar a versão pública com posição aproximada e fotos tratadas. O agente vê o registro recebido imediatamente.
6. Se a publicação falhar, manter o protocolo, informar "publicação pendente" e recuperar com segurança. Repetir a tentativa não cria outra denúncia.

O banco e o Storage não compartilham transação, por isso reenvios e retentativas precisam ser idempotentes (ADR-007). Os estados técnicos do envio (pendente, finalizado, publicação pendente) são independentes das etapas Recebida, Em análise, Atendida e Encerrada.

### 7.2 Mapa público

O mapa lê somente `public_reports`: foto, descrição, bairro, categoria, data, etapa, origem e área aproximada. Denúncias atendidas e encerradas continuam visíveis; as arquivadas saem. A área pública é a célula de uma grade fixa de 200 m (D43, ADR-013), calculada no servidor a partir do ponto exato; só a célula vai para `public_reports`. Denúncias na mesma célula mostram a mesma área, e o bairro exibido é o escolhido pela pessoa, mesmo quando a célula cruza uma divisa.

### 7.3 Ocorrências do agente

A equipe do projeto cria, libera, revoga e recupera as contas direto no Supabase, sem tela de administrador (D22); a V1 tem uma conta de agente (D31). Todos os agentes autorizados consultam as ocorrências de Itambé inteira e os campos privados, inclusive nome, e-mail e telefone. Abrir o detalhe não altera a etapa. "Iniciar análise", "Registrar visita", "Encerrar sem acesso" e "Arquivar" são operações explícitas com autor e data. Na tela, "Iniciar análise" chama `iniciarAnalise` e abre o registro da visita em seguida: são duas operações no serviço e um passo só para o agente (D52).

`registrarVisita` grava a linha em `report_visits`, o evento em `report_events` e, se houver acesso, muda a etapa para Atendida, tudo numa única transação. Sem acesso, a etapa não muda e o contador de tentativas aumenta. `encerrarSemAcesso` confere no servidor se há pelo menos três tentativas. Cada visita leva um ID gerado no aparelho, para que o reenvio depois de uma falha não grave a mesma visita duas vezes. Enquanto o envio não é confirmado, o formulário fica guardado no `localStorage` do aparelho, só com os campos da visita.

`registrarFocoSemDenuncia` grava, numa única transação, a linha em `reports` com origem `agente` e etapa Atendida, a visita em `report_visits`, o evento em `report_events` e a versão pública com a origem, sem o nome do agente. As fotos seguem o mesmo fluxo do envio (7.1), com ID estável por tentativa (ADR-007). Não cria linha em `report_private` (RF-AGE-10).

O mapa de Ocorrências usa o mesmo Leaflet do mapa público, com os pontos exatos devolvidos por `listarOcorrencias`. "Como chegar" abre um link `geo:` ou do Google Maps com as coordenadas, sem rastrear o agente. A busca de ocorrências próximas é feita no servidor, com distância calculada sobre o ponto exato.

Quem inicia a análise fica registrado como autor, sem exclusividade. Denúncias diferentes no mesmo local continuam separadas. Antes de salvar, o serviço confere a etapa e a versão atuais para que uma ação concorrente ou um clique repetido não seja sobrescrito.

### 7.3.1 Relatório

A tela do relatório chama `dadosRelatorio` com período e bairro, mostra a prévia e gera o arquivo no navegador: PDF com jsPDF e AutoTable, Word (`.docx`) com a biblioteca `docx` (ADR-012). As bibliotecas só são carregadas quando o agente abre essa tela. O serviço não devolve campos de `report_private`, então o relatório não tem como incluir dados do morador. Os totais vêm separados por origem (cidadãos e agentes) e por tipo de encerramento (Atendidas, Encerradas sem acesso e Arquivadas), e os recipientes com água pelos nomes do formulário (D56). Nenhum arquivo é guardado no servidor.

O agente arquiva por `arquivarOcorrencia`, em qualquer etapa: o serviço confere a etapa e a versão atuais, grava o motivo em `report_events`, tira a denúncia do mapa e, se ela estiver Recebida ou Em análise, leva a ocorrência a Encerrada, tudo numa única transação (PRD, RF-AGE-04 e seção 10.3).

### 7.4 Arquivamento e volta ao mapa

Arquivar exige motivo e preserva o registro interno. Em Recebida ou Em análise, também encerra a ocorrência; em Atendida ou Encerrada, mantém a etapa (D49). A V1 tira do ar a publicação inteira, incluindo o acesso público às fotos; remover só o marcador não basta se a imagem continuar acessível pela URL antiga. Cada decisão de publicação recebe uma versão, para que uma tarefa antiga não substitua uma decisão mais recente. Voltar ao mapa exige ação explícita e nunca altera a etapa.

Arquivar é uma lixeira (ADR-017). `limparLixeira` roda uma vez por dia por agendamento do Supabase, remove as denúncias arquivadas há mais de 30 dias e apaga as fotos dos dois buckets junto com as linhas de `reports`, `report_private`, `report_visits`, `report_events` e `public_reports`. Voltar ao mapa dentro do prazo cancela a remoção, e um novo arquivamento reinicia a contagem. A rotina só remove denúncias arquivadas; as demais nunca saem do banco por ela. Se uma cópia de segurança for restaurada, a data do arquivamento volta junto e a rotina apaga de novo as denúncias vencidas; até lá, elas aparecem só para os agentes, nunca no mapa. O prazo para ocorrências já atendidas está em aberto (PRD D44).

### 7.5 Correção de campos

O agente autorizado corrige qualquer denúncia em qualquer etapa, com motivo. O cidadão comprova o vínculo com a denúncia pelo contato confirmado no envio e recebe uma autorização de edição restrita àquele registro, com prazo de validade e proteção contra reutilização. O serviço confere a etapa no momento de salvar: se a ocorrência já estiver Em análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato (D26). Um ponto corrigido passa de novo pela validação de território.

Cada correção grava valor original, novo valor, motivo, autor e data em `report_events`. Se a denúncia estiver publicada, só a versão pública permitida é atualizada; se estiver arquivada, continua fora do mapa. O acesso do cidadão usa `solicitarAcessoCorrecao` e `confirmarAcessoCorrecao` (D42), e a troca do contato confirmado é feita só pela equipe do projeto, direto no Supabase; `corrigirCamposDenuncia` recusa essa troca vinda do agente.

## 8. Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| Local | Desenvolvimento com servidor local (Live Server) e Supabase CLI | Fictícios, carregados por `seed.sql` |
| Prévia | Projeto Supabase de teste, separado da produção, para revisar cada entrega | Fictícios |
| Produção | Projeto Supabase próprio, aberto aos moradores após as dependências de lançamento | Reais |

As migrações são aplicadas primeiro no ambiente local, depois na prévia e só então na produção. As configurações de cada ambiente seguem [.env.example](../.env.example). Nenhum valor real entra no repositório.

## 9. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 1.2 | 05/11/2026 | Start Técnico alinhado ao PRD 1.2 |
| 2.0 | 05/11/2026 | Start Técnico alinhado ao PRD 2.0 |
| 3.0 | 11/11/2026 | Start Técnico vira `ARCHITECTURE.md`: stack, fluxo de dados, estrutura de pastas, regras de arquitetura e ambientes. Sequência de trabalho movida para TASKS.md, verificações para TEST_PLAN.md e SECURITY.md, motivos das escolhas para DECISIONS.md |
| 3.1 | 11/11/2026 | Backend Supabase (ADR-003): Postgres com RLS, Storage, Auth, Edge Functions e Supabase CLI no ambiente local |
| 3.2 | 12/11/2026 | Alinhada ao PRD 2.2: contratos `registrarVisita`, `encerrarSemAcesso`, `listarOcorrenciasProximas` e `dadosRelatorio`; tabelas `report_visits` e `neighborhoods`; etapa Encerrada; relatório gerado no navegador (ADR-012) |
| 3.3 | 14/11/2026 | Alinhada ao PRD 2.3: confirmação por código no canal escolhido depois dos dados (`enviarCodigo` e `confirmarCodigo`, um contrato para os três canais); telefone obrigatório em `report_private`; coluna de situação trocada pela referência à ADR ou à dependência de cada escolha |
| 3.4 | 14/11/2026 | Alinhada ao PRD 2.4: contrato `arquivarOcorrencia` (D41); endereço digitado e referência em `report_private` (D39); contratos de recuperação de acesso (D42), grade de 200 m em `public_reports` (D43) e rotina `limparLixeira` (D44) |
| 3.5 | 15/11/2026 | CPF retirado do modelo (D07); SMS e WhatsApp condicionados (D45); módulo de regras compartilhado entre navegador e servidor (ADR-015); hospedagem na Vercel (ADR-016) |
| 3.6 | 15/11/2026 | Alinhada ao PRD 2.7: sem papel de administrador; contas e troca do contato confirmado pela equipe do projeto no Supabase; `corrigirCamposDenuncia` passa ao agente; contrato `obterOcorrencia` para o detalhe |
| 3.7 | 16/11/2026 | Alinhada ao PRD 2.8: origem em `reports` e `public_reports`; contrato `registrarFocoSemDenuncia`; `arquivarOcorrencia` em qualquer etapa e `voltarAoMapa` no lugar de `ocultarPublicacao` e `republicarOcorrencia` (ADR-017); `report_visits` com as perguntas na linguagem do cidadão, sem códigos do PNCD; resumo do recorte em `listarOcorrencias`; relatório por origem e por tipo de encerramento |
