# Começar a programação do Aedes

Esta pasta tem a estrutura inicial de estudo do site. Ainda não há formulário funcional, autenticação, banco, API, menu pronto nem envio de denúncias; os arquivos CSS e JavaScript trazem apenas indicações de trabalho. O comportamento esperado de cada tela está no [PRD](../docs/PRD_Aedes_Data_Lab.md), e o visual segue as telas finais do Figma.

## Páginas

| Área | Arquivo | Escopo no PRD |
|---|---|---|
| Pública | `index.html` (Início) | V1 |
| Pública | `paginas/registrar-foco.html` | V1 |
| Pública | `paginas/mapa.html` | V1 |
| Pública | `paginas/guia-aedes.html`, `paginas/repelentes.html`, `paginas/quem-somos.html`, `paginas/jogo.html` | Complementares, em paralelo |
| Agentes | `agentes/Login.html` (Acesso dos agentes) | V1 |
| Agentes | `agentes/ocorrencias.html` | V1 |
| Agentes | `agentes/mapa.html`, `agentes/meu-trabalho.html` | Reservadas; fora do aceite da V1 |
| Agentes | `agentes/dashboard.html` | Fase seguinte |

A área pública não tem link para a área dos agentes. As duas vão se ligar pelos dados no Firebase. As páginas dos agentes ainda não têm dados privados, e separar pastas não protege nada: autenticação e autorização serão construídas antes de qualquer dado real.

## Ordem das atividades

1. **HTML:** cada aluna constrói o conteúdo e os elementos das telas combinadas, seguindo as telas finais do Figma. É a etapa de aprender títulos, seções, links, imagens, labels e formulários.
2. **CSS:** todas as páginas usam somente `css/estilos.css`. Os padrões são construídos em conjunto, e os estilos específicos ficam em seções delimitadas por classes da página.
3. **JavaScript:** o comportamento de cada tela fica no arquivo correspondente em `js/cidadao/` ou `js/agentes/`.
4. **Recursos compartilhados:** menu construído em conjunto e dados fictícios conectados; depois, Firebase e integração dos serviços em `js/servicos/`.

Cada HTML usa o mesmo CSS e tem o próprio JavaScript. Não é preciso juntar as telas em um único arquivo.

## Exemplo de arquivos da mesma tela

- `paginas/registrar-foco.html`: estrutura.
- `css/estilos.css`: estilos compartilhados e a seção específica da tela.
- `js/cidadao/registrar-foco.js`: comportamento.

Combine com a equipe antes de editar arquivos comuns, como o CSS e o menu. A divisão de responsáveis é acordada com a equipe e acompanhada no Jira.

## Como visualizar

Na fase de HTML e CSS, basta abrir `index.html` no navegador. Para usar módulos JavaScript, rode um servidor local (por exemplo, o Live Server do editor) em vez de abrir por `file://`. Vite e npm ainda não foram configurados nesta pasta.

## Navegação durante o aprendizado

Na fase de HTML, crie links entre páginas da mesma área e confira os caminhos relativos: páginas em `paginas/` voltam ao início com `../index.html`, e as páginas dos agentes navegam dentro de `agentes/`, a partir de `agentes/Login.html`. Na etapa de JavaScript, o menu passa a ser compartilhado para evitar cópias diferentes.

## Primeira entrega

Cada aluna escolhe uma tela, monta o HTML com o título, as seções e os elementos da tela no Figma, abre no navegador e explica a estrutura a uma colega. Firebase ainda não entra nesta etapa, e o botão Enviar ainda não registra denúncias.
