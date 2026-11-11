# Aedes Data Lab: Tarefas

Lista de trabalho da V1, dividida em fases pequenas. Cada tarefa cita a tela em [wireframes/](wireframes/README.md) e o requisito do [PRD](docs/PRD.md) que ela atende. A forma de trabalhar está em [docs/RULES.md](docs/RULES.md).

**Como usar**

- Pegue uma tarefa por vez e escreva seu nome ao lado dela: `- [ ] TASK-023 … (Maria)`.
- Siga o ciclo: implementar → testar → revisar → marcar como concluída → próxima tarefa.
- As fases 4 e 5 são fatias verticais: cada uma leva um fluxo do começo ao fim, da tela ao dado, antes de passar para o próximo.
- Ao concluir, marque `[x]` e atualize [docs/MEMORY.md](docs/MEMORY.md) se o estado do projeto mudou.

## Fase 0 · Documentação

- [x] TASK-001 Aprovar o PRD 2.0 como base de construção
- [x] TASK-002 Concluir as telas no Figma e exportar para `wireframes/`
- [x] TASK-003 Organizar a documentação em PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN e SECURITY

## Fase 1 · Ajustes de design no Figma

Divergências encontradas entre as telas finais e o PRD. Até serem resolvidas, a implementação segue o PRD.

- [ ] TASK-010 Cadastrar as cores, fontes e raios do [DESIGN.md](docs/DESIGN.md) como estilos ou variáveis no Figma
- [ ] TASK-011 Trocar Segoe UI por Inter nas telas que ainda usam a fonte antiga
- [ ] TASK-012 Usar os nomes de etapa do PRD: o filtro de status mostra "Não visualizados / Resolvidos" e a tela de protocolo mostra "Em análise" logo após o envio (telas 12 e 25; PRD seção 10)
- [ ] TASK-013 Desenhar a confirmação de e-mail antes do formulário (RF-AUT-01)
- [ ] TASK-014 Desenhar a correção da denúncia pelo cidadão enquanto ela está Recebida (RF-COR-01, D26)
- [ ] TASK-015 Conferir se o detalhe do agente cobre iniciar análise, registrar observação, concluir, ocultar e republicar (tela 46; RF-AGE-02 a RF-AGE-06)
- [ ] TASK-016 Retirar ou marcar como fase seguinte os botões "Programar visita" e "Registrar visita" (tela 46; agenda de visitas fora da V1)
- [ ] TASK-017 Retirar o aceite de "receber atualizações" do passo 3 (tela 09; notificações fora da V1)
- [ ] TASK-018 Corrigir restos do Repecol: endereço `repecol.web.app` nas barras de navegador e textos de Quem somos (telas 01 a 06 e outras)
- [ ] TASK-019 Colocar as camadas do Portal técnico dentro do frame e exportar de novo (tela 45)

## Fase 2 · Base do site (HTML e CSS)

- [ ] TASK-020 Declarar os tokens e os componentes base em `site/css/estilos.css` (DESIGN, seção 8)
- [ ] TASK-021 Menu compartilhado da área pública (tela 02; `js/compartilhado/menu.js`)
- [ ] TASK-022 Página Início (tela 01) · em andamento na branch `Maria-Beatriz`, ver MEMORY.md
- [ ] TASK-023 HTML da denúncia: passos 1 a 4, enviada, campos obrigatórios e falha (telas 07 a 15)
- [ ] TASK-024 HTML do mapa público: mapa, lista, detalhe e menu de filtros (telas 16 a 24, 27, 28)
- [ ] TASK-025 HTML do Portal técnico (tela 45; `agentes/Login.html`)
- [ ] TASK-026 HTML de Ocorrências e do detalhe da ocorrência (telas 46 e 47)
- [ ] TASK-027 Páginas complementares: Guia Aedes, Repelentes, Quem somos e Entrada do jogo (telas 03 a 06)

## Fase 3 · Dados fictícios

- [ ] TASK-030 Definir o formato de uma denúncia (público, privado e eventos) em `js/servicos/`
- [ ] TASK-031 Serviço fictício que atende os contratos da ARCHITECTURE, seção 5
- [ ] TASK-032 Criar `js/dominio/` com etapas, validação de CPF e regra de território provisória

## Fase 4 · Fatia vertical 1: da denúncia ao mapa (dados fictícios)

- [ ] TASK-040 Passo 1: marcar o ponto manualmente e usar GPS opcional (telas 07, 35 a 37; RF-DEN-02)
- [ ] TASK-041 Passo 2: fotos com prévia, remoção e limite de três (telas 08 e 14; RF-DEN-03)
- [ ] TASK-042 Passo 3: identificação e contato com validação de CPF (tela 09; RF-DEN-01)
- [ ] TASK-043 Passo 4: revisão separando público e privado, envio com bloqueio de clique (telas 10 e 11; RF-DEN-01, RF-DEN-04)
- [ ] TASK-044 Protocolo, publicação pendente e falha no envio (telas 12, 13 e 15; RF-DEN-04, RF-DEN-05)
- [ ] TASK-045 Mapa lê as denúncias fictícias, mostra área aproximada e abre o detalhe (telas 16 a 22; RF-MAP-01)
- [ ] TASK-046 Filtros por localidade, período e etapa, com estados vazio, sem resultado e erro (telas 23, 24, 27, 28; RF-MAP-02)

## Fase 5 · Fatia vertical 2: área do agente (dados fictícios)

- [ ] TASK-050 Lista de ocorrências com filtros e ordenação (tela 47; RF-AGE-01)
- [ ] TASK-051 Detalhe com ponto exato, dados privados e histórico (tela 46; RF-AGE-01)
- [ ] TASK-052 Iniciar análise e registrar observações (RF-AGE-02, RF-AGE-05)
- [ ] TASK-053 Concluir após visita (RF-AGE-03)
- [ ] TASK-054 Ocultar e republicar (RF-AGE-04, RF-AGE-06)

## Fase 6 · Firebase

- [ ] TASK-060 Criar o projeto Firebase de teste, separado do Repecol, e configurar o Emulator Suite
- [ ] TASK-061 Criar as coleções e as regras de acesso público e privado, com testes de acesso negado (SECURITY.md)
- [ ] TASK-062 Login individual dos agentes e papéis de agente e administrador (RF-AUT-02)
- [ ] TASK-063 Trocar o serviço fictício pelo Firebase sem alterar as telas

## Fase 7 · Envio real

- [ ] TASK-070 Confirmação de e-mail por denúncia (RF-AUT-01; depende de DEP-03)
- [ ] TASK-071 Upload das fotos, tratamento e remoção de metadados (RF-DEN-03)
- [ ] TASK-072 Gravação idempotente e geração do protocolo (RF-DEN-04)
- [ ] TASK-073 Geração da versão pública e recuperação de publicação pendente (RF-DEN-05)

## Fase 8 · Operação real

- [ ] TASK-080 Ocorrências com dados reais e controle de ações simultâneas (RF-AGE-01 a RF-AGE-03)
- [ ] TASK-081 Ocultação e republicação com versão de decisão (RF-AGE-04, RF-AGE-06)
- [ ] TASK-082 Correção pelo administrador e pelo cidadão (RF-COR-01; depende de DEP-08)

## Fase 9 · Validação da V1

- [ ] TASK-090 Executar os cenários AC-01 a AC-14 do [TEST_PLAN.md](docs/TEST_PLAN.md) e registrar as evidências
- [ ] TASK-091 Inspecionar as respostas de rede públicas em busca de dados privados (AC-07)
- [ ] TASK-092 Revisar a lista de verificação do [SECURITY.md](docs/SECURITY.md)

## Fase 10 · Lançamento

- [ ] TASK-100 Resolver as dependências de lançamento DEP-01 a DEP-09 (PRD, seção 18)
- [ ] TASK-101 Criar o ambiente de produção com limites de custo e monitoramento
- [ ] TASK-102 Testar no endereço publicado antes de divulgar aos moradores

## Decisões de produto pendentes

- [ ] DEP-10 Dados no envio em nome de terceiros, envio assistido e menores de idade
- [ ] DEP-11 Encerramento de denúncias inválidas que não exigem visita
- [ ] DEP-12 Obrigatoriedade do endereço digitado
- [ ] Filtros por origem, tipo, distrito, rua e área: incluir no PRD ou retirar das telas (telas 26, 29 a 34)

## Fase seguinte (fora da V1)

- Dashboard e gráficos (telas 43 e 44)
- Mapa técnico dedicado e Meu trabalho
- Agenda de visitas
