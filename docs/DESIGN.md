# Aedes Data Lab: Sistema de design

| Campo | Valor |
|---|---|
| Versão | 1.3 · 14/11/2026 |
| Fonte | Página "Fluxo de telas · Jornada do Usuário" no [Figma](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y/Aedes-Data-Lab-%C2%B7-Wireframes-por-p%C3%A1gina?node-id=2014-13) |
| Telas exportadas | [wireframes/](../wireframes/README.md), anteriores ao fluxo novo da denúncia (TASK-013a) |

Este documento define como o site deve parecer e se comportar visualmente, para que todas as páginas usem os mesmos botões, cartões, cores e textos. **As cores são as do Figma.** Todos os valores abaixo foram lidos nas telas do Figma, que ainda não têm estilos nem variáveis cadastrados. Nenhuma cor foi inventada: onde o Figma não define um caso, o documento diz "não desenhado", e o caso vira tarefa de design em [TASKS.md](../TASKS.md) em vez de ser resolvido no código.

## 1. Estilo

Visual calmo e institucional, em tons de bege e verde, pensado para leitura no celular ao ar livre. O Figma mostra o celular com barra de endereço simulada e navegação inferior dentro do quadro; esses elementos são moldura da apresentação, não fazem parte do site. Cartões claros sobre fundo creme, títulos fortes em verde escuro e poucos elementos por tela. A cor de alerta aparece só nos marcadores do mapa.

## 2. Cores

| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#F6F0E2` | Fundo das páginas |
| `--cor-superficie` | `#FBF9F4` | Cartões, cabeçalho e painéis |
| `--cor-campo` | `#FFFFFF` | Campos de formulário e botão secundário |
| `--cor-primaria` | `#2F4F3A` | Botão principal, títulos e contornos de destaque |
| `--cor-primaria-escura` | `#20352B` | Texto sobre fundos claros que precisa de mais contraste |
| `--cor-acento` | `#487959` | Subtítulos, links e ícones |
| `--cor-verde-claro` | `#A8B89A` | Itens do menu e áreas do mapa |
| `--cor-borda` | `#D9CBB0` | Bordas de cartões e campos; fundo da etiqueta Em análise no mapa público |
| `--cor-texto` | `#2A2E32` | Texto corrido |
| `--cor-texto-suave` | `#666D74` | Textos de apoio, legendas e placeholders |
| `--cor-marcador` | `#FF0000` | Marcadores de denúncia no mapa |
| `--cor-erro` | `#9B2C23` | Título de erro (tela 15, Falha no envio) |
| `--cor-destaque-amarelo` | `#FFEA83` | Etiqueta Em análise na área dos agentes (telas 46 e 47) |

## 3. Tipografia

Fonte única: **Inter** (Regular, Medium, Semi Bold e Bold), carregada do Google Fonts, com `system-ui, sans-serif` como alternativa. Algumas telas do Figma ainda usam Segoe UI; na implementação, todas usam Inter.

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `--texto-titulo-pagina` | 36px | Bold | Título principal da página (Mapa, Ocorrências) |
| `--texto-titulo-secao` | 28px | Bold | Título de etapa ou resultado (Denúncia enviada, Detalhe da ocorrência) |
| `--texto-titulo-cartao` | 24px | Bold | Título de cartão na página Início |
| `--texto-subtitulo` | 18px | Bold | Subtítulos e nomes de grupo |
| `--texto-destaque` | 20px | Medium | Frase de apoio abaixo do título |
| `--texto-corpo` | 16px | Regular | Texto corrido e botões (Bold) |
| `--texto-pequeno` | 14px | Regular | Descrições em cartões e listas |
| `--texto-rotulo` | 13px | Bold | Rótulos de campo e etiquetas de etapa |
| `--texto-legenda` | 12px | Regular | Legendas, créditos do mapa e notas |

Em telas de até 390px de largura, o título de página pode descer para 28px para não quebrar em três linhas.

## 4. Espaçamento e forma

| Token | Valor | Uso |
|---|---|---|
| `--raio-pequeno` | 8px | Botões e campos |
| `--raio-medio` | 12px | Cartões e painéis |
| `--raio-etiqueta` | 16px | Etiquetas de etapa |
| `--raio-circulo` | 50% | Avatar e botões redondos |
| `--altura-controle` | 44px | Altura de botões e campos |

## 5. Componentes

### Botões

| Variante | Fundo | Texto | Borda | Uso |
|---|---|---|---|---|
| Principal | `--cor-primaria` | branco, 16px Bold | nenhuma | Ação principal da tela: Ver ocorrência no mapa, Tentar enviar novamente, Permitir localização |
| Secundário | `--cor-campo` | `--cor-primaria`, 16px Bold | conforme a tela no Figma | Ação alternativa: Voltar ao início, Agora não, Limpar filtro |
| Texto | transparente | `--cor-primaria` ou `--cor-texto`, 12px Bold | nenhuma | Voltar |

Botões principal e secundário têm raio `--raio-pequeno` e 44px de altura, como nas telas 12, 15, 35 e 36. Foco visível, estado desabilitado e o texto "Enviando…" durante um envio são requisitos de comportamento (RNF-02, RF-DEN-04); a aparência desses estados não está desenhada no Figma. O botão de ocultar publicação também não está desenhado (TASK-015).

### Cartões

Fundo `--cor-superficie`, borda 1px `--cor-borda`, raio `--raio-medio` e preenchimento de 16 a 24px. Título com `--texto-titulo-cartao` ou `--texto-subtitulo`.

### Campos de formulário

Fundo `--cor-campo`, borda 1px `--cor-borda`, raio `--raio-pequeno`, altura de 44px. Rótulo sempre visível acima do campo em `--texto-rotulo`. Mensagem de erro abaixo do campo, ligada a ele por `aria-describedby`.

### Etiquetas de etapa

O Figma usa dois estilos de etiqueta:

| Etapa | Mapa público (telas 19 a 22) | Área dos agentes (telas 46 e 47) |
|---|---|---|
| Recebida | Não desenhada | Não desenhada |
| Em análise | Fundo `--cor-borda`, texto `--cor-primaria`, raio 16px | Fundo `--cor-destaque-amarelo`, texto `--cor-primaria`, raio 7px |
| Atendida | Não desenhada | Fundo `--cor-primaria`, texto branco, raio 7px (escrito "Atendido") |
| Encerrada | Não desenhada | Não desenhada |
| Oculta | Não se aplica | Não desenhada |
| Sem acesso (N tentativas) | Não se aplica | Não desenhada |

Até a TASK-012 unificar as etiquetas e desenhar as que faltam, cada área usa o estilo da sua tela. A etiqueta sempre mostra o nome da etapa por escrito, com os nomes do PRD (Recebida, Em análise, Atendida e Encerrada); a cor nunca é o único sinal. Encerrada precisa ser visualmente diferente de Atendida, porque não houve inspeção.

### Opções de toque

Usadas no registro de visita (PRD, seção 8.1) para responder sem digitar. Cada opção é um botão com pelo menos 44px de altura, texto visível e estado selecionado indicado também por ícone ou texto, não só por cor. Perguntas de uma resposta (Acesso, Tipo do local, Foco encontrado) se comportam como grupo de rádio; perguntas de várias respostas (Depósitos, Ações) como grupo de caixas de seleção. Os depósitos mostram o código e o nome, como "A1 · Caixa d'água elevada". A aparência ainda não está desenhada no Figma (TASK-015b).

### Janela de confirmação

Usada antes de ações que não voltam atrás: registrar visita com acesso, encerrar sem acesso, ocultar e republicar. Mostra o resumo do que será gravado, o efeito na etapa e dois botões: o principal com a ação ("Confirmar e concluir") e o secundário "Voltar". Não desenhada no Figma (TASK-015b).

### Indicador de passos da denúncia

Quatro círculos numerados ligados por uma linha, no topo do formulário, com o texto "Etapa N de 4", como nas telas de Localização a Revisão da denúncia. As quatro etapas são Localização, Identificação do foco, Seus dados e Revisão; a escolha do canal e o código ficam entre Seus dados e Revisão, sem etapa própria.

### Mapa

Mapa centrado em Itambé, marcadores em `--cor-marcador` e botões flutuantes "Filtros" e "Centralizar em mim", como nas telas 16 e 17. O mapa de Ocorrências dos agentes usa o mesmo componente, com marcadores diferenciados por etapa; as cores desses marcadores ainda não estão desenhadas.

## 6. Estados obrigatórios

Toda tela que carrega ou envia dados precisa ter:

| Estado | Comportamento |
|---|---|
| Carregando | Indicador visível e texto curto; nunca tela em branco |
| Vazio | Mensagem explicando que não há itens e, se couber, a próxima ação |
| Sem resultado para os filtros | Mensagem diferente da tela vazia, com opção de limpar filtros |
| Erro | Mensagem clara e botão de tentar de novo; erro nunca aparece como zero |
| Sucesso | Confirmação com o resultado concreto, como o protocolo |

## 7. Requisitos de experiência

- Pensado para celular primeiro: as telas do Figma têm 390px de largura.
- Sem rolagem horizontal em 320, 390, 768 e 1440px (RNF-01).
- Navegação completa por teclado, foco visível e rótulos em todos os campos (RNF-02).
- Contraste mínimo de 4,5:1 para texto comum.
- Imagens com texto alternativo; ícones decorativos escondidos de leitores de tela.

## 8. Como aplicar no código

Os tokens ficam declarados uma vez, no começo de `site/css/estilos.css`:

```css
:root {
  --cor-fundo: #F6F0E2;
  --cor-superficie: #FBF9F4;
  --cor-campo: #FFFFFF;
  --cor-primaria: #2F4F3A;
  --cor-primaria-escura: #20352B;
  --cor-acento: #487959;
  --cor-verde-claro: #A8B89A;
  --cor-borda: #D9CBB0;
  --cor-texto: #2A2E32;
  --cor-texto-suave: #666D74;
  --cor-marcador: #FF0000;
  --cor-erro: #9B2C23;
  --cor-destaque-amarelo: #FFEA83;
  --raio-pequeno: 8px;
  --raio-medio: 12px;
  --raio-etiqueta: 16px;
  --altura-controle: 44px;
  --fonte: "Inter", system-ui, sans-serif;
}
```

Os componentes usam classes compartilhadas (`.botao`, `.botao--secundario`, `.cartao`, `.campo`, `.etiqueta-etapa--em-analise`). Estilos que só uma página usa ficam numa seção própria do mesmo arquivo, presos à classe da página, como `.pagina-denuncia`. Nenhuma página cria um CSS separado (ADR-002).

## 9. Pendências de design

Os ajustes de design estão na Fase 1 de [TASKS.md](../TASKS.md). Este documento só descreve o que já está definido; o que falta desenhar vira tarefa lá, não texto aqui.
