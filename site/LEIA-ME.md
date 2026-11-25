# Começar a programação do Aedes

Esta pasta tem a estrutura inicial de estudo do site. Ainda não há formulário funcional, autenticação, banco, API, menu pronto nem envio de denúncias; os arquivos CSS e JavaScript trazem apenas indicações de trabalho. O comportamento esperado de cada tela está no [PRD](../docs/PRD.md), o visual no [DESIGN.md](../docs/DESIGN.md) e as regras de código no [RULES.md](../docs/RULES.md). As tarefas, com a tela e o requisito de cada uma, estão em [TASKS.md](../TASKS.md).

## Páginas

| Área | Arquivo | Escopo no PRD |
|---|---|---|
| Pública | `inicio.html` (Início) | V1 |
| Pública | `paginas/registrar-foco.html` | V1 |
| Pública | `paginas/mapa.html` | V1 |
| Pública | `paginas/guia-aedes.html`, `paginas/repelentes.html`, `paginas/quem-somos.html`, `paginas/jogo.html` | Complementares, em paralelo |
| Agentes | `agentes/index.html` (`/agentes`, login) | V1, programada |
| Agentes | `agentes/ocorrencias.html` (lista, mapa e filtros), `ocorrencia.html`, `visita.html`, `correcao.html`, `relatorio.html` | V1, programadas |
| Agentes | `agentes/meu-trabalho.html` | Reservada; fora do aceite da V1 |
| Agentes | `agentes/dashboard.html` | Fase seguinte |

A área pública não tem link para a área dos agentes. As duas se ligam pelos dados no Supabase. Separar pastas não protege nada: quem protege é o login do agente e o RLS do banco.

## Área dos agentes (já programada)

- Estrutura em `agentes/`, estilos em `css/agentes.css`, telas em `js/agentes/`, regras em `js/dominio/` e chamadas ao Supabase em `js/servicos/`.
- Para abrir no computador, na raiz do repositório: `npm run servir` e acesse `http://localhost:5500/agentes`. O Live Server não conhece os endereços sem `.html`.
- Esse servidor usa o Supabase configurado em `js/servicos/config.js`. É preciso uma conta de agente criada pela equipe (docs/BACKEND.md, seção 5), e o Supabase só aceita o endereço local se ele estiver em `ALLOWED_ORIGINS`.
- Testes das regras: `npm test`.
- `vercel.json` guarda os endereços de `/agentes`, leva as páginas reservadas (`dashboard`, `meu-trabalho`) para Ocorrências enquanto não são feitas e define a política de segurança da área. Se o projeto do Supabase mudar, atualize o endereço também nessa política.

## Ordem das atividades

1. **HTML:** cada aluna constrói o conteúdo e os elementos das telas combinadas, seguindo as telas finais do Figma. É a etapa de aprender títulos, seções, links, imagens, labels e formulários.
2. **CSS:** todas as páginas usam somente `css/estilos.css`. Os padrões são construídos em conjunto, e os estilos específicos ficam em seções delimitadas por classes da página.
3. **JavaScript:** o comportamento de cada tela fica no arquivo correspondente em `js/cidadao/` ou `js/agentes/`.
4. **Recursos compartilhados:** menu construído em conjunto e dados fictícios conectados; depois, Supabase e integração dos serviços em `js/servicos/`.

Cada HTML usa o mesmo CSS e tem o próprio JavaScript. Não é preciso juntar as telas em um único arquivo.

## Exemplo de arquivos da mesma tela

- `paginas/registrar-foco.html`: estrutura.
- `css/estilos.css`: estilos compartilhados e a seção específica da tela.
- `js/cidadao/registrar-foco.js`: comportamento.

Combine com a equipe antes de editar arquivos comuns, como o CSS e o menu. A divisão de responsáveis é acordada com a equipe e acompanhada no Jira.

## Como visualizar

Na fase de HTML e CSS, basta abrir `inicio.html` no navegador. Para usar módulos JavaScript, rode um servidor local (por exemplo, o Live Server do editor, clicando com o botão direito em `inicio.html` e escolhendo *Open with Live Server*) em vez de abrir por `file://`. O endereço raiz `/` só leva à Início na Vercel, por causa da regra em `vercel.json`; no servidor local, abra `inicio.html` direto. Vite e npm ainda não foram configurados nesta pasta.

## Navegação durante o aprendizado

Na fase de HTML, crie links entre páginas da mesma área e confira os caminhos relativos: páginas em `paginas/` voltam ao início com `../inicio.html`, e as páginas dos agentes navegam dentro de `agentes/`, a partir de `agentes/Login.html`. Na etapa de JavaScript, o menu passa a ser compartilhado para evitar cópias diferentes.

## Primeira entrega

Cada aluna escolhe uma tela, monta o HTML com o título, as seções e os elementos da tela no Figma, abre no navegador e explica a estrutura a uma colega. O Supabase ainda não entra nesta etapa, e o botão Enviar ainda não registra denúncias.
