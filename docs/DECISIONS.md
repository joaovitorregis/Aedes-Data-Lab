# Aedes Data Lab: Decisões técnicas

Registro das decisões de arquitetura (ADR) e do motivo de cada uma. As decisões de produto (D01 a D44) ficam no [PRD](./PRD.md), seção 5, e as questões ainda em aberto, na seção 18 do PRD.

Uma ADR não é reescrita para mudar de ideia. A nova escolha entra como outra ADR com a linha **Substitui**, e a antiga recebe **Substituída por** e fica no arquivo como histórico. Ninguém, pessoa ou IA, troca uma escolha daqui sem passar por esse processo.

## ADR-001 · HTML, CSS e JavaScript sem framework

- **Decisão:** construir o site com HTML, CSS e JavaScript em módulos ES, sem React, Vue ou outro framework.
- **Motivo:** as quatro integrantes estão aprendendo desenvolvimento web pela base, e cada uma constrói as próprias telas. Um framework esconderia justamente o que o projeto quer ensinar.
- **Consequência:** cada página tem seu HTML e seu módulo JavaScript; componentes repetidos são resolvidos com classes de CSS e funções compartilhadas.

## ADR-002 · Um único arquivo de CSS

- **Decisão:** todas as páginas usam somente `site/css/estilos.css`.
- **Motivo:** evitar que cada tela tenha botões, cores e espaçamentos diferentes, e manter os tokens do DESIGN.md num só lugar.
- **Consequência:** estilos de uma página ficam numa seção própria, presos à classe da página. Mudanças em estilos compartilhados são combinadas antes.

## ADR-003 · Supabase como backend

- **Decisão:** usar o Supabase como backend (D38): banco de dados Postgres, arquivos (Storage), login dos agentes (Auth) e funções de servidor (Edge Functions).
- **Motivo:** o modelo de dados do Aedes é relacional (denúncia, dados privados, versão pública, visitas e histórico de eventos), e o Postgres oferece transações no banco, chaves estrangeiras e regras de acesso por linha escritas em SQL e versionadas no Git. O Supabase tem ambiente local completo pela Supabase CLI e plano gratuito compatível com a fase de desenvolvimento (D25).
- **Consequência:** a pasta `supabase/` guarda migrações, políticas e funções. As regras de acesso viram políticas de RLS, testadas com acesso negado para cada perfil. O plano gratuito limita o número de projetos e pausa projetos sem uso; o plano da produção e o alerta de orçamento entram em DEP-07.

## ADR-004 · Dados públicos e privados em tabelas separadas

- **Decisão:** guardar a versão pública da denúncia (`public_reports`) separada dos dados operacionais (`reports`) e pessoais (`report_private`).
- **Motivo:** as políticas de RLS do Postgres valem por linha, não por coluna. Restringir colunas na mesma tabela é possível, mas fácil de errar numa consulta futura; separar as tabelas é a forma segura de garantir que o visitante nunca receba nome, CPF, e-mail, telefone ou ponto exato.
- **Consequência:** toda gravação atualiza a versão pública por uma função de servidor, e as duas precisam ficar coerentes. Entre as tabelas de denúncia, `public_reports` é a única com leitura pública.

## ADR-005 · Leaflet para os mapas

- **Decisão:** usar Leaflet para desenhar o mapa público e o mapa de Ocorrências.
- **Motivo:** biblioteca leve, gratuita, que funciona com JavaScript puro e aceita diferentes provedores de camada visual.
- **Consequência:** o provedor da camada visual e seus limites de uso são escolhidos em DEP-07.

## ADR-006 · Sem conta para o cidadão

- **Decisão:** o cidadão não cria conta nem senha. A cada denúncia, depois de preencher os próprios dados, ele confirma por código o contato que escolher: e-mail, ou telefone por SMS ou WhatsApp. Só agentes e administrador têm login.
- **Motivo:** decisões de produto D06 e D08; reduz o atrito para enviar e o volume de dados pessoais guardados.
- **Consequência:** a confirmação fica presa àquela tentativa de envio e não vale para outra. A correção pelo cidadão usa uma autorização temporária ligada ao contato confirmado na denúncia (D26); o mecanismo está em D42, e os provedores de envio do código em DEP-03.

## ADR-007 · Envio idempotente por tentativa

- **Decisão:** cada tentativa de envio tem um ID estável, usado em todas as retentativas.
- **Motivo:** o banco e o Storage não compartilham transação. Sem um ID estável, uma queda de conexão ou um clique repetido criaria denúncias duplicadas (RF-DEN-04).
- **Consequência:** o servidor reconhece a mesma tentativa e devolve o mesmo protocolo.

## ADR-008 · Toda mudança de dados passa por função de servidor

- **Decisão:** o navegador só lê dados diretamente; envio, confirmação do código, mudança de etapa, registro de visita, ocultação e correção passam por Edge Functions do Supabase.
- **Motivo:** permissão, etapa, território e versão precisam ser conferidos num lugar que o usuário não controla.
- **Consequência:** as políticas de RLS não liberam inserção, alteração nem exclusão pelo navegador nas tabelas de denúncia. As funções usam a chave secreta do projeto, que fica só no servidor.

## ADR-009 · Projetos de backend separados por ambiente

- **Decisão:** criar projetos Supabase exclusivos do Aedes (ADR-003), um de teste e um de produção.
- **Motivo:** dados de teste e dados reais não podem se misturar; um projeto por ambiente evita vazamento e confusão de regras e permissões.

## ADR-010 · O PRD prevalece

- **Decisão:** quando o Figma, a arquitetura ou outro documento divergir do PRD sobre comportamento, vale o PRD.
- **Motivo:** o PRD é a fonte única do comportamento do produto. As divergências viram tarefa de ajuste em TASKS.md, em vez de serem resolvidas por quem estiver programando.

## ADR-011 · Inter como fonte única

- **Decisão:** usar Inter em todo o site.
- **Motivo:** é a fonte de quase todas as telas do Figma; algumas ainda usam Segoe UI, que não existe em celulares Android e iPhone.
- **Consequência:** as telas com Segoe UI são ajustadas no Figma (TASK-011).

## ADR-012 · Relatório do agente gerado no navegador

- **Decisão:** gerar o relatório do agente (RF-AGE-08) no próprio navegador, com jsPDF e o complemento AutoTable para o PDF e a biblioteca `docx` para o Word, importadas como módulos ES e carregadas só na tela do relatório.
- **Motivo:** mantém o custo zero (D25), não envia dados a serviços de terceiros e funciona com o mesmo JavaScript sem framework (ADR-001). A biblioteca `docx` gera um arquivo Word de verdade, que o supervisor consegue editar; imprimir a página como PDF não daria o formato Word e varia entre navegadores.
- **Consequência:** os dados do relatório vêm de um contrato próprio (`dadosRelatorio`), que não devolve campos privados do morador. As versões das bibliotecas ficam fixas na importação. Relatórios muito longos podem demorar no celular; se isso acontecer, o período máximo será limitado.

## ADR-013 · Área pública em grade fixa de 200 m

- **Decisão:** mostrar no mapa público a célula de uma grade fixa de cerca de 200 m, calculada no servidor, e nunca o ponto exato (D43).
- **Motivo:** o resultado é determinístico: o mesmo local sempre cai na mesma célula, então repetir a consulta ou comparar denúncias não aproxima do ponto. Um deslocamento sorteado pode ser deduzido em área pouco povoada, e mostrar só o bairro tiraria a utilidade do mapa.
- **Consequência:** `public_reports` guarda a célula e não o ponto. O tamanho da célula é configuração e é testado em áreas pouco povoadas e perto de divisas (AC-07). A célula pode cruzar a divisa de um bairro; o bairro exibido continua sendo o escolhido pela pessoa.

## ADR-014 · Ocultar como lixeira de 30 dias

- **Decisão:** ocultar leva a denúncia a uma lixeira; depois de 30 dias sem republicação, uma rotina diária a remove definitivamente do banco de dados e do armazenamento (D44).
- **Motivo:** tira o conteúdo inadequado do ar na hora, mas deixa o erro do agente reversível por um prazo, e evita guardar para sempre o que foi retirado, o que reduz dado pessoal retido (DEP-06) e custo de armazenamento (D25).
- **Consequência:** é exceção a D24. A remoção apaga também as visitas e o histórico da denúncia, e os totais de relatórios gerados depois dela não a incluem. Cópias de segurança do provedor podem guardar os dados por mais tempo, e isso entra em DEP-06 e DEP-07. As denúncias arquivadas (D41) também entram na lixeira. A rotina nunca remove uma denúncia que não esteja oculta, então o histórico das válidas fica por prazo indefinido (D24). A rotina é testada com data simulada.

## Modelo para uma nova decisão

```
## ADR-XXX · Título curto

- **Substitui:** ADR-YYY, se for o caso.
- **Decisão:** o que foi escolhido.
- **Motivo:** por que esta opção e não outra.
- **Consequência:** o que muda no projeto.
```
