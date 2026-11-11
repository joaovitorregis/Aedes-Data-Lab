# Aedes Data Lab: Estado do projeto

Retrato do momento atual do projeto. Diferente de [DECISIONS.md](./DECISIONS.md), que guarda escolhas permanentes, este arquivo muda a cada entrega. Quem concluir uma tarefa que altere o estado do projeto atualiza este arquivo no mesmo PR.

**Última atualização:** 11/11/2026

## Situação atual

Documentação e design concluídos. A implementação está no começo: o `main` tem a estrutura das 12 páginas em `site/`, todas ainda com conteúdo inicial, sem envio, banco, autenticação ou mapa.

## Concluído

- PRD 2.0 aprovado como base de construção (PR #3)
- 47 telas finais no Figma, exportadas em `wireframes/` com o requisito de cada uma
- Estrutura de documentação: PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN e SECURITY
- Estrutura inicial das páginas, do CSS compartilhado e dos módulos JavaScript em `site/`

## Em andamento

| Tarefa | Onde | Observação |
|---|---|---|
| TASK-022 Página Início | branch `Maria-Beatriz` | Primeira versão do HTML da Início com os cartões Denuncie, Guia Aedes, Mapa de focos e Jogo. Antes do PR precisa: mover para `site/index.html` (hoje está em `site/agentes/início.html`, que é a área dos agentes), tirar o acento do nome do arquivo e passar os estilos dos arquivos `início.css` para `site/css/estilos.css` usando os tokens do DESIGN.md |

As branches `Laura-Galdino`, `Rhillary` e `sky` ainda não têm alterações de código em relação ao `main`.

## Próxima tarefa

**TASK-020:** declarar os tokens e os componentes base em `site/css/estilos.css`. Ela destrava as demais páginas da Fase 2, porque todas dependem dos mesmos botões, cartões e cores.

## Problemas conhecidos

- As telas do Figma têm divergências com o PRD (nomes de etapa, confirmação de e-mail ausente, filtros extras, agenda de visitas, notificações). Estão listadas na Fase 1 de [TASKS.md](../TASKS.md). Até a correção, vale o PRD.
- O Figma não tem estilos nem variáveis cadastrados; os tokens do DESIGN.md foram medidos nas telas.
- A tela 45 (Portal técnico) foi exportada por captura, porque as camadas estão fora do frame no Figma.
- A página de login dos agentes se chama `agentes/Login.html`, com inicial maiúscula, fora do padrão de nomes do RULES.md. Renomear junto com a TASK-025.

## Decisões pendentes

- DEP-10, DEP-11 e DEP-12: decisões de produto em aberto (PRD, seção 18).
- DEP-04 e DEP-05: nome da instituição parceira, e-mail de contato e responsável pela conferência diária.
- Filtros por origem, tipo, distrito, rua e área, que aparecem nas telas e não estão no PRD.
