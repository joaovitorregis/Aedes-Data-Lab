# Aedes Data Lab: Estado do projeto

Retrato do momento atual do projeto. Diferente de [DECISIONS.md](./DECISIONS.md), que guarda escolhas permanentes, este arquivo muda a cada entrega. Quem concluir uma tarefa que altere o estado do projeto atualiza este arquivo no mesmo PR.

**Última atualização:** 14/11/2026

## Situação atual

A documentação está alinhada ao [PRD 2.3](./PRD.md), e o fluxo da denúncia está desenhado no Figma. A implementação está no começo: o `main` tem a estrutura das 12 páginas em `site/`, todas ainda com conteúdo inicial, sem envio, banco, autenticação ou mapa.

## Concluído

- PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN e SECURITY, cada um com um papel só (README, seção Documentação)
- Estrutura inicial das páginas, do CSS compartilhado e dos módulos JavaScript em `site/`
- Telas do Figma exportadas em `wireframes/` (47 telas, anteriores ao fluxo novo da denúncia)
- Área do agente definida no PRD 2.2 a partir do levantamento com a coordenação de endemias: ficha do PNCD não digitalizada, registro de visita, encerramento após três tentativas sem acesso e relatório em PDF e Word
- Fluxo da denúncia definido no PRD 2.3: da tela Início ao protocolo, com e-mail e telefone obrigatórios e código confirmado depois dos dados, por e-mail, SMS ou WhatsApp
- Fluxo da denúncia desenhado no Figma: 22 telas na seção 02 da jornada do usuário, com os estados de erro. A versão anterior está arquivada fora da jornada, e os links de entrada abrem a Localização nova

## Em andamento

| Tarefa | Onde | Observação |
|---|---|---|
| TASK-022 Página Início | `site/index.html` | Primeira versão com os blocos Denuncie, Guia Aedes, Mapa de focos e Jogo, já no CSS único e nos tokens. Falta alinhar à tela Início do Figma: botão principal Denuncie aqui, cartões com borda, ilustrações, logotipo e menu (TASK-021) |

As branches `Laura-Galdino`, `Rhillary` e `sky` estão atrás do `main`. Antes de abrir PR, rodar `git merge origin/main` e, se houver conflito em README.md ou site/LEIA-ME.md, manter a versão do `main`.

## Próxima tarefa

**TASK-020:** declarar os tokens e os componentes base em `site/css/estilos.css`. Ela destrava as demais páginas da Fase 2, porque todas dependem dos mesmos botões, cartões e cores.

## Problemas conhecidos

- O fluxo da denúncia no Figma tem telas inteiras, mas ainda não está exportado para `wireframes/` (TASK-013a). Até lá, `wireframes/` mostra a denúncia anterior; vale o PRD.
- O mapa das telas de localização é uma imagem ilustrativa de Itambé/BA, não de Itambé/PE (D37, TASK-013b). Ele não valida território nem posição de pontos.
- Algumas telas antigas do Figma divergem do PRD: nomes de etapa, filtros extras, agenda de visitas e a área do agente anterior ao PRD 2.2. As correções estão na Fase 1 de [TASKS.md](../TASKS.md).
- O CSS compartilhado já declara os tokens (`:root` em `site/css/estilos.css`), mas os componentes base ainda faltam (TASK-020).
- O Figma não tem estilos nem variáveis cadastrados (TASK-010).
- A etiqueta Em análise tem dois estilos no Figma, e as etiquetas Recebida, Encerrada, Oculta e Sem acesso não foram desenhadas (TASK-012a).
- A página de login dos agentes se chama `agentes/Login.html`, com inicial maiúscula, fora do padrão de nomes do RULES.md. Renomear junto com a TASK-025.
- As páginas `agentes/mapa.html`, `agentes/meu-trabalho.html` e `agentes/dashboard.html` continuam como espaço reservado, fora da V1.

## Decisões pendentes

Todas estão no [PRD, seção 18](./PRD.md) (DEP-01 a DEP-14). As que bloqueiam o próximo trabalho:

- DEP-13 (filtros extras nas telas) antes dos filtros do mapa.
- DEP-14 (raio de 150 m) antes do aviso de ocorrências próximas.
- DEP-01 (mapa real e contornos) antes da validação de território e da troca do mapa ilustrativo.
