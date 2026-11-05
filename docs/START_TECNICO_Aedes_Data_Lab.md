# Aedes Data Lab: Start Técnico

| Campo | Valor |
|---|---|
| Versão | 2.0 · 05/11/2026 |
| Estado | Plano técnico aprovado como base de construção; serviços ainda não implementados |
| Documento de produto | [PRD 2.0](./PRD_Aedes_Data_Lab.md) |

Este documento organiza a arquitetura e a ordem de implementação da V1. O comportamento do produto, as permissões e os critérios de aceite estão no PRD; se os dois divergirem, vale o PRD.

## 1. Ponto de partida

**Repositório em 05/11/2026 (commit `f403ef5`):** a pasta `site/` tem 12 páginas de estudo, sete da área pública e cinco da área dos agentes, com um CSS compartilhado e um JavaScript por tela, todos com conteúdo inicial. Ainda não há envio, banco, autenticação, publicação no mapa nem dashboard com dados. As branches das integrantes não têm alterações de código em relação ao `main`.

**Design:** as telas do Figma estão concluídas e são a referência visual para o HTML e o CSS. As 47 telas finais estão exportadas na pasta `wireframes/`, com o requisito do PRD correspondente a cada uma. Os cartões ADL-86 a ADL-89 do Jira cobrem o HTML das quatro primeiras telas.

A V1 precisa entregar o percurso **formulário → confirmação e gravação → versão pública → mapa → Ocorrências do agente → atualização da etapa, ocultação e correção**. Dashboard e gráficos ficam para depois.

## 2. Arquitetura

O site continua em HTML, um CSS compartilhado e JavaScript modular por tela. O backend será Firebase, combinando Firestore, Authentication, Storage, Functions e Emulator Suite; a composição final depende da modelagem, do custo (DEP-07) e das regras de acesso. Vite pode entrar para o desenvolvimento local quando ajudar, sem reescrever as páginas. Leaflet pode renderizar os mapas, e o provedor da camada visual ainda será escolhido. Chart.js só entra com o dashboard.

| Camada | Responsabilidade |
|---|---|
| Páginas | Formulário, mensagens, mapa e telas dos agentes |
| Domínio | Validação, etapas, datas, território, aproximação pública e regras de publicação |
| Serviços do cliente | Chamadas de envio, listagem, atendimento e correção |
| Backend e regras | Validar, autorizar, gravar, separar dados e gerar a versão pública |

As telas não fazem consultas diretas ao banco; tudo passa pela camada de serviços em `site/js/servicos/`. Contratos iniciais:

| Contrato | Quem pode chamar |
|---|---|
| `confirmarEmail` | Qualquer pessoa, com limite de repetição (RNF-08) |
| `salvarDenuncia` | Pessoa com e-mail confirmado para aquela tentativa |
| `listarDenunciasPublicas` | Qualquer pessoa; lê só a versão pública |
| `listarOcorrencias` | Agente autorizado |
| `iniciarAnalise`, `registrarObservacao`, `concluirOcorrencia` | Agente autorizado |
| `ocultarPublicacao`, `republicarOcorrencia` | Agente autorizado |
| `corrigirCamposDenuncia` | Administrador, em qualquer etapa; cidadão com vínculo comprovado, só na própria denúncia e só enquanto Recebida (D26) |

Ter apenas o papel de agente não dá permissão para corrigir os campos enviados.

## 3. Modelo inicial de dados

| Recurso | Conteúdo | Acesso |
|---|---|---|
| `reports/{id}` | Dados operacionais: ponto exato, bairro, categoria, etapa, datas e versão | Agentes autorizados e administrador |
| `report_private/{id}` | Nome, CPF declarado, e-mail confirmado e telefone opcional | Todos os agentes autorizados (D11) e administrador; o cidadão lê e corrige só a própria denúncia, enquanto Recebida |
| `public_reports/{id}` | Área aproximada, bairro, categoria, data, etapa, foto tratada e descrição | Leitura pública |
| `report_events/{id}` | Início de análise, observações, atendimento, ocultação, republicação e correções, com autor e data | Agentes autorizados e administrador; nunca público nem liberado ao cidadão |
| `users/{uid}` | Habilitação e papel (agente, administrador) | Acesso mínimo; gerido pelo administrador |
| Storage | Fotos originais em área restrita e versões públicas tratadas | Regras separadas para cada área |

O modelo será refinado durante a implementação. O CPF é obrigatório (D06), mas não autentica identidade. Nenhum caractere de nome, CPF ou e-mail vai para `public_reports`. A foto pública é gerada sem metadados pessoais. Como a descrição livre pode conter identificação incidental e a publicação é automática, a ocultação precisa funcionar desde o primeiro dia.

## 4. Fluxos técnicos da V1

### 4.1 Envio

1. Confirmar o acesso ao e-mail para aquela denúncia, sem criar conta permanente. A confirmação fica vinculada à tentativa e acontece antes do formulário longo. Expiração, reenvio e limite de tentativas são configurados em DEP-03.
2. Coletar ponto exato, bairro, categoria, descrição, de uma a três fotos, nome, CPF e telefone opcional. O endereço digitado aguarda DEP-12.
3. Validar no servidor o território, os tipos e tamanhos de arquivo e os dados. A validação no navegador só orienta o preenchimento.
4. Usar um ID estável por tentativa: reservar o registro como pendente, receber as fotos na área restrita, finalizar e só então gerar o protocolo.
5. Gerar a versão pública com posição aproximada e fotos tratadas. O agente vê o registro recebido imediatamente.
6. Se a publicação falhar, manter o protocolo, informar "publicação pendente" e recuperar com segurança. Repetir a tentativa não cria outra denúncia.

Firestore e Storage não compartilham transação, por isso reenvios e retentativas do backend precisam ser idempotentes. Os estados técnicos do envio (pendente, finalizado, publicação pendente) são independentes das etapas Recebida, Em análise e Atendida.

### 4.2 Mapa público

O mapa lê somente `public_reports`: foto, descrição, bairro, categoria, data, etapa e área aproximada. Denúncias atendidas continuam visíveis; as ocultas saem. A aproximação não pode revelar o ponto exato nem deslocar o marcador para outra localidade; método e precisão serão definidos em DEP-02. O documento privado nunca chega ao navegador do visitante.

### 4.3 Ocorrências do agente

O administrador libera, revoga e recupera as contas. Todos os agentes autorizados consultam as ocorrências de Itambé inteira e os campos privados, inclusive o CPF completo. Abrir o detalhe não altera a etapa. "Iniciar análise" e "Concluir" são operações explícitas com autor e data, e a conclusão exige visita ao local, data, ação realizada e observações. Sem solução, a ocorrência fica Em análise e recebe novas observações.

Quem inicia a análise fica registrado como autor, sem exclusividade sobre a ocorrência. Denúncias diferentes no mesmo local continuam separadas; o mapa com pontos exatos ajuda o agente a reconhecê-las, sem fusão nem alteração em lote. Antes de salvar, o serviço confere a etapa e a versão atuais para que uma ação concorrente não seja sobrescrita. As regras do backend negam operações ao visitante e à conta revogada.

Denúncias falsas ou fora do assunto seguem a regra provisória do PRD (seção 10.3) até a definição de DEP-11: o agente oculta a publicação quando for o caso, registra o motivo nas observações e mantém a ocorrência Em análise.

### 4.4 Ocultação e republicação

Ocultar exige motivo, preserva o registro interno e mantém a etapa. A V1 oculta a publicação inteira, incluindo o acesso público às fotos. Remover só o marcador não basta se a imagem continuar acessível pela URL antiga. Cópias baixadas por terceiros estão fora do alcance do sistema.

Cada decisão de publicação recebe uma versão, para que uma tarefa antiga não substitua uma ocultação ou republicação mais recente. Republicar exige ação explícita de agente autorizado e nunca altera a etapa de atendimento. Ocorrências não são reabertas; conclusão por engano ou reincidência pedem nova denúncia.

### 4.5 Correção de campos

O administrador corrige qualquer denúncia em qualquer etapa. O cidadão comprova acesso ao e-mail confirmado na denúncia e recebe uma autorização de edição restrita àquele registro, com prazo de validade e proteção contra reutilização, sem conta permanente. Protocolo, CPF ou e-mail digitado, sozinhos, não autorizam nada.

O serviço confere a etapa no momento de salvar. Se a ocorrência já estiver Em análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato (D26), e o administrador decide se aplica a mudança. Um ponto corrigido passa de novo pela validação de território.

Cada correção grava valor original, novo valor, motivo, autor e data em `report_events`. Se a denúncia estiver publicada, apenas a versão pública permitida é atualizada; se estiver oculta, continua oculta até uma republicação explícita. A troca de e-mail mantém a autoria, e o novo endereço precisa ser confirmado antes de servir para novas autorizações. O mecanismo detalhado é fechado em DEP-08.

## 5. Sequência de trabalho

1. **HTML e navegação:** montar as páginas a partir das telas finais do Figma e o menu compartilhado. Cada integrante apresenta e explica a própria tela.
2. **Contrato com dados fictícios:** definir o formato da denúncia e fazer formulário, lista e mapa lerem da mesma fonte.
3. **Formulário e mapa locais:** ponto manual e GPS, fotos, revisão e estados de erro; mapa centrado em Itambé sem exigir GPS.
4. **Emuladores Firebase:** ambiente separado do Repecol, separação entre público e privado, autenticação do agente e testes de acesso negado.
5. **Envio real:** confirmação de e-mail, upload, gravação, protocolo, versão pública, falhas parciais e reenvio.
6. **Ocorrências:** login, lista, detalhe e consulta espacial, análise, observações, conclusão após visita, histórico, ocultação, republicação e correção (administrador em qualquer etapa; cidadão só enquanto Recebida).
7. **Validação da V1:** percorrer os cenários AC-01 a AC-14 do PRD, inspecionar as respostas de rede e testar a retirada rápida de conteúdo.
8. **Fase seguinte:** dashboard e gráficos sobre a mesma base. Mapa técnico dedicado, Meu trabalho e agenda de visitas dependem de decisão própria.

Cada entrega deve ser pequena, revisada por outra integrante e demonstrável. As quatro integrantes programam HTML, CSS e JavaScript das próprias telas; banco e integrações são aprendidos em conjunto. Um cartão no Jira não indica módulo concluído.

## 6. Verificações antes da abertura pública

Os cenários AC-01 a AC-14 do PRD são o roteiro de aceite, e os requisitos RF e RNF permitem rastrear cada resultado. As dependências DEP-01 a DEP-12 precisam estar resolvidas nos prazos indicados no PRD (seção 18).

- Limite territorial de Itambé e regra de aproximação pública escolhidos e testados (DEP-01, DEP-02).
- Nome, CPF e contato ausentes de toda resposta pública, inclusive URLs e metadados de foto.
- Contas de agente revogáveis, operações protegidas no backend e trilha de mudanças completa.
- Ocultação e republicação testadas; responsável e substituto pela conferência diária designados; e-mail de contato criado e acompanhado (DEP-05).
- Instituição parceira identificada e vínculo formalizado (DEP-04).
- Adequação à LGPD concluída antes da coleta de dados reais: finalidade do CPF, base legal, controlador e encarregado, aviso de privacidade e retenção por tipo de dado (DEP-06).
- Provedor de mapa, estimativa de volume e custo, teto financeiro, limites e monitoramento definidos (DEP-07).
- Mensagem pública clara: enquanto não houver autorização, o serviço não se apresenta como canal oficial, e uma denúncia não garante vistoria nem prazo.

O lançamento é aberto a moradores reais, sem grupo fechado. O administrador aprova a abertura e responde pela manutenção. A falta de agentes por alguns dias não suspende o recebimento.

Decisões de produto ainda em aberto: dados no envio em nome de terceiros (DEP-10), encerramento de denúncias inválidas sem visita (DEP-11) e obrigatoriedade do endereço digitado (DEP-12). Detecção automática de imagens fica como ideia futura.

## 7. Referências

- [PRD do Aedes Data Lab](./PRD_Aedes_Data_Lab.md).
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), com as telas finais.
- [Jira ADL-85](https://aedesdatalab.atlassian.net/browse/ADL-85) e cartões de design e HTML.
- Roteiro de aprendizagem do projeto, mantido fora do repositório.
- PRD do Repecol, usado só como modelo de estrutura. Território, perfis extras, chat, comércio e dados daquele projeto não fazem parte do Aedes.

Nenhum serviço foi configurado ou testado até esta versão. HTML, CSS e JavaScript com Firebase é a direção do projeto; bibliotecas, coleções e contratos acima podem ser ajustados na implementação, desde que o PRD seja respeitado.

## 8. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 1.2 | 05/11/2026 | Plano técnico alinhado ao PRD 1.2 |
| 2.0 | 05/11/2026 | Alinhado ao PRD 2.0: D26 (correção do cidadão só enquanto Recebida), acesso dos agentes ao CPF conforme D11, revalidação de território na correção, regra provisória de DEP-11, LGPD em DEP-06, DEP-12, contratos com permissão por chamada, telas do Figma concluídas e estado do repositório em `f403ef5` |
