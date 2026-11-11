# Começar a programação do Aedes

Esta pasta contém somente a estrutura inicial de estudo. Não há formulário funcional, autenticação, banco, API, menu pronto ou envio de denúncias. Os arquivos CSS e JavaScript contêm apenas indicações de trabalho.

## Onde cada área começa

- Cidadão: `index.html` e arquivos em `paginas/`.
- Agentes: `agentes/index.html`, com telas próprias dentro de `agentes/`.
- A área pública não tem link para os agentes. A ligação futura será pelos dados no Firebase.
- As páginas técnicas ainda são arquivos de estudo sem dados privados. Separar pastas não implementa segurança: autenticação e autorização serão construídas antes de usar dados reais.

## Ordem das atividades

1. HTML: cada aluna constrói o conteúdo e os elementos das telas combinadas, usando o Figma atual. Aprender títulos, seções, links, imagens, labels e formulários.
2. CSS: todas as páginas usam somente `css/estilos.css`. Construir juntas os padrões e organizar estilos específicos em seções, delimitados por classes da página.
3. JavaScript: construir comportamento da tela no arquivo correspondente em `js/cidadao/` ou `js/agentes/`.
4. Recursos compartilhados: construir menu em conjunto e conectar dados fictícios; depois aprender Firebase e integrar os serviços.

Cada HTML referencia o mesmo CSS e mantém seu JavaScript específico. Não é necessário colocar todas as telas em um único arquivo.

## Exemplo de arquivos da mesma tela

- `paginas/registrar-foco.html`: estrutura.
- `css/estilos.css`: estilos compartilhados e seções específicas das telas.
- `js/cidadao/registrar-foco.js`: comportamento.

HTML e JavaScript permanecem separados por tela; o CSS é único. Não editar arquivos comuns ao mesmo tempo sem combinar. A divisão de responsáveis será acordada com a equipe; esta estrutura não altera os cartões do Jira.

## Como visualizar

Durante HTML/CSS, abrir `index.html` no navegador já permite observar a estrutura. Para trabalhar com módulos JavaScript, usar servidor local (por exemplo, Live Server do editor); não depender de abrir por `file://`. Vite/npm ainda não foram configurados nesta pasta.

## Navegação durante o aprendizado

Na fase HTML, criar links entre páginas da mesma área. Conferir caminhos relativos: páginas em `paginas/` voltam ao início com `../index.html`; páginas técnicas navegam dentro de `agentes/`. Na etapa JavaScript, consolidar o menu compartilhado para evitar cópias divergentes.

## Primeira entrega

Escolher uma tela por aluna. Montar o HTML com título, seções e elementos previstos no Figma; abrir no navegador e explicar a estrutura a outra colega. Ainda não implementar Firebase nem afirmar que o botão Enviar registra uma denúncia.
