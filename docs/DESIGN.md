# Aedes Data Lab: Sistema de design

| Campo | Valor |
|---|---|
| Versão | 1.0 · 11/11/2026 |
| Fonte | Telas finais da página "Fluxo de telas · Jornada do Usuário" no [Figma](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y/Aedes-Data-Lab-%C2%B7-Wireframes-por-p%C3%A1gina?node-id=2014-13) |
| Telas exportadas | [wireframes/](../wireframes/README.md) |

Este documento define como o site deve parecer e se comportar visualmente, para que todas as páginas usem os mesmos botões, cartões, cores e textos. Os valores abaixo foram medidos nas 47 telas finais do Figma, que ainda não têm estilos nem variáveis cadastrados. Quando uma tela usar um valor diferente destes, vale este documento, e a tela entra na lista de ajustes de design em [TASKS.md](../TASKS.md).

## 1. Estilo

Visual calmo e institucional, em tons de bege e verde, pensado para leitura no celular ao ar livre. Cartões claros sobre fundo creme, títulos fortes em verde escuro e poucos elementos por tela. A cor de alerta aparece só nos marcadores do mapa.

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
| `--cor-borda` | `#D9CBB0` | Bordas de cartões e campos; fundo da etiqueta Em análise |
| `--cor-texto` | `#2A2E32` | Texto corrido |
| `--cor-texto-suave` | `#666D74` | Textos de apoio, legendas e placeholders |
| `--cor-marcador` | `#FF0000` | Marcadores de denúncia no mapa |
| `--cor-erro` | `#B3261E` | Mensagens de erro (proposta; o Figma não define) |

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
| `--espaco-1` a `--espaco-6` | 4, 8, 12, 16, 24, 32px | Escala de margens e preenchimentos |
| `--altura-controle` | 44px | Altura mínima de botões e campos, que também é o alvo mínimo de toque |
| `--largura-conteudo` | 480px | Largura máxima do conteúdo das páginas públicas no computador |

## 5. Componentes

### Botões

| Variante | Fundo | Texto | Borda | Uso |
|---|---|---|---|---|
| Principal | `--cor-primaria` | branco, 16px Bold | nenhuma | Ação principal da tela: Denuncie aqui, Continuar, Enviar denúncia, Entrar |
| Secundário | `--cor-campo` | `--cor-primaria`, 16px Bold | 1px `--cor-primaria` | Ação alternativa: Voltar ao início, Agora não, Limpar filtro |
| Texto | transparente | `--cor-primaria`, 14px Bold | nenhuma | Voltar e links de ação |
| Perigo | `--cor-erro` | branco | nenhuma | Ocultar publicação (área dos agentes) |

Todos os botões têm raio `--raio-pequeno`, altura mínima de 44px, foco visível e estado desabilitado com opacidade reduzida. Durante um envio, o botão mostra "Enviando…" e fica desabilitado.

### Cartões

Fundo `--cor-superficie`, borda 1px `--cor-borda`, raio `--raio-medio` e preenchimento de 16 a 24px. Título com `--texto-titulo-cartao` ou `--texto-subtitulo`.

### Campos de formulário

Fundo `--cor-campo`, borda 1px `--cor-borda`, raio `--raio-pequeno`, altura de 44px. Rótulo sempre visível acima do campo em `--texto-rotulo`. Mensagem de erro abaixo do campo, ligada a ele por `aria-describedby`.

### Etiquetas de etapa

| Etapa | Fundo | Texto |
|---|---|---|
| Recebida | `--cor-superficie` com borda `--cor-borda` | `--cor-primaria` |
| Em análise | `--cor-borda` | `--cor-primaria` |
| Atendida | `--cor-verde-claro` | `--cor-primaria-escura` |
| Oculta (só agentes) | `--cor-texto-suave` | branco |

O Figma define apenas a etiqueta Em análise; as cores de Recebida, Atendida e Oculta são proposta deste documento. A etiqueta sempre mostra o nome da etapa por escrito; a cor nunca é o único sinal. Os nomes seguem o PRD: Recebida, Em análise e Atendida.

### Indicador de passos da denúncia

Quatro círculos numerados ligados por uma linha, no topo do formulário. O passo atual fica preenchido com `--cor-primaria`, os anteriores com `--cor-acento` e os seguintes com `--cor-verde-claro`.

### Mapa

Mapa centrado em Itambé, marcadores em `--cor-marcador`, botões flutuantes "Filtros" e "Centralizar em mim" em `--cor-superficie`, e crédito do provedor em `--texto-legenda`.

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
  --cor-erro: #B3261E;
  --raio-pequeno: 8px;
  --raio-medio: 12px;
  --raio-etiqueta: 16px;
  --altura-controle: 44px;
  --fonte: "Inter", system-ui, sans-serif;
}
```

Os componentes usam classes compartilhadas (`.botao`, `.botao--secundario`, `.cartao`, `.campo`, `.etiqueta-etapa--em-analise`). Estilos que só uma página usa ficam numa seção própria do mesmo arquivo, presos à classe da página, como `.pagina-denuncia`. Nenhuma página cria um CSS separado (ADR-002).

## 9. Pendências de design

Os ajustes abaixo estão em [TASKS.md](../TASKS.md), fase Ajustes de design:

- Cadastrar estes tokens como estilos ou variáveis no Figma.
- Trocar Segoe UI por Inter nas telas que ainda usam a fonte antiga.
- Alinhar os nomes das etapas nas telas ao PRD.
- Corrigir os restos do Repecol (endereço `repecol.web.app` na barra do navegador e textos de Quem somos).
