# Aedes Data Lab: Estado do projeto

Retrato do momento atual do projeto. Diferente de [DECISIONS.md](./DECISIONS.md), que guarda escolhas permanentes, este arquivo muda a cada entrega. Quem concluir uma tarefa que altere o estado do projeto atualiza este arquivo no mesmo PR.

**Última atualização:** 12/11/2026

## Situação atual

Documentação e design concluídos. A implementação está no começo: o `main` tem a estrutura das 12 páginas em `site/`, todas ainda com conteúdo inicial, sem envio, banco, autenticação ou mapa.

## Concluído

- PRD 2.0 aprovado como base de construção (PR #3)
- 47 telas finais no Figma, exportadas em `wireframes/` com o requisito de cada uma
- Estrutura de documentação: PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN e SECURITY
- Estrutura inicial das páginas, do CSS compartilhado e dos módulos JavaScript em `site/`
- PRD 2.2 com o MVP da área do agente, definido no levantamento com a coordenação de endemias em 12/11/2026: a ficha em papel do PNCD não é digitalizada; o agente registra a visita com opções de toque, encerra depois de três tentativas sem acesso e baixa relatório em PDF ou Word para o supervisor. ARCHITECTURE 3.2, DESIGN 1.2, ADR-013, TEST_PLAN (AC-15 e AC-16) e TASKS atualizados juntos

## Em andamento

| Tarefa | Onde | Observação |
|---|---|---|
| TASK-022 Página Início | `site/index.html` (PR #4, ajustada depois do merge) | Primeira versão com os blocos Denuncie, Guia Aedes, Mapa de focos e Jogo, já no CSS único e nos tokens. Falta alinhar à tela 01: botão principal Denuncie aqui, cartões com borda, ilustrações, logotipo e menu (TASK-021) |

As branches `Laura-Galdino`, `Rhillary` e `sky` estão atrás do `main`. Antes de abrir PR, rodar `git merge origin/main` e, se houver conflito em README.md ou site/LEIA-ME.md, manter a versão do `main`.

## Próxima tarefa

**TASK-020:** declarar os tokens e os componentes base em `site/css/estilos.css`. Ela destrava as demais páginas da Fase 2, porque todas dependem dos mesmos botões, cartões e cores.

## Problemas conhecidos

- As telas do Figma têm divergências com o PRD (nomes de etapa, confirmação de e-mail ausente, filtros extras, agenda de visitas, notificações). Estão listadas na Fase 1 de [TASKS.md](../TASKS.md). Até a correção, vale o PRD.
- O CSS compartilhado já declara os tokens (`:root` em `site/css/estilos.css`), mas os componentes base ainda faltam (TASK-020).
- O Figma não tem estilos nem variáveis cadastrados; os tokens do DESIGN.md foram lidos nas telas, sem cores inventadas.
- A etiqueta Em análise tem dois estilos no Figma (bege no mapa público, amarela na área dos agentes), e as etiquetas Recebida e Oculta não foram desenhadas (TASK-012).
- A tela 45 (Portal técnico) foi exportada por captura, porque as camadas estão fora do frame no Figma.
- A página de login dos agentes se chama `agentes/Login.html`, com inicial maiúscula, fora do padrão de nomes do RULES.md. Renomear junto com a TASK-025.
- As telas 42, 46 e 47 ainda mostram a área do agente anterior ao PRD 2.2 (Programar visita, caixa de conclusão, barra com Meu trabalho e Dashboard, bairros que não são de Itambé). O redesenho está nas TASK-015 a TASK-016b. As páginas `agentes/mapa.html`, `agentes/meu-trabalho.html` e `agentes/dashboard.html` continuam como espaço reservado, fora da V1.

## Decisões pendentes

- DEP-10, DEP-11 e DEP-12: decisões de produto em aberto (PRD, seção 18).
- DEP-01: os 15 bairros estão definidos (D33); falta o contorno de cada um no mapa.
- Confirmar com a coordenação se o raio de 150 m para ocorrências próximas (D34) é o que eles esperam; o pedido original falava em "150 metros quadrados".
- DEP-04 e DEP-05: nome da instituição parceira, e-mail de contato e responsável pela conferência diária.
- Filtros por origem, tipo, distrito, rua e área, que aparecem nas telas e não estão no PRD.
- Backend: Supabase está proposto no lugar do Firebase (ADR-012). Confirmar antes da Fase 6.
