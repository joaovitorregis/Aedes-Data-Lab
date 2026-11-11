# Aedes Data Lab: Decisões técnicas

Registro das decisões de arquitetura (ADR) e do motivo de cada uma. Elas só mudam com um novo registro que substitua o anterior; ninguém, pessoa ou IA, troca uma escolha daqui sem passar por esse processo. As decisões de produto (D01 a D26) ficam no [PRD](./PRD.md), seção 5.

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

- **Situação:** Aceita · 04/11/2026
- **Decisão:** usar Firebase para banco, arquivos, autenticação e funções de servidor.
- **Motivo:** oferece banco, armazenamento, login e funções sem manter servidor próprio, tem ambiente local de testes (Emulator Suite) e cotas gratuitas compatíveis com a prioridade de custo baixo (D25).
- **Consequência:** a composição exata (Firestore, Storage, Authentication, Functions) é ajustada com a modelagem e o custo (DEP-07). Cloud Functions exige o plano Blaze, pago por uso e com cota gratuita, o que exige conta de faturamento e alerta de orçamento antes do ambiente público.

## ADR-004 · Dados públicos e privados em coleções separadas

- **Situação:** Proposta · 05/11/2026
- **Decisão:** guardar a versão pública da denúncia (`public_reports`) separada dos dados operacionais (`reports`) e pessoais (`report_private`).
- **Motivo:** as regras de acesso do Firestore valem por documento, não por campo. Separar é a forma segura de garantir que o visitante nunca receba nome, CPF, e-mail ou ponto exato.
- **Consequência:** toda gravação atualiza a versão pública por uma função de servidor, e as duas precisam ficar coerentes.

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
- **Motivo:** Firestore e Storage não compartilham transação. Sem um ID estável, uma queda de conexão ou um clique repetido criaria denúncias duplicadas (RF-DEN-04).
- **Consequência:** o servidor reconhece a mesma tentativa e devolve o mesmo protocolo.

## ADR-008 · Toda mudança de dados passa por função de servidor

- **Situação:** Proposta · 11/11/2026
- **Decisão:** o navegador só lê dados diretamente; envio, mudança de etapa, ocultação e correção passam por Cloud Functions.
- **Motivo:** permissão, etapa, território e versão precisam ser conferidos num lugar que o usuário não controla.
- **Consequência:** as regras do Firestore negam escrita direta do navegador nas coleções de denúncia.

## ADR-009 · Projeto Firebase próprio, separado do Repecol

- **Situação:** Aceita · 05/11/2026
- **Decisão:** criar projetos Firebase próprios do Aedes, um de teste e um de produção.
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

## Modelo para uma nova decisão

```
## ADR-XXX · Título curto

- **Situação:** Proposta ou Aceita · data
- **Decisão:** o que foi escolhido.
- **Motivo:** por que esta opção e não outra.
- **Consequência:** o que muda no projeto.
- **Substitui:** ADR-YYY, se for o caso.
```
