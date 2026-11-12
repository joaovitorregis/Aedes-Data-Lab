# Aedes Data Lab: Arquitetura

| Campo | Valor |
|---|---|
| Versão | 3.2 · 12/11/2026 |
| Estado | Aprovada como base de construção; serviços ainda não implementados |
| Documentos relacionados | [PRD](./PRD.md) · [Decisões](./DECISIONS.md) · [Segurança](./SECURITY.md) · [Tarefas](../TASKS.md) |

Este documento descreve **como** o Aedes Data Lab será construído. O que o produto faz e as regras de aceite estão no [PRD](./PRD.md); se os dois divergirem sobre comportamento, vale o PRD. As escolhas técnicas e seus motivos ficam registrados em [DECISIONS.md](./DECISIONS.md).

## 1. Stack

| Camada | Escolha | Situação |
|---|---|---|
| Interface | HTML, um CSS compartilhado e JavaScript em módulos ES, sem framework | Decidida (ADR-001, ADR-002) |
| Mapas | Leaflet, com provedor de camada visual a escolher | Proposta (ADR-005, DEP-07) |
| Backend | Supabase: Edge Functions para as operações que validam e autorizam | Proposta (ADR-012 propõe substituir a ADR-003, ainda em vigor) |
| Banco de dados | Postgres do Supabase, com tabelas separadas para dados públicos e privados e políticas de acesso por linha (RLS) | Proposta (ADR-004) |
| Arquivos | Supabase Storage, com um bucket privado para os originais e um bucket público para as fotos tratadas | Proposta |
| Autenticação | Supabase Auth para agentes e administrador; confirmação de e-mail por denúncia para o cidadão | Proposta (ADR-006) |
| Cliente | Biblioteca `supabase-js` importada como módulo ES, usada só em `js/servicos/` | Proposta |
| Ambiente local | Supabase CLI, que sobe banco, Auth, Storage e funções na própria máquina (exige Docker); Vite opcional, quando ajudar | Proposta |
| Hospedagem | A definir junto com o custo (DEP-07) | Em aberto |
| Versionamento | Git e GitHub, com PR revisado antes de entrar no `main` | Em uso |
| Relatório do agente | jsPDF com o complemento AutoTable para PDF e a biblioteca `docx` para Word, carregadas como módulos ES só na tela do relatório | Proposta (ADR-013) |
| Gráficos | Chart.js, só na fase do dashboard | Fase seguinte |

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
│   ├── index.html         Início (área pública)
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
- Regras de negócio (etapas, validação de CPF, território, aproximação) ficam em `js/dominio/` e são repetidas no servidor. A validação do navegador só orienta.
- Permissão, etapa e território são conferidos no servidor em toda operação que altera dados.
- O navegador do visitante só recebe a tabela pública. Esconder campos na tela não conta como proteção.
- Componentes visuais repetidos (botão, cartão, etiqueta de etapa) usam as classes de [DESIGN.md](./DESIGN.md), nunca estilos soltos por página.

## 5. Contratos da camada de serviços

| Contrato | Quem pode chamar |
|---|---|
| `confirmarEmail` | Qualquer pessoa, com limite de repetição (RNF-08) |
| `salvarDenuncia` | Pessoa com e-mail confirmado para aquela tentativa |
| `listarDenunciasPublicas` | Qualquer pessoa; lê só a versão pública |
| `listarOcorrencias` | Agente autorizado; devolve também o resumo por etapa, os dias em aberto e as tentativas sem acesso |
| `listarOcorrenciasProximas` | Agente autorizado; ocorrências num raio de 150 m do ponto exato (D34) |
| `iniciarAnalise`, `registrarObservacao` | Agente autorizado |
| `registrarVisita` | Agente autorizado, só com a ocorrência Em análise; com acesso leva a Atendida, sem acesso soma uma tentativa (substitui `concluirOcorrencia`) |
| `encerrarSemAcesso` | Agente autorizado, só com três ou mais tentativas sem acesso |
| `dadosRelatorio` | Agente autorizado; devolve totais e visitas de um período e bairro, sem nome, CPF, e-mail ou telefone do morador |
| `ocultarPublicacao`, `republicarOcorrencia` | Agente autorizado |
| `corrigirCamposDenuncia` | Administrador, em qualquer etapa; cidadão com vínculo comprovado, só na própria denúncia e só enquanto Recebida (D26) |

Ter apenas o papel de agente não dá permissão para corrigir os campos enviados. Enquanto o backend não existe, os mesmos contratos são atendidos por dados fictícios em `js/servicos/`, para que as telas não mudem quando o Supabase entrar.

## 6. Modelo de dados

| Tabela ou recurso | Conteúdo | Acesso |
|---|---|---|
| `reports` | Dados operacionais: ponto exato, bairro, categoria, etapa (`recebida`, `em_analise`, `atendida`, `encerrada`), datas, contador de tentativas sem acesso e versão | Agentes autorizados e administrador |
| `report_visits` | Uma linha por visita: data, acesso (`com_acesso`, `fechado`, `recusado`, `nao_localizado`), tipo do local (`R`, `C`, `TB`, `PE`, `O`), foco encontrado, depósitos (`A1`, `A2`, `B`, `C`, `D1`, `D2`, `E`), ações, observação, autor e momento | Agentes autorizados e administrador; nunca público |
| `neighborhoods` | Catálogo dos 15 bairros de D33, com nome e, depois de DEP-01, o contorno no mapa | Leitura pública |
| `report_private` | Nome, CPF declarado, e-mail confirmado e telefone opcional | Todos os agentes autorizados (D11) e administrador; o cidadão lê e corrige só a própria denúncia, enquanto Recebida |
| `public_reports` | Área aproximada, bairro, categoria, data, etapa, foto tratada e descrição | Leitura pública |
| `report_events` | Início de análise, observações, visitas, encerramento, ocultação, republicação e correções, com autor e data | Agentes autorizados e administrador; nunca público nem liberado ao cidadão |
| `profiles` | Habilitação e papel (agente, administrador), ligados ao usuário do Supabase Auth | Acesso mínimo; gerido pelo administrador |
| Storage | Bucket `fotos-originais` (privado) e bucket `fotos-publicas` (versões tratadas) | Políticas separadas para cada bucket |

Cada tabela tem RLS ativado e nega tudo por padrão; as políticas liberam só o que a coluna Acesso descreve. O modelo será refinado durante a implementação. Nenhum caractere de nome, CPF ou e-mail vai para `public_reports`, e a foto pública é gerada sem metadados pessoais. As regras de proteção de cada recurso estão em [SECURITY.md](./SECURITY.md).

## 7. Fluxos técnicos da V1

### 7.1 Envio

1. Confirmar o acesso ao e-mail para aquela denúncia, sem criar conta permanente. A confirmação fica vinculada à tentativa e acontece antes do formulário longo. Expiração, reenvio e limite de tentativas são configurados em DEP-03.
2. Coletar ponto exato, bairro, categoria, descrição, de uma a três fotos, nome, CPF e telefone opcional. O endereço digitado aguarda DEP-12.
3. Validar no servidor o território, os tipos e tamanhos de arquivo e os dados.
4. Usar um ID estável por tentativa: reservar o registro como pendente, receber as fotos na área restrita, finalizar e só então gerar o protocolo.
5. Gerar a versão pública com posição aproximada e fotos tratadas. O agente vê o registro recebido imediatamente.
6. Se a publicação falhar, manter o protocolo, informar "publicação pendente" e recuperar com segurança. Repetir a tentativa não cria outra denúncia.

O banco e o Storage não compartilham transação, por isso reenvios e retentativas precisam ser idempotentes (ADR-007). Os estados técnicos do envio (pendente, finalizado, publicação pendente) são independentes das etapas Recebida, Em análise, Atendida e Encerrada.

### 7.2 Mapa público

O mapa lê somente `public_reports`: foto, descrição, bairro, categoria, data, etapa e área aproximada. Denúncias atendidas continuam visíveis; as ocultas saem. A aproximação não pode revelar o ponto exato nem deslocar o marcador para outra localidade; método e precisão são definidos em DEP-02.

### 7.3 Ocorrências do agente

O administrador libera, revoga e recupera as contas; a V1 tem uma conta de agente (D31). Todos os agentes autorizados consultam as ocorrências de Itambé inteira e os campos privados, inclusive o CPF completo. Abrir o detalhe não altera a etapa. "Iniciar análise", "Registrar visita" e "Encerrar sem acesso" são operações explícitas com autor e data.

`registrarVisita` grava a linha em `report_visits`, o evento em `report_events` e, se houver acesso, muda a etapa para Atendida, tudo numa única transação. Sem acesso, a etapa não muda e o contador de tentativas aumenta. `encerrarSemAcesso` confere no servidor se há pelo menos três tentativas. Cada visita leva um ID gerado no aparelho, para que o reenvio depois de uma falha não grave a mesma visita duas vezes. Enquanto o envio não é confirmado, o formulário fica guardado no `localStorage` do aparelho, só com os campos da visita.

O mapa de Ocorrências usa o mesmo Leaflet do mapa público, com os pontos exatos devolvidos por `listarOcorrencias`. "Como chegar" abre um link `geo:` ou do Google Maps com as coordenadas, sem rastrear o agente. A busca de ocorrências próximas é feita no servidor, com distância calculada sobre o ponto exato.

Quem inicia a análise fica registrado como autor, sem exclusividade. Denúncias diferentes no mesmo local continuam separadas. Antes de salvar, o serviço confere a etapa e a versão atuais para que uma ação concorrente ou um clique repetido não seja sobrescrito.

### 7.3.1 Relatório

A tela do relatório chama `dadosRelatorio` com período e bairro, mostra a prévia e gera o arquivo no navegador: PDF com jsPDF e AutoTable, Word (`.docx`) com a biblioteca `docx` (ADR-013). As bibliotecas só são carregadas quando o agente abre essa tela. O serviço não devolve campos de `report_private`, então o relatório não tem como incluir dados do morador. Nenhum arquivo é guardado no servidor.

Denúncias falsas ou fora do assunto seguem a regra provisória do PRD (seção 10.3) até a definição de DEP-11.

### 7.4 Ocultação e republicação

Ocultar exige motivo, preserva o registro interno e mantém a etapa. A V1 oculta a publicação inteira, incluindo o acesso público às fotos; remover só o marcador não basta se a imagem continuar acessível pela URL antiga. Cada decisão de publicação recebe uma versão, para que uma tarefa antiga não substitua uma decisão mais recente. Republicar exige ação explícita e nunca altera a etapa.

### 7.5 Correção de campos

O administrador corrige qualquer denúncia em qualquer etapa. O cidadão comprova acesso ao e-mail confirmado na denúncia e recebe uma autorização de edição restrita àquele registro, com prazo de validade e proteção contra reutilização. O serviço confere a etapa no momento de salvar: se a ocorrência já estiver Em análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato (D26). Um ponto corrigido passa de novo pela validação de território.

Cada correção grava valor original, novo valor, motivo, autor e data em `report_events`. Se a denúncia estiver publicada, só a versão pública permitida é atualizada; se estiver oculta, continua oculta. O mecanismo detalhado é fechado em DEP-08.

## 8. Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| Local | Desenvolvimento com servidor local (Live Server) e Supabase CLI | Fictícios, carregados por `seed.sql` |
| Prévia | Projeto Supabase de teste, separado do Repecol, para revisar cada entrega | Fictícios |
| Produção | Projeto Supabase próprio, aberto aos moradores após as dependências de lançamento | Reais |

As migrações são aplicadas primeiro no ambiente local, depois na prévia e só então na produção. As configurações de cada ambiente seguem [.env.example](../.env.example). Nenhum valor real entra no repositório.

## 9. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 1.2 | 05/11/2026 | Start Técnico alinhado ao PRD 1.2 |
| 2.0 | 05/11/2026 | Start Técnico alinhado ao PRD 2.0 |
| 3.0 | 11/11/2026 | Start Técnico vira `ARCHITECTURE.md`: stack, fluxo de dados, estrutura de pastas, regras de arquitetura e ambientes. Sequência de trabalho movida para TASKS.md, verificações para TEST_PLAN.md e SECURITY.md, motivos das escolhas para DECISIONS.md |
| 3.1 | 11/11/2026 | Backend proposto passa de Firebase para Supabase (ADR-012): Postgres com RLS, Storage, Auth, Edge Functions e Supabase CLI no ambiente local |
| 3.2 | 12/11/2026 | Alinhada ao PRD 2.2: contratos `registrarVisita`, `encerrarSemAcesso`, `listarOcorrenciasProximas` e `dadosRelatorio`; tabelas `report_visits` e `neighborhoods`; etapa Encerrada; relatório gerado no navegador (ADR-013) |
