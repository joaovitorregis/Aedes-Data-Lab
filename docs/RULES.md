# Aedes Data Lab: Regras de desenvolvimento

Estas regras valem para todas as pessoas da equipe e para qualquer ferramenta de IA usada no projeto (Claude Code, Cursor, Codex, ChatGPT ou outra). Quando uma IA for ajudar, ela deve ler este arquivo antes de mexer em qualquer coisa.

## 1. Antes de programar

- Leia a parte do [PRD](./PRD.md) ligada à tarefa e o requisito citado em [TASKS.md](../TASKS.md).
- Abra a tela correspondente em [wireframes/](../wireframes/README.md) e confira [DESIGN.md](./DESIGN.md).
- Veja o que já existe no repositório antes de criar algo novo. Reaproveite em vez de duplicar.
- Para mudanças grandes, escreva o plano primeiro e combine com a equipe.
- Pegue uma tarefa por vez e marque em TASKS.md quem está com ela.

## 2. Geral

- Uma tarefa, uma mudança. Não altere arquivos que não têm relação com a tarefa.
- Nomes de arquivos em minúsculas, sem acento e com hífen: `registrar-foco.html`, nunca `Início.html`.
- Textos visíveis para o usuário em português, seguindo os nomes do PRD (Recebida, Em análise, Atendida).
- Funções pequenas, com nomes que digam o que fazem.
- Nada de código comentado "para usar depois". O Git guarda o histórico.

## 3. HTML

- Páginas públicas em `site/index.html` e `site/paginas/`; páginas dos agentes em `site/agentes/`.
- Use a estrutura semântica: `header`, `nav`, `main`, `section`, `footer`, um `h1` por página.
- Todo campo tem `label`. Toda imagem tem `alt`.
- Cada página carrega `css/estilos.css` e o próprio módulo em `js/`.

## 4. CSS

- Existe um único arquivo de estilos: `site/css/estilos.css` (ADR-002).
- Use os tokens de [DESIGN.md](./DESIGN.md) (`var(--cor-primaria)`), nunca cores e tamanhos soltos.
- Estilos de uma página ficam na seção dela, presos à classe da página (`.pagina-mapa`).
- Combine com a equipe antes de mudar estilos compartilhados.
- Teste em 320, 390, 768 e 1440px antes de abrir o PR.

## 5. JavaScript

- Um módulo por página, em `js/cidadao/` ou `js/agentes/`, carregado com `type="module"`.
- Telas não acessam o banco. Leitura e escrita passam por `js/servicos/` (ARCHITECTURE, seção 4).
- Regras de negócio ficam em `js/dominio/`, e o servidor confere de novo.
- Toda chamada que pode falhar trata o erro e mostra o estado de erro do DESIGN.md.
- Bloqueie o botão durante envios para evitar cliques repetidos.

## 6. Segurança

- Nunca coloque chaves, senhas ou dados reais no código ou no Git. Use `.env.example` como modelo.
- Nunca use dados pessoais reais em testes. Use nomes e CPFs fictícios.
- Permissão se confere no servidor. Esconder um botão não protege nada.
- Siga [SECURITY.md](./SECURITY.md) em tudo que tocar dados pessoais, fotos ou login.

## 7. Testes

- Cada tarefa diz como verificar o resultado. Faça a verificação antes do PR.
- Use os cenários de [TEST_PLAN.md](./TEST_PLAN.md) ligados ao requisito.
- Se um teste falhar, corrija antes de seguir para a próxima tarefa.

## 8. Git e revisão

- Trabalhe numa branch própria: `feature/registrar-foco`, `fix/menu-celular`, `docs/arquitetura`.
- Commits pequenos, com mensagem que diga o que mudou: `feat: adiciona passo 1 da denúncia`.
- Prefixos: `feat` (funcionalidade), `fix` (correção), `style` (visual), `docs` (documentação), `test` (testes), `chore` (manutenção).
- Todo código entra no `main` por PR, revisado por outra integrante.
- Ao terminar uma tarefa, atualize TASKS.md e, se o estado do projeto mudou, [MEMORY.md](./MEMORY.md).

## 9. Como trabalhar com IA

### Ciclo de cada tarefa

```
Ler → Entender → Planejar → Implementar → Testar → Revisar → Corrigir → Commit → Atualizar documentação
```

Peça uma coisa pequena por vez. "Construa o site" é grande demais; "monte o HTML do passo 1 da denúncia, sem JavaScript, seguindo DESIGN.md" funciona.

### Primeira mensagem para a IA

```
Leia estes arquivos antes de qualquer mudança:
docs/PRD.md, docs/ARCHITECTURE.md, docs/DESIGN.md, docs/RULES.md, TASKS.md e docs/MEMORY.md.

Não altere nada ainda.

Depois:
1. Resuma o produto e a arquitetura em poucas linhas.
2. Diga qual é a tarefa atual em MEMORY.md.
3. Aponte informações que faltam ou que parecem contraditórias.
4. Explique o plano para a tarefa TASK-XXX.

Não escreva código ainda.
```

### Pedido de implementação

```
CONTEXTO
Projeto Aedes Data Lab. Leia docs/PRD.md, docs/ARCHITECTURE.md, docs/DESIGN.md e docs/RULES.md.

TAREFA
TASK-XXX: [descrição da tarefa em TASKS.md]

ARQUIVOS
[páginas, módulos e seção do CSS envolvidos]

RESTRIÇÕES
- Siga a arquitetura e o DESIGN.md.
- Reaproveite o que já existe.
- Não altere arquivos fora da tarefa.
- Não crie outro arquivo CSS.

CRITÉRIOS DE ACEITE
[copiar do requisito RF do PRD ou do TEST_PLAN.md]

TESTES
Diga como verificar e o que foi verificado.

Ao terminar, informe:
1. Arquivos alterados
2. O que foi feito
3. O que foi testado
4. O que ficou pendente
```

### Quando algo quebrar

```
ERRO
[cole a mensagem de erro]

COMPORTAMENTO ESPERADO
[o que deveria acontecer]

COMPORTAMENTO ATUAL
[o que acontece]

PASSOS PARA REPRODUZIR
1. ...
2. ...

RESTRIÇÃO
[o que não pode mudar]

Não altere o código ainda. Encontre a causa e explique:
1. O que está falhando
2. Por que está falhando
3. Qual arquivo é responsável
4. Qual é a menor correção
5. Como vamos testar a correção
```

Depois da explicação: "Aplique a menor correção, sem refatorar código que não tem relação, e rode a verificação."

### Revisão antes do PR

```
Revise a implementação comparando com docs/PRD.md, docs/ARCHITECTURE.md, docs/DESIGN.md,
docs/RULES.md, docs/TEST_PLAN.md e docs/SECURITY.md.

Verifique: funcionamento, arquitetura, segurança, tratamento de erro, acessibilidade,
responsividade e código duplicado.

Não altere nada ainda. Liste os problemas primeiro.
```

Compilar ou abrir sem erro não prova que está certo. A revisão vem antes do commit.
