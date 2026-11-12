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
- [ ] TASK-012 Usar os nomes de etapa do PRD: o filtro de status mostra "Não visualizados / Resolvidos", a tela de protocolo mostra "Em análise" logo após o envio e a área dos agentes escreve "Atendido" (telas 12, 25, 46 e 47; PRD seção 10)
- [ ] TASK-012a Unificar as etiquetas de etapa: Em análise usa fundo `#D9CBB0` no mapa público e `#FFEA83` na área dos agentes, com raios diferentes; desenhar também Recebida, Encerrada, Oculta e Sem acesso (DESIGN.md, seção 5; PRD D29)
- [ ] TASK-012b Desenhar o botão de ocultar publicação e os estados de foco, desabilitado e "Enviando…" dos botões (DESIGN.md, seção 5)
- [ ] TASK-013 Desenhar a confirmação de e-mail antes do formulário (RF-AUT-01)
- [ ] TASK-014 Desenhar a correção da denúncia pelo cidadão enquanto ela está Recebida (RF-COR-01, D26)
- [ ] TASK-015 Redesenhar o detalhe da ocorrência: fotos ampliáveis, "Como chegar", endereço e referência, bloco do morador com telefone para ligar, estado de publicação, ocorrências próximas em 150 m, histórico com visitas e botões por etapa; ocultar e republicar num menu (tela 46; RF-AGE-01 a RF-AGE-07)
- [ ] TASK-015a Desenhar a tela Registrar visita, com os estados com acesso, sem acesso e erro de envio (PRD seção 8.1; RF-AGE-03)
- [ ] TASK-015b Desenhar as opções de toque e a janela de confirmação, incluindo "Encerrar sem acesso" (DESIGN.md, seção 5; RF-AGE-03, RF-AGE-07)
- [ ] TASK-015c Redesenhar Ocorrências: resumo por etapa, dias em aberto, etiquetas Sem acesso e Oculta, filtro Sem acesso, ordem por mais antigas, botão Lista/Mapa e marcadores por etapa; trocar a barra inferior por Ocorrências e Sair (tela 47; RF-AGE-01)
- [ ] TASK-015d Desenhar a tela Relatório: período, bairro, formato, prévia e estado sem dados (RF-AGE-08)
- [ ] TASK-016 Retirar "Programar visita", a caixa "Conclusão" e o botão "Salvar conclusão e marcar atendimento" da tela 46; a conclusão passa a ser feita em Registrar visita (D28)
- [ ] TASK-016a Retirar a tela 42 (mapa do agente), que passa a ficar dentro de Ocorrências (RF-AGE-01)
- [ ] TASK-016b Trocar os bairros fictícios das telas (Centro, São José, Torre, Bongi) pelos 15 bairros de Itambé (D33)
- [ ] TASK-017 Retirar o aceite de "receber atualizações" do passo 3 (tela 09; notificações fora da V1)
- [ ] TASK-018 Corrigir restos do Repecol: endereço `repecol.web.app` nas barras de navegador e textos de Quem somos (telas 01 a 06 e outras)
- [ ] TASK-019 Colocar as camadas do Portal técnico dentro do frame e exportar de novo (tela 45)

## Fase 2 · Base do site (HTML e CSS)

- [ ] TASK-020 Declarar os tokens e os componentes base em `site/css/estilos.css` (DESIGN, seção 8)
- [ ] TASK-021 Menu compartilhado da área pública (tela 02; `js/compartilhado/menu.js`)
- [ ] TASK-022 Página Início (tela 01) · primeira versão em `site/index.html`; falta alinhar à tela, ver MEMORY.md
- [ ] TASK-023 HTML da denúncia: passos 1 a 4, enviada, campos obrigatórios e falha (telas 07 a 15)
- [ ] TASK-024 HTML do mapa público: mapa, lista, detalhe e menu de filtros (telas 16 a 24, 27, 28)
- [ ] TASK-025 HTML do Portal técnico (tela 45; `agentes/Login.html`)
- [ ] TASK-026 HTML de Ocorrências e do detalhe da ocorrência (telas 46 e 47)
- [ ] TASK-027 Páginas complementares: Guia Aedes, Repelentes, Quem somos e Entrada do jogo (telas 03 a 06)

## Fase 3 · Dados fictícios

- [ ] TASK-030 Definir o formato de uma denúncia (público, privado, eventos e visitas) em `js/servicos/`
- [ ] TASK-031 Serviço fictício que atende os contratos da ARCHITECTURE, seção 5, incluindo `registrarVisita`, `encerrarSemAcesso`, `listarOcorrenciasProximas` e `dadosRelatorio`
- [ ] TASK-032 Criar `js/dominio/` com etapas (incluindo Encerrada), validação de CPF, regra de território provisória, catálogo dos 15 bairros e códigos da visita (tipo do local, depósitos, ações)
- [ ] TASK-033 Dados fictícios com ocorrências em todas as etapas, visitas com e sem acesso, uma ocorrência com três tentativas e duas denúncias a menos de 150 m

## Fase 4 · Fatia vertical 1: da denúncia ao mapa (dados fictícios)

- [ ] TASK-040 Passo 1: marcar o ponto manualmente e usar GPS opcional (telas 07, 35 a 37; RF-DEN-02)
- [ ] TASK-041 Passo 2: fotos com prévia, remoção e limite de três (telas 08 e 14; RF-DEN-03)
- [ ] TASK-042 Passo 3: identificação e contato com validação de CPF (tela 09; RF-DEN-01)
- [ ] TASK-043 Passo 4: revisão separando público e privado, envio com bloqueio de clique (telas 10 e 11; RF-DEN-01, RF-DEN-04)
- [ ] TASK-044 Protocolo, publicação pendente e falha no envio (telas 12, 13 e 15; RF-DEN-04, RF-DEN-05)
- [ ] TASK-045 Mapa lê as denúncias fictícias, mostra área aproximada e abre o detalhe (telas 16 a 22; RF-MAP-01)
- [ ] TASK-046 Filtros por localidade, período e etapa, com estados vazio, sem resultado e erro (telas 23, 24, 27, 28; RF-MAP-02)

## Fase 5 · Fatia vertical 2: área do agente (dados fictícios)

- [ ] TASK-050 Lista de ocorrências com resumo por etapa, dias em aberto, etiquetas, filtros (incluindo Sem acesso) e ordem por mais antigas (tela 47; RF-AGE-01)
- [ ] TASK-050a Alternância Lista/Mapa dentro de Ocorrências, com marcadores por etapa e os mesmos filtros (RF-AGE-01)
- [ ] TASK-051 Detalhe com fotos, ponto exato, "Como chegar", endereço, dados do morador, estado de publicação e histórico (tela 46; RF-AGE-01)
- [ ] TASK-051a Aviso de ocorrências próximas em 150 m (RF-AGE-01, D34)
- [ ] TASK-052 Iniciar análise e registrar observações (RF-AGE-02, RF-AGE-05)
- [ ] TASK-053 Registrar visita com acesso, com resumo e confirmação, levando a Atendida (RF-AGE-03)
- [ ] TASK-053a Registrar visita sem acesso, com contador de tentativas (RF-AGE-03)
- [ ] TASK-053b Encerrar sem acesso a partir da terceira tentativa (RF-AGE-07)
- [ ] TASK-053c Guardar o formulário de visita no aparelho quando o envio falhar e reenviar sem duplicar (RF-AGE-03, RNF-11)
- [ ] TASK-054 Ocultar e republicar com motivo (RF-AGE-04, RF-AGE-06)
- [ ] TASK-055 Tela do relatório com período, bairro e prévia (RF-AGE-08)
- [ ] TASK-056 Gerar o relatório em PDF com jsPDF e AutoTable (RF-AGE-08, ADR-013)
- [ ] TASK-057 Gerar o relatório em Word com a biblioteca `docx` (RF-AGE-08, ADR-013)

## Fase 6 · Supabase

- [ ] TASK-060 Criar o projeto Supabase de teste, separado do Repecol, e configurar a Supabase CLI no ambiente local
- [ ] TASK-061 Criar as tabelas (incluindo `report_visits` e `neighborhoods`), os buckets e as políticas de RLS em migrações, com testes de acesso negado (SECURITY.md)
- [ ] TASK-062 Login individual dos agentes e papéis de agente e administrador (RF-AUT-02)
- [ ] TASK-063 Trocar o serviço fictício pelo Supabase sem alterar as telas

## Fase 7 · Envio real

- [ ] TASK-070 Confirmação de e-mail por denúncia (RF-AUT-01; depende de DEP-03)
- [ ] TASK-071 Upload das fotos, tratamento e remoção de metadados (RF-DEN-03)
- [ ] TASK-072 Gravação idempotente e geração do protocolo (RF-DEN-04)
- [ ] TASK-073 Geração da versão pública e recuperação de publicação pendente (RF-DEN-05)

## Fase 8 · Operação real

- [ ] TASK-080 Ocorrências com dados reais, visitas gravadas em transação e controle de ações simultâneas (RF-AGE-01 a RF-AGE-03, RF-AGE-07)
- [ ] TASK-080a Relatório com dados reais, conferindo que `dadosRelatorio` não devolve campos privados (RF-AGE-08, RNF-12)
- [ ] TASK-081 Ocultação e republicação com versão de decisão (RF-AGE-04, RF-AGE-06)
- [ ] TASK-082 Correção pelo administrador e pelo cidadão (RF-COR-01; depende de DEP-08)

## Fase 9 · Validação da V1

- [ ] TASK-090 Executar os cenários AC-01 a AC-16 do [TEST_PLAN.md](docs/TEST_PLAN.md) e registrar as evidências
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
- [ ] DEP-01 Contorno de cada um dos 15 bairros no mapa (os nomes já estão em D33)
- [ ] Filtros por origem, tipo, distrito, rua e área: incluir no PRD ou retirar das telas (telas 26, 29 a 34)

## Fase seguinte (fora da V1)

- Dashboard e gráficos (telas 43 e 44)
- Mapa técnico dedicado e Meu trabalho
- Agenda de visitas
