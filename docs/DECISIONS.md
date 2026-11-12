# Aedes Data Lab: Decisões técnicas

Registro das decisões de arquitetura (ADR) e do motivo de cada uma. Elas só mudam com um novo registro que substitua o anterior; ninguém, pessoa ou IA, troca uma escolha daqui sem passar por esse processo. As decisões de produto (D01 a D34) ficam no [PRD](./PRD.md), seção 5.

**Situação:** *Aceita* já vale para o projeto. *Proposta* é a direção atual e pode ser ajustada durante a implementação, com registro aqui.

## ADR-001 · HTML, CSS e JavaScript sem framework

- **Situação:** Aceita · 24/10/2026
- **Decisão:** construir o site com HTML, CSS e JavaScript em módulos ES, sem React, Vue ou outro framework.
- **Motivo:** as quatro integrantes estão aprendendo desenvolvimento web pela base, e cada uma constrói as próprias telas. Um framework esconderia justamente o que o projeto quer ensinar.
- **Consequência:** cada página tem seu HTML e seu módulo JavaScript; componentes repetidos são resolvidos com classes de CSS e funções compartilhadas.

## ADR-002 · Um único arquivo de CSS

- **Situação:** Aceita · 24/10/2026
- **Decisão:** todas as páginas usam somente `site/css/estilos.css`.
- **Motivo:** evitar que cada tela tenha botões, cores e espaçamentos diferentes, e manter os tokens do DESIGN.md num só lugar.
- **Consequência:** estilos de uma página ficam numa seção própria, presos à classe da página. Mudanças em estilos compartilhados são combinadas antes.

## ADR-003 · Firebase como backend

- **Situação:** Aceita · 04/11/2026. A ADR-012 propõe substituí-la; esta continua valendo até a ADR-012 ser aceita
- **Decisão:** usar Firebase para banco, arquivos, autenticação e funções de servidor.
- **Motivo:** oferece banco, armazenamento, login e funções sem manter servidor próprio, tem ambiente local de testes (Emulator Suite) e cotas gratuitas compatíveis com a prioridade de custo baixo (D25).
- **Consequência:** a composição exata (Firestore, Storage, Authentication, Functions) é ajustada com a modelagem e o custo (DEP-07). Cloud Functions exige o plano Blaze, pago por uso e com cota gratuita, o que exige conta de faturamento e alerta de orçamento antes do ambiente público.

## ADR-004 · Dados públicos e privados em tabelas separadas

- **Situação:** Proposta · 05/11/2026
- **Decisão:** guardar a versão pública da denúncia (`public_reports`) separada dos dados operacionais (`reports`) e pessoais (`report_private`).
- **Motivo:** as políticas de RLS do Postgres valem por linha, não por coluna. Restringir colunas na mesma tabela é possível, mas fácil de errar numa consulta futura; separar as tabelas é a forma segura de garantir que o visitante nunca receba nome, CPF, e-mail ou ponto exato.
- **Consequência:** toda gravação atualiza a versão pública por uma função de servidor, e as duas precisam ficar coerentes. `public_reports` é a única tabela com política de leitura para visitantes.

## ADR-005 · Leaflet para os mapas

- **Situação:** Proposta · 05/11/2026
- **Decisão:** usar Leaflet para desenhar os mapas público e técnico.
- **Motivo:** biblioteca leve, gratuita, que funciona com JavaScript puro e aceita diferentes provedores de camada visual.
- **Consequência:** o provedor da camada visual e seus limites de uso ainda serão escolhidos (DEP-07).

## ADR-006 · Sem conta para o cidadão

- **Situação:** Aceita · 05/11/2026
- **Decisão:** o cidadão confirma o e-mail a cada denúncia, sem senha e sem conta permanente. Só agentes e administrador têm login.
- **Motivo:** decisão de produto D08; reduz o atrito para enviar e o volume de dados pessoais guardados.
- **Consequência:** a correção pelo cidadão usa uma autorização temporária ligada ao e-mail confirmado na denúncia (D26, DEP-08).

## ADR-007 · Envio idempotente por tentativa

- **Situação:** Aceita · 05/11/2026
- **Decisão:** cada tentativa de envio tem um ID estável, usado em todas as retentativas.
- **Motivo:** o banco e o Storage não compartilham transação. Sem um ID estável, uma queda de conexão ou um clique repetido criaria denúncias duplicadas (RF-DEN-04).
- **Consequência:** o servidor reconhece a mesma tentativa e devolve o mesmo protocolo.

## ADR-008 · Toda mudança de dados passa por função de servidor

- **Situação:** Proposta · 11/11/2026
- **Decisão:** o navegador só lê dados diretamente; envio, mudança de etapa, ocultação e correção passam por Edge Functions do Supabase.
- **Motivo:** permissão, etapa, território e versão precisam ser conferidos num lugar que o usuário não controla.
- **Consequência:** as políticas de RLS não liberam inserção, alteração nem exclusão pelo navegador nas tabelas de denúncia. As funções usam a chave secreta do projeto, que fica só no servidor.

## ADR-009 · Projeto de backend próprio, separado do Repecol

- **Situação:** Aceita · 05/11/2026
- **Decisão:** criar projetos próprios do Aedes no backend escolhido (hoje, Supabase, pela ADR-012), um de teste e um de produção.
- **Motivo:** o Repecol tem outro território, outros perfis e outros dados; misturar os dois arriscaria vazamento e confusão de regras.

## ADR-010 · O PRD prevalece

- **Situação:** Aceita · 05/11/2026
- **Decisão:** quando o Figma, a arquitetura ou outro documento divergir do PRD sobre comportamento, vale o PRD.
- **Motivo:** o PRD é o documento aprovado. As divergências viram tarefa de ajuste em TASKS.md, em vez de serem resolvidas por quem estiver programando.

## ADR-011 · Inter como fonte única

- **Situação:** Proposta · 11/11/2026
- **Decisão:** usar Inter em todo o site.
- **Motivo:** é a fonte de quase todas as telas finais do Figma; algumas ainda usam Segoe UI, que não existe em celulares Android e iPhone.
- **Consequência:** as telas com Segoe UI são ajustadas no Figma (TASK-011).

## ADR-012 · Supabase como backend

- **Situação:** Proposta · 11/11/2026. Ao ser aceita, a ADR-003 passa a "Substituída pela ADR-012"
- **Decisão:** usar Supabase para banco (Postgres), arquivos (Storage), login dos agentes (Auth) e funções de servidor (Edge Functions).
- **Motivo:** o modelo de dados do Aedes é relacional (denúncia, dados privados, versão pública e histórico de eventos), e o Postgres oferece transações no banco, chaves estrangeiras e regras de acesso por linha escritas em SQL e versionadas no Git. O Supabase tem ambiente local completo pela Supabase CLI e plano gratuito compatível com a fase de desenvolvimento (D25).
- **Consequência:** a pasta `supabase/` guarda migrações, políticas e funções. As regras de acesso viram políticas de RLS, testadas com acesso negado para cada perfil. O plano gratuito limita o número de projetos e pausa projetos sem uso; o plano da produção e o alerta de orçamento entram na decisão de custo (DEP-07).
- **Substitui:** ADR-003.

## ADR-013 · Relatório do agente gerado no navegador

- **Situação:** Proposta · 12/11/2026
- **Decisão:** gerar o relatório do agente (RF-AGE-08) no próprio navegador, com jsPDF e o complemento AutoTable para o PDF e a biblioteca `docx` para o Word, importadas como módulos ES e carregadas só na tela do relatório.
- **Motivo:** mantém o custo zero (D25), não envia dados a serviços de terceiros e funciona com o mesmo JavaScript sem framework (ADR-001). A biblioteca `docx` gera um arquivo Word de verdade, que o supervisor consegue editar; imprimir a página como PDF não daria o formato Word e varia entre navegadores.
- **Consequência:** os dados do relatório vêm de um contrato próprio (`dadosRelatorio`), que não devolve campos privados do morador. As versões das bibliotecas ficam fixas na importação. Relatórios muito longos podem demorar no celular; se isso acontecer, o período máximo será limitado.

## Modelo para uma nova decisão

```
## ADR-XXX · Título curto

- **Situação:** Proposta ou Aceita · data
- **Decisão:** o que foi escolhido.
- **Motivo:** por que esta opção e não outra.
- **Consequência:** o que muda no projeto.
- **Substitui:** ADR-YYY, se for o caso.
```
