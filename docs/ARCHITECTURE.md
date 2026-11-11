# Aedes Data Lab: Arquitetura

| Campo | Valor |
|---|---|
| Versão | 3.0 · 11/11/2026 |
| Estado | Aprovada como base de construção; serviços ainda não implementados |
| Documentos relacionados | [PRD](./PRD.md) · [Decisões](./DECISIONS.md) · [Segurança](./SECURITY.md) · [Tarefas](../TASKS.md) |

Este documento descreve **como** o Aedes Data Lab será construído. O que o produto faz e as regras de aceite estão no [PRD](./PRD.md); se os dois divergirem sobre comportamento, vale o PRD. As escolhas técnicas e seus motivos ficam registrados em [DECISIONS.md](./DECISIONS.md).

## 1. Stack

| Camada | Escolha | Situação |
|---|---|---|
| Interface | HTML, um CSS compartilhado e JavaScript em módulos ES, sem framework | Decidida (ADR-001, ADR-002) |
| Mapas | Leaflet, com provedor de camada visual a escolher | Proposta (ADR-005, DEP-07) |
| Backend | Firebase: Cloud Functions para as operações que validam e autorizam | Decidida a plataforma (ADR-003); composição em ajuste |
| Banco de dados | Cloud Firestore, com coleções separadas para dados públicos e privados | Proposta (ADR-004) |
| Arquivos | Cloud Storage, com área restrita para originais e área pública para fotos tratadas | Proposta |
| Autenticação | Firebase Authentication para agentes e administrador; confirmação de e-mail por denúncia para o cidadão | Proposta (ADR-006) |
| Ambiente local | Firebase Emulator Suite; Vite opcional, quando ajudar | Proposta |
| Hospedagem | A definir junto com o custo (DEP-07) | Em aberto |
| Versionamento | Git e GitHub, com PR revisado antes de entrar no `main` | Em uso |
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
Cloud Functions: validar, autorizar, gravar
      ↓
Firestore e Storage
      ↓
Versão pública (public_reports) → Mapa
```

As telas nunca falam direto com o banco. Toda leitura e escrita passa pela camada de serviços, e toda operação que muda dados passa por uma função no servidor que confere permissão, etapa e território.

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
│   │   └── servicos/      Chamadas ao Firebase e dados fictícios
│   └── assets/imagens/
├── functions/             Cloud Functions (criada na tarefa de backend)
├── tests/                 Testes (criada junto com a primeira lógica)
├── wireframes/            Telas finais exportadas do Figma
├── TASKS.md
├── .env.example
└── README.md
```

As pastas `js/dominio/`, `functions/` e `tests/` ainda não existem; elas são criadas pelas tarefas indicadas em [TASKS.md](../TASKS.md).

## 4. Regras de arquitetura

- A página HTML contém estrutura; o comportamento fica no módulo JavaScript da própria tela.
- Nenhum módulo de tela acessa o Firestore ou o Storage. Isso é papel de `js/servicos/`.
- Regras de negócio (etapas, validação de CPF, território, aproximação) ficam em `js/dominio/` e são repetidas no servidor. A validação do navegador só orienta.
- Permissão, etapa e território são conferidos no servidor em toda operação que altera dados.
- O navegador do visitante só recebe a coleção pública. Esconder campos na tela não conta como proteção.
- Componentes visuais repetidos (botão, cartão, etiqueta de etapa) usam as classes de [DESIGN.md](./DESIGN.md), nunca estilos soltos por página.

## 5. Contratos da camada de serviços

| Contrato | Quem pode chamar |
|---|---|
| `confirmarEmail` | Qualquer pessoa, com limite de repetição (RNF-08) |
| `salvarDenuncia` | Pessoa com e-mail confirmado para aquela tentativa |
| `listarDenunciasPublicas` | Qualquer pessoa; lê só a versão pública |
| `listarOcorrencias` | Agente autorizado |
| `iniciarAnalise`, `registrarObservacao`, `concluirOcorrencia` | Agente autorizado |
| `ocultarPublicacao`, `republicarOcorrencia` | Agente autorizado |
| `corrigirCamposDenuncia` | Administrador, em qualquer etapa; cidadão com vínculo comprovado, só na própria denúncia e só enquanto Recebida (D26) |

Ter apenas o papel de agente não dá permissão para corrigir os campos enviados. Enquanto o backend não existe, os mesmos contratos são atendidos por dados fictícios em `js/servicos/`, para que as telas não mudem quando o Firebase entrar.

## 6. Modelo de dados

| Recurso | Conteúdo | Acesso |
|---|---|---|
| `reports/{id}` | Dados operacionais: ponto exato, bairro, categoria, etapa, datas e versão | Agentes autorizados e administrador |
| `report_private/{id}` | Nome, CPF declarado, e-mail confirmado e telefone opcional | Todos os agentes autorizados (D11) e administrador; o cidadão lê e corrige só a própria denúncia, enquanto Recebida |
| `public_reports/{id}` | Área aproximada, bairro, categoria, data, etapa, foto tratada e descrição | Leitura pública |
| `report_events/{id}` | Início de análise, observações, atendimento, ocultação, republicação e correções, com autor e data | Agentes autorizados e administrador; nunca público nem liberado ao cidadão |
| `users/{uid}` | Habilitação e papel (agente, administrador) | Acesso mínimo; gerido pelo administrador |
| Storage | Fotos originais em área restrita e versões públicas tratadas | Regras separadas para cada área |

O modelo será refinado durante a implementação. Nenhum caractere de nome, CPF ou e-mail vai para `public_reports`, e a foto pública é gerada sem metadados pessoais. As regras de proteção de cada recurso estão em [SECURITY.md](./SECURITY.md).

## 7. Fluxos técnicos da V1

### 7.1 Envio

1. Confirmar o acesso ao e-mail para aquela denúncia, sem criar conta permanente. A confirmação fica vinculada à tentativa e acontece antes do formulário longo. Expiração, reenvio e limite de tentativas são configurados em DEP-03.
2. Coletar ponto exato, bairro, categoria, descrição, de uma a três fotos, nome, CPF e telefone opcional. O endereço digitado aguarda DEP-12.
3. Validar no servidor o território, os tipos e tamanhos de arquivo e os dados.
4. Usar um ID estável por tentativa: reservar o registro como pendente, receber as fotos na área restrita, finalizar e só então gerar o protocolo.
5. Gerar a versão pública com posição aproximada e fotos tratadas. O agente vê o registro recebido imediatamente.
6. Se a publicação falhar, manter o protocolo, informar "publicação pendente" e recuperar com segurança. Repetir a tentativa não cria outra denúncia.

Firestore e Storage não compartilham transação, por isso reenvios e retentativas precisam ser idempotentes (ADR-007). Os estados técnicos do envio (pendente, finalizado, publicação pendente) são independentes das etapas Recebida, Em análise e Atendida.

### 7.2 Mapa público

O mapa lê somente `public_reports`: foto, descrição, bairro, categoria, data, etapa e área aproximada. Denúncias atendidas continuam visíveis; as ocultas saem. A aproximação não pode revelar o ponto exato nem deslocar o marcador para outra localidade; método e precisão são definidos em DEP-02.

### 7.3 Ocorrências do agente

O administrador libera, revoga e recupera as contas. Todos os agentes autorizados consultam as ocorrências de Itambé inteira e os campos privados, inclusive o CPF completo. Abrir o detalhe não altera a etapa. "Iniciar análise" e "Concluir" são operações explícitas com autor e data, e a conclusão exige visita ao local, data, ação realizada e observações. Sem solução, a ocorrência fica Em análise e recebe novas observações.

Quem inicia a análise fica registrado como autor, sem exclusividade. Denúncias diferentes no mesmo local continuam separadas. Antes de salvar, o serviço confere a etapa e a versão atuais para que uma ação concorrente não seja sobrescrita.

Denúncias falsas ou fora do assunto seguem a regra provisória do PRD (seção 10.3) até a definição de DEP-11.

### 7.4 Ocultação e republicação

Ocultar exige motivo, preserva o registro interno e mantém a etapa. A V1 oculta a publicação inteira, incluindo o acesso público às fotos; remover só o marcador não basta se a imagem continuar acessível pela URL antiga. Cada decisão de publicação recebe uma versão, para que uma tarefa antiga não substitua uma decisão mais recente. Republicar exige ação explícita e nunca altera a etapa.

### 7.5 Correção de campos

O administrador corrige qualquer denúncia em qualquer etapa. O cidadão comprova acesso ao e-mail confirmado na denúncia e recebe uma autorização de edição restrita àquele registro, com prazo de validade e proteção contra reutilização. O serviço confere a etapa no momento de salvar: se a ocorrência já estiver Em análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato (D26). Um ponto corrigido passa de novo pela validação de território.

Cada correção grava valor original, novo valor, motivo, autor e data em `report_events`. Se a denúncia estiver publicada, só a versão pública permitida é atualizada; se estiver oculta, continua oculta. O mecanismo detalhado é fechado em DEP-08.

## 8. Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| Local | Desenvolvimento com servidor local (Live Server) e Firebase Emulator Suite | Fictícios |
| Prévia | Projeto Firebase de teste, separado do Repecol, para revisar cada entrega | Fictícios |
| Produção | Projeto Firebase próprio, aberto aos moradores após as dependências de lançamento | Reais |

As configurações de cada ambiente seguem [.env.example](../.env.example). Nenhum valor real entra no repositório.

## 9. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 1.2 | 05/11/2026 | Start Técnico alinhado ao PRD 1.2 |
| 2.0 | 05/11/2026 | Start Técnico alinhado ao PRD 2.0 |
| 3.0 | 11/11/2026 | Start Técnico vira `ARCHITECTURE.md`: stack, fluxo de dados, estrutura de pastas, regras de arquitetura e ambientes. Sequência de trabalho movida para TASKS.md, verificações para TEST_PLAN.md e SECURITY.md, motivos das escolhas para DECISIONS.md |
