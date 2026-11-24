# Aedes Data Lab: Tarefas

Lista de trabalho da V1, dividida em fases pequenas. Cada tarefa cita a tela e o requisito do [PRD](docs/PRD.md) que ela atende. Telas numeradas (01 a 47) estão em [wireframes/](wireframes/README.md); telas da denúncia citadas pelo nome (02 Localização, 05 Escolher canal…) são as da seção 02 da jornada do usuário no [Figma](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y/Aedes-Data-Lab-%C2%B7-Wireframes-por-p%C3%A1gina?node-id=2014-13). A forma de trabalhar está em [docs/RULES.md](docs/RULES.md).

**Como usar**

- Pegue uma tarefa por vez e escreva seu nome ao lado dela: `- [ ] TASK-023 … (Maria)`.
- Siga o ciclo: implementar → testar → revisar → marcar como concluída → próxima tarefa.
- As fases 4 e 5 são fatias verticais: cada uma leva um fluxo do começo ao fim, da tela ao dado, antes de passar para o próximo.
- Ao concluir, marque `[x]` e atualize a seção Estado do projeto, logo abaixo, se o estado do projeto mudou.

## Estado do projeto

Retrato do momento atual, atualizado a cada entrega. Quem concluir uma tarefa que altere o estado do projeto atualiza esta seção no mesmo PR. As escolhas permanentes ficam em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#9-decisões-técnicas-adr).

**Última atualização:** 23/11/2026

### Situação atual

A documentação está alinhada ao [PRD 2.9](docs/PRD.md), e o fluxo da denúncia e a jornada do agente estão desenhados no Figma. O `main` tem a estrutura das 12 páginas em `site/`, ainda com conteúdo inicial. O back-end do Supabase (9 migrations, 6 Edge Functions) está **aplicado e provado no projeto de teste**: denúncia ponta a ponta com fotos, código por e-mail real, leitura pública sem dados privados e fluxo do agente (iniciar análise, observação, arquivar, voltar ao mapa, rotina diária). O site ainda não o usa; a ligação do front (formulário e mapa) é da equipe de front. Guia: [BACKEND.md](docs/BACKEND.md).

### Concluído

- PRD, ARCHITECTURE (com as decisões técnicas), DESIGN, RULES, TASKS (com o estado do projeto), BACKEND, TEST_PLAN e SECURITY, cada um com um papel só (README, seção Documentação)
- Estrutura inicial das páginas, do CSS compartilhado e dos módulos JavaScript em `site/`
- Telas do Figma exportadas em `wireframes/` (47 telas, anteriores ao fluxo novo da denúncia)
- Área do agente definida no PRD 2.2 a partir do levantamento com a coordenação de endemias: ficha do PNCD não digitalizada, registro de visita, encerramento após três tentativas sem acesso e relatório em PDF e Word
- Fluxo da denúncia definido no PRD 2.3: da tela Início ao protocolo, com e-mail e telefone obrigatórios e código confirmado depois dos dados, por e-mail, SMS ou WhatsApp
- Fluxo da denúncia desenhado no Figma: 22 telas na seção 02 da jornada do usuário, com os estados de erro. A versão anterior está arquivada fora da jornada, e os links de entrada abrem a Localização nova
- Jornada do agente revista no PRD 2.8 e desenhada no Figma, na seção "Jornada do agente · telas e conexões" da página do fluxo: origem cidadão ou agente, arquivar como ação única, análise e visita num passo, foco em local sem denúncia, perguntas na linguagem do cidadão e relatório novo. É protótipo com dados de exemplo, ainda não validado com agentes
- E-mail do código em produção de teste (22/11/2026): provedor escolhido por `EMAIL_PROVIDER`; hoje Google Apps Script (gratuito, sem domínio, limite de 100 destinatários por dia em Gmail comum), com Resend como troca quando houver domínio. Entrega real confirmada em Gmail (caixa de entrada); outros provedores ainda não testados. SMS e WhatsApp seguem "em breve" (D45)
- Back-end Supabase (TASK-061, 062 e parte da 060a): tabelas públicas e privadas, RLS, buckets, funções `api_*`, Edge Functions de denúncia, código de confirmação por e-mail, correção por código, ações do agente, lixeira de 30 dias e rotina diária, com testes de acesso negado
- Produção do Supabase (23/11/2026): projeto separado, 9 migrations, 6 funções e segredos próprios; teste real com denúncia e foto, leitura pública sem dado privado e correção por código. A denúncia de teste AED-2026-000001 ainda está lá e deve ser apagada antes de divulgar o site

### Em andamento

| Tarefa | Onde | Observação |
|---|---|---|
| TASK-022 Página Início | `site/inicio.html` | Primeira versão com os blocos Denuncie, Guia Aedes, Mapa de focos e Jogo, já no CSS único e nos tokens. Falta alinhar à tela Início do Figma: botão principal Denuncie aqui, cartões com borda, ilustrações, logotipo e menu (TASK-021) |

As branches `Laura-Galdino`, `Rhillary` e `sky` estão atrás do `main`. Antes de abrir PR, rodar `git merge origin/main` e, se houver conflito em README.md ou site/LEIA-ME.md, manter a versão do `main`.

### Próxima tarefa

**TASK-020:** declarar os tokens e os componentes base em `site/css/estilos.css`. Ela destrava as demais páginas da Fase 2, porque todas dependem dos mesmos botões, cartões e cores.

### Problemas conhecidos

- O fluxo da denúncia no Figma tem telas inteiras, mas ainda não está exportado para `wireframes/` (TASK-013a). Até lá, `wireframes/` mostra a denúncia anterior; vale o PRD.
- O mapa das telas de localização é uma imagem ilustrativa de Itambé/BA, não de Itambé/PE (D37, TASK-013b). Ele não valida território nem posição de pontos.
- O Figma ainda mostra o campo CPF nas telas da denúncia, e a escolha de canal ainda não tem a variante com SMS e WhatsApp "em breve" (TASK-013d).
- Algumas telas antigas do Figma divergem do PRD: nomes de etapa, filtros fora da V1 (D40, TASK-012c), agenda de visitas e a área do agente anterior ao PRD 2.2. As correções estão na Fase 1, mais abaixo.
- O CSS compartilhado já declara os tokens (`:root` em `site/css/estilos.css`), mas os componentes base ainda faltam (TASK-020).
- O Figma não tem estilos nem variáveis cadastrados (TASK-010).
- A etiqueta Em análise tem dois estilos no Figma. As etiquetas da área do agente foram desenhadas na jornada nova, mas as cores ainda não viraram tokens do DESIGN.md (TASK-012a).
- A página de login dos agentes se chama `agentes/Login.html`, com inicial maiúscula, fora do padrão de nomes do RULES.md. Renomear junto com a TASK-025.
- As páginas `agentes/mapa.html`, `agentes/meu-trabalho.html` e `agentes/dashboard.html` continuam como espaço reservado, fora da V1.

### Decisões pendentes

As dependências estão no [PRD, seção 18](docs/PRD.md) e são de preparação técnica ou operacional. Os três pontos de produto que ficaram a confirmar no PRD 2.8 foram decididos em 16/11/2026: o prazo de 30 dias da lixeira vale para qualquer etapa (D44); ao sair do registro da visita sem gravar, a ocorrência fica Em análise e nada do formulário fica salvo (D52); a arquivada depois de atendida conta como Arquivada no relatório (RF-AGE-08). As que bloqueiam o próximo trabalho:

- DEP-01 (mapa real e contornos) antes da validação de território e da troca do mapa ilustrativo.

## Fase 0 · Documentação

- [x] TASK-001 Escrever o PRD da V1 e mantê-lo como fonte única do comportamento
- [x] TASK-002 Concluir as telas no Figma e exportar para `wireframes/`
- [x] TASK-003 Organizar a documentação em PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN e SECURITY
- [x] TASK-004 Registrar no PRD 2.3 a jornada completa da denúncia e alinhar os demais documentos
- [x] TASK-005 Registrar no PRD 2.8 a jornada do agente revista e alinhar os demais documentos

## Fase 1 · Ajustes de design no Figma

Divergências encontradas entre as telas finais e o PRD. Até serem resolvidas, a implementação segue o PRD.

- [ ] TASK-010 Cadastrar as cores, fontes e raios do [DESIGN.md](docs/DESIGN.md) como estilos ou variáveis no Figma
- [ ] TASK-011 Trocar Segoe UI por Inter nas telas que ainda usam a fonte antiga
- [ ] TASK-012 Usar os nomes de etapa do PRD: o filtro de status mostra "Não visualizados / Resolvidos" e a área dos agentes escreve "Atendido" (telas 25, 46 e 47; PRD seção 10)
- [ ] TASK-012a Unificar as etiquetas de etapa: Em análise usa fundo `#D9CBB0` no mapa público e `#FFEA83` na área dos agentes, com raios diferentes; transformar em tokens as cores de Recebida, Encerrada, Arquivada, Sem acesso e da origem, já desenhadas na jornada do agente (DESIGN.md, seção 5; PRD D29, D50)
- [ ] TASK-012b Desenhar os estados de foco, desabilitado e "Enviando…" dos botões (DESIGN.md, seção 5); o botão de ocultar deixou de existir (D48)
- [ ] TASK-012c Retirar do Figma os filtros fora da V1 (origem, distrito, rua e área) e as telas de mapa que dependem deles: telas 26 e 29 a 34 (D40)
- [x] TASK-013 Desenhar a denúncia completa da tela Início ao protocolo, com a confirmação por código depois dos dados (e-mail, SMS ou WhatsApp) e os estados de erro (D35, D36, RF-AUT-01)
- [ ] TASK-013a Exportar as telas da denúncia do Figma para `wireframes/` e atualizar o README da pasta
- [ ] TASK-013b Trocar a imagem ilustrativa do mapa (Itambé/BA) pelo mapa de Itambé/PE nas telas de localização (D37; depende de DEP-01)
- [ ] TASK-013c Marcar o endereço digitado como obrigatório na tela 02 Localização e desenhar o erro de campo vazio (D39)
- [ ] TASK-013d Tirar o campo CPF das telas do Figma (04, 04a a 04c, revisão e textos de privacidade) e desenhar a escolha de canal com SMS e WhatsApp como "em breve" (D07, D45)
- [ ] TASK-014 Desenhar a correção da denúncia pelo cidadão enquanto ela está Recebida e a recuperação do acesso por protocolo e código (RF-COR-01, D26, D42)
- [ ] TASK-015 Redesenhar o detalhe da ocorrência: fotos ampliáveis, "Como chegar", endereço e referência, quem fez (morador com telefone para ligar, ou o agente que registrou), origem, visita registrada, ocorrências próximas em 150 m, linha do tempo com o nome de quem fez cada passo e botões por etapa (Recebida só com Iniciar análise); Corrigir dados, Arquivar, Adicionar observação e Voltar ao mapa em "Outras ações" (RF-AGE-01 a RF-AGE-07) · desenhado no Figma em 15/11/2026, a validar
- [ ] TASK-015a Desenhar a tela Registrar visita, com as perguntas na linguagem do cidadão (D53), os quatro tipos de acesso, a opção Local sem denúncia (RF-AGE-10) e o erro de envio (PRD seção 8.1; RF-AGE-03) · desenhado no Figma em 15/11/2026, a validar; falta o erro de envio
- [ ] TASK-015b Desenhar as opções de toque e a janela de confirmação, incluindo "Encerrar sem acesso", "Arquivar" com motivo e aviso de que a denúncia sai do mapa, e "Voltar ao mapa" (DESIGN.md, seção 5; RF-AGE-03, RF-AGE-04, RF-AGE-06, RF-AGE-07) · desenhado no Figma em 15/11/2026, a validar
- [ ] TASK-015c Redesenhar Ocorrências: resumo que acompanha os filtros (D54), origem em cada cartão e no filtro (D50), dias em aberto, etiquetas Sem acesso e Arquivada, filtro Sem acesso, ordem por mais antigas, botão Lista/Mapa e marcadores por etapa; tirar a barra inferior; Ocorrências, Registrar visita, Relatório e Sair ficam no menu ☰ (RF-AGE-01) · desenhado no Figma em 15/11/2026, a validar
- [ ] TASK-015d Desenhar a tela Relatório: período, bairro, formato, resumo em três grupos, por bairro, visitas, recipientes e pendentes, o arquivo em A4 e o estado sem dados (RF-AGE-08, D56) · desenhado no Figma em 15/11/2026, a validar; falta o estado sem dados
- [ ] TASK-015e Desenhar Corrigir dados pelo agente: campos editáveis, contato confirmado só para leitura, motivo obrigatório e revisão antes → depois (RF-COR-01, D20, D42)
- [ ] TASK-015f Mostrar a origem ("Feita por cidadão" ou "Feita por agente") na prévia do mapa público, sem nome (D50, RF-MAP-01) · desenhado no Figma em 15/11/2026, a validar
- [ ] TASK-015g Desenhar a tela única de erro da área do agente (D55) · desenhado no Figma em 15/11/2026, a validar
- [ ] TASK-016 Retirar "Programar visita", a caixa "Conclusão" e o botão "Salvar conclusão e marcar atendimento" da tela 46; a conclusão passa a ser feita em Registrar visita (D28)
- [ ] TASK-016a Retirar a tela 42 (mapa do agente), que passa a ficar dentro de Ocorrências (RF-AGE-01)
- [ ] TASK-016b Trocar os bairros fictícios das telas (Centro, São José, Torre, Bongi) pelos 15 bairros de Itambé (D33)
- [ ] TASK-018 Corrigir, nas telas antigas, o endereço da barra do navegador e os textos de Quem somos que ainda citam outro projeto (telas 01 a 06 e outras)
- [ ] TASK-019 Colocar as camadas do Portal técnico dentro do frame e exportar de novo (tela 45)

## Fase 2 · Base do site (HTML e CSS)

- [ ] TASK-020 Declarar os tokens e os componentes base em `site/css/estilos.css` (DESIGN, seção 8)
- [ ] TASK-021 Menu compartilhado da área pública (tela 02; `js/compartilhado/menu.js`)
- [ ] TASK-022 Página Início (tela 01) · primeira versão em `site/inicio.html`; falta alinhar à tela, ver Estado do projeto
- [ ] TASK-023 HTML da denúncia: Início → Localização → Identificação do foco → Seus dados → canal e código → Revisão → resultado, com os estados de erro (telas 01 a 11 da denúncia no Figma; D35)
- [ ] TASK-024 HTML do mapa público: mapa, lista, prévia curta e menu de filtros (telas 16 a 24, 27, 28; D47)
- [ ] TASK-025 HTML do Portal técnico (tela 45; `agentes/Login.html`)
- [ ] TASK-026 HTML de Ocorrências e do detalhe da ocorrência (telas 46 e 47)
- [ ] TASK-027 Páginas complementares: Guia Aedes, Repelentes, Quem somos e Entrada do jogo (telas 03 a 06)

## Fase 3 · Dados fictícios

- [ ] TASK-030 Definir o formato de uma denúncia (público, privado, eventos e visitas) em `js/servicos/`
- [ ] TASK-031 Serviço fictício que atende os contratos da ARCHITECTURE, seção 5, incluindo `enviarCodigo` e `confirmarCodigo` (código simulado), `registrarVisita`, `registrarFocoSemDenuncia`, `encerrarSemAcesso`, `arquivarOcorrencia`, `voltarAoMapa`, `solicitarAcessoCorrecao`, `confirmarAcessoCorrecao`, `listarOcorrenciasProximas`, `obterOcorrencia`, `corrigirCamposDenuncia` e `dadosRelatorio`
- [ ] TASK-032 Criar `js/dominio/` com etapas (incluindo Encerrada), regra de território provisória, cálculo da célula de 200 m (D43), catálogo dos 15 bairros e opções da visita na linguagem do cidadão (onde está o foco, recipientes, o que foi feito; D53)
- [ ] TASK-033 Dados fictícios com ocorrências em todas as etapas, visitas com e sem acesso, uma ocorrência com três tentativas, duas denúncias a menos de 150 m, uma arquivada há 25 dias e outra arquivada há 31 dias (lixeira, D44) e uma ocorrência feita por agente (D51)

## Fase 4 · Fatia vertical 1: da denúncia ao mapa (dados fictícios)

- [ ] TASK-040 Etapa 1: bairro, endereço digitado obrigatório, marcar o ponto manualmente e usar GPS opcional (02 Localização, 02a GPS negado, 02b Ponto fora de Itambé; telas 35 a 37; RF-DEN-02)
- [ ] TASK-041 Etapa 2: descrição, categoria e fotos com prévia, remoção e limite de três (03 Foco e evidências, 03a Foto obrigatória, 03b Falha ao adicionar foto; RF-DEN-03)
- [ ] TASK-042 Etapa 3: nome, e-mail e telefone obrigatórios, com validação de formato (04 Dados para o registro, 04a a 04c; RF-DEN-01, D06)
- [ ] TASK-042a Escolha do canal e código simulado: e-mail direto ao código, telefone com SMS ou WhatsApp (ou "em breve" enquanto inativos, D45), código inválido (05, 05a, 05b, 06, 06a e 10; RF-AUT-01)
- [ ] TASK-043 Etapa 4: revisão separando público e privado, envio com bloqueio de clique (07 Revisão, 07a Enviando; RF-DEN-01, RF-DEN-04)
- [ ] TASK-044 Protocolo, publicação pendente e falha antes de salvar (08, 09 e 11; RF-DEN-04, RF-DEN-05)
- [ ] TASK-045 Mapa lê as denúncias fictícias, mostra a célula de 200 m e abre a prévia curta (telas 16 a 22; RF-MAP-01, D47)
- [ ] TASK-046 Filtros por localidade, período e etapa, com estados vazio, sem resultado e erro (telas 23, 24, 27, 28; RF-MAP-02; só esses três filtros, D40)

## Fase 5 · Fatia vertical 2: área do agente (dados fictícios)

- [ ] TASK-050 Lista de ocorrências com resumo que acompanha os filtros, origem, dias em aberto, etiquetas, filtros (incluindo origem e Sem acesso) e ordem por mais antigas (tela 47; RF-AGE-01, D50, D54)
- [ ] TASK-050a Alternância Lista/Mapa dentro de Ocorrências, com marcadores por etapa e os mesmos filtros (RF-AGE-01)
- [ ] TASK-051 Detalhe com fotos, ponto exato, "Como chegar", endereço, quem fez (morador ou agente), origem, se está arquivada e linha do tempo com o autor de cada passo (tela 46; RF-AGE-01)
- [ ] TASK-051a Aviso de ocorrências próximas em 150 m (RF-AGE-01, D34)
- [ ] TASK-052 Iniciar análise abrindo o registro da visita, e registrar observações (RF-AGE-02, RF-AGE-05, D52)
- [ ] TASK-053 Registrar visita com acesso, com as perguntas na linguagem do cidadão (D53), resumo e confirmação, levando a Atendida (RF-AGE-03)
- [ ] TASK-053a Registrar visita sem acesso, com contador de tentativas (RF-AGE-03)
- [ ] TASK-053b Encerrar sem acesso a partir da terceira tentativa (RF-AGE-07)
- [ ] TASK-053c Guardar o formulário de visita no aparelho quando o envio falhar e reenviar sem duplicar (RF-AGE-03, RNF-11)
- [ ] TASK-053d Arquivar denúncia em qualquer etapa, com motivo e confirmação: em Recebida ou Em análise leva a Encerrada; em Atendida ou Encerrada mantém a etapa; sempre tira do mapa (RF-AGE-04, D41, D44, D48, D49)
- [ ] TASK-053e Registrar foco em local sem denúncia, criando a ocorrência feita por agente, já Atendida (RF-AGE-10, D51)
- [ ] TASK-054 Voltar ao mapa uma denúncia arquivada, dentro da lixeira de 30 dias (RF-AGE-06, D44)
- [ ] TASK-054a Corrigir dados pelo agente, com motivo e revisão antes → depois, sem trocar o contato confirmado (RF-COR-01, D20, D42)
- [ ] TASK-055 Tela do relatório com período, bairro e prévia em três grupos, por origem e por tipo de encerramento (RF-AGE-08, D56)
- [ ] TASK-056 Gerar o relatório em PDF com jsPDF e AutoTable (RF-AGE-08, ADR-012)
- [ ] TASK-057 Gerar o relatório em Word com a biblioteca `docx` (RF-AGE-08, ADR-012)

## Fase 6 · Supabase

- [ ] TASK-060 Criar o projeto Supabase de teste, separado da produção, e configurar a Supabase CLI no ambiente local
- [ ] TASK-060a Provar que uma Edge Function importa um módulo de `js/dominio/` (ADR-015)
- [ ] TASK-060b Publicar a prévia do site na Vercel (D46, ADR-016)
- [ ] TASK-061 (escrito e testado localmente em `supabase/`; falta aplicar no projeto de teste com `db push`) Criar as tabelas (incluindo `report_visits` e `neighborhoods`), os buckets e as políticas de RLS em migrações, com testes de acesso negado (SECURITY.md)
- [ ] TASK-062 (papel de agente em `profiles` e conferência nas funções prontos; falta criar as contas no projeto de teste) Login individual dos agentes e papel de agente; contas criadas pela equipe no Supabase, sem tela de administrador (RF-AUT-02, D22)
- [ ] TASK-063 Trocar o serviço fictício pelo Supabase sem alterar as telas

## Fase 7 · Envio real

- [ ] TASK-070 Envio e conferência do código por e-mail e, se DEP-03 provar custo e prazo aceitáveis, por SMS e WhatsApp, com expiração e limites (RF-AUT-01, RNF-08, D45)
- [ ] TASK-071 Upload das fotos, tratamento e remoção de metadados (RF-DEN-03)
- [ ] TASK-072 Gravação idempotente e geração do protocolo (RF-DEN-04)
- [ ] TASK-073 Geração da versão pública e recuperação de publicação pendente (RF-DEN-05)

## Fase 8 · Operação real

- [ ] TASK-080 Ocorrências com dados reais, visitas gravadas em transação e controle de ações simultâneas (RF-AGE-01 a RF-AGE-03, RF-AGE-07)
- [ ] TASK-080a Relatório com dados reais, conferindo que `dadosRelatorio` não devolve campos privados (RF-AGE-08, RNF-12)
- [ ] TASK-080b Registro de foco em local sem denúncia com dados reais, em transação única e sem duplicar (RF-AGE-10)
- [ ] TASK-081 Arquivamento e volta ao mapa com versão de decisão (RF-AGE-04, RF-AGE-06)
- [ ] TASK-081a Rotina diária `limparLixeira`: remove denúncias arquivadas há mais de 30 dias, com fotos dos dois buckets (D44, ADR-017)
- [ ] TASK-082 Correção pelo agente e pelo cidadão, com recuperação de acesso por protocolo e código (RF-COR-01, D42)

## Fase 9 · Validação da V1

- [ ] TASK-090 Executar os cenários AC-01 a AC-17 do [TEST_PLAN.md](docs/TEST_PLAN.md) e registrar as evidências
- [ ] TASK-091 Inspecionar as respostas de rede públicas em busca de dados privados (AC-07)
- [ ] TASK-092 Revisar a lista de verificação do [SECURITY.md](docs/SECURITY.md)

## Fase 10 · Lançamento

- [ ] TASK-100 Resolver as dependências de lançamento DEP-01 a DEP-09 (PRD, seção 18)
- [ ] TASK-101 Criar o ambiente de produção (Supabase e Vercel) com limites de custo e monitoramento · Supabase de produção criado e provado em 23/11/2026; faltam Vercel de produção, limites de custo e monitoramento
- [ ] TASK-102 Testar no endereço publicado antes de divulgar aos moradores

## Decisões pendentes

As decisões e dependências em aberto ficam numa lista única, no [PRD, seção 18](docs/PRD.md) (seção 18). As tarefas que dependem de uma delas citam o ID.

## Fase seguinte (fora da V1)

- Dashboard e gráficos (telas 43 e 44)
- Mapa técnico dedicado e Meu trabalho
- Agenda de visitas
