# Aedes Data Lab: Documento de Requisitos de Produto (PRD)

| Campo | Valor |
|---|---|
| Versão | 2.0 · 05/11/2026 |
| Estado | Aprovado como base de construção da V1 |
| Território | Itambé, Pernambuco |
| Responsável pelo documento | Administrador do produto |
| Público | Produto, design, desenvolvimento, testes e agentes participantes |
| Documento técnico | [Start Técnico](./START_TECNICO_Aedes_Data_Lab.md) |

## 1. Resumo executivo

O Aedes Data Lab é uma plataforma web em que moradores de Itambé/PE registram possíveis focos do mosquito da dengue. Cada denúncia traz o ponto do foco, fotos, uma descrição e a identificação de quem enviou, que fica restrita à equipe. Assim que o recebimento é confirmado, a denúncia entra na fila dos agentes e uma versão pública, com localização aproximada, aparece no mapa.

Os agentes usam login individual. Na área de Ocorrências eles iniciam a análise, registram observações, concluem o atendimento depois de ir ao local e podem ocultar ou republicar o conteúdo público. O administrador cuida dos acessos e pode corrigir os dados de qualquer denúncia. O cidadão que enviou também pode corrigir a sua, enquanto ela ainda não entrou em análise.

O produto mostra à equipe e à população onde há relatos. **Denúncias não equivalem a casos confirmados de dengue nem comprovam risco epidemiológico.**

A V1 precisa entregar o caminho inteiro: **envio → gravação → mapa público → Ocorrências dos agentes → atualização do atendimento**. Dashboard e gráficos ficam para a fase seguinte. O lançamento será aberto a qualquer morador, sem lista de convidados, e o recebimento continua mesmo quando nenhum agente estiver disponível por alguns dias. O administrador aprova a abertura e responde pela manutenção, em conjunto com uma instituição parceira que ainda será formalizada (DEP-04).

## 2. Como ler este documento

Este PRD descreve o comportamento esperado do produto e como cada parte será aceita. O Start Técnico trata da arquitetura e da ordem de implementação. Se os dois divergirem sobre comportamento, vale o PRD.

O texto usa três tipos de item:

- **Decisões de produto (D):** escolhas do responsável pelo produto, reunidas na seção 5.
- **Requisitos (RF e RNF):** o que o sistema precisa fazer, cada um com critério de aceite.
- **Dependências (DEP):** configurações, responsáveis ou políticas que precisam estar resolvidas antes de uma entrega específica (seção 18).

O desenvolvimento pode avançar com dados fictícios enquanto houver dependências de lançamento abertas. Toda mudança de escopo atualiza este PRD e os critérios de aceite no mesmo PR.

## 3. Glossário

| Termo | Significado |
|---|---|
| Denúncia | Envio feito pelo morador no fluxo Registrar foco |
| Ocorrência | A mesma denúncia, tratada na área dos agentes |
| Publicação | Versão pública da denúncia no mapa, apenas com os campos permitidos |
| Protocolo | Código gerado pelo serviço depois que a denúncia foi gravada; comprova o recebimento |
| Etapa de atendimento | Recebida, Em análise ou Atendida |
| Estado de publicação | Pendente, Publicada ou Oculta |
| Agente autorizado | Pessoa com login individual liberado pelo administrador para a área de Ocorrências |
| Administrador | Papel que gerencia acessos, corrige denúncias e aprova a abertura pública |
| Cidadão responsável pelo envio | Quem enviou a denúncia e comprova acesso ao e-mail confirmado nela |

## 4. Contexto e estado atual

O Aedes Data Lab precisa reunir relatos com informação suficiente para o trabalho dos agentes e dar à população uma visão pública do que foi relatado. A documentação ainda não inclui levantamento da rotina atual da prefeitura, e a adesão institucional ainda não foi formalizada.

A experiência é pensada primeiro para o celular e precisa funcionar bem no computador. Quatro integrantes constroem HTML, CSS e JavaScript das telas. Banco de dados e integrações serão aprendidos em conjunto com a coordenação do projeto, e essa ordem de aprendizagem não altera os critérios de aceite.

**Estado do repositório em 05/11/2026 (commit `f403ef5`):** a pasta `site/` tem 12 páginas de estudo, sete da área pública e cinco da área dos agentes, com um CSS compartilhado e um JavaScript por tela, todos com conteúdo inicial. Ainda não há envio, banco, autenticação nem publicação no mapa. As branches das integrantes não têm alterações de código em relação ao `main`. Meu trabalho, Mapa técnico e Dashboard já existem como páginas reservadas, fora do aceite da V1 (seção 6.1).

**Design:** as telas do Figma estão concluídas e são a referência visual da implementação. As telas finais ficam na página "Fluxo de telas · Jornada do Usuário" e estão exportadas na pasta `wireframes/`, com o requisito correspondente a cada uma. Se uma tela do Figma divergir deste PRD sobre comportamento, vale o PRD.

## 5. Decisões de produto

| ID | Decisão |
|---|---|
| D01 | A V1 inclui denúncia gravada, mapa público, lista e detalhe de Ocorrências e atualização do atendimento pelos agentes. |
| D02 | O lançamento é aberto a moradores reais, sem grupo fechado de convidados. |
| D03 | Foto e descrição são publicadas automaticamente, sem aprovação prévia de agente. |
| D04 | Agente autorizado pode ocultar uma publicação, com motivo, preservando o registro interno. Antes da abertura pública haverá um responsável e uma rotina diária de conferência. |
| D05 | Botão público para sinalizar conteúdo e análise automática de fotos ficam fora da V1. |
| D06 | Nome, CPF e e-mail confirmado são obrigatórios; telefone é opcional. Nenhum desses campos aparece no mapa, nem de forma parcial. |
| D07 | O CPF é obrigatório. A intenção é confirmar que a pessoa existe; como digitar ou validar o formato não comprova titularidade, o produto não anuncia identidade verificada. |
| D08 | O cidadão confirma o e-mail a cada denúncia. A V1 não tem conta permanente nem histórico pessoal. |
| D09 | O público vê a localização aproximada; agentes autorizados veem o ponto exato. |
| D10 | Só são aceitas denúncias dentro de Itambé/PE. O mapa pode ser navegado fora do município, o envio não. |
| D11 | Cada agente tem login individual liberado pelo administrador. Todos os agentes autorizados consultam todas as ocorrências de Itambé e os dados privados, inclusive o CPF completo. |
| D12 | Etapas de atendimento: Recebida → Em análise → Atendida. Abrir o detalhe não muda a etapa; iniciar a análise é uma ação explícita. |
| D13 | Para marcar como Atendida, o agente precisa ter ido ao local e analisado a situação, registrando data, ação realizada e observações. A resposta ao cidadão é a atualização da ocorrência, sem mensagem individual. |
| D14 | Se a gravação funcionar e a publicação falhar, o cidadão recebe o protocolo e o aviso de publicação pendente. |
| D15 | Dashboard e gráficos vêm depois da V1. Contagens representam relatos e não classificam risco automaticamente. |
| D16 | Repelentes é conteúdo educativo. Chat, comércio, pedidos e produção ficam fora da V1. |
| D17 | Quando não consegue resolver, o agente mantém a ocorrência Em análise e registra observações internas. |
| D18 | Ocorrências não são reabertas. Conclusão por engano ou reaparecimento do problema exige nova denúncia. |
| D19 | O agente pode republicar uma ocorrência oculta depois de revisá-la. Ocultar não apaga o registro. |
| D20 | O administrador corrige os campos de qualquer denúncia. O cidadão responsável pelo envio corrige apenas a própria, dentro do prazo definido em D26. Agentes ficam com as ações operacionais. |
| D21 | Envio em nome de outra pessoa é aceito em princípio. A quem pertencem nome, CPF e e-mail nesse caso ainda será definido (DEP-10). |
| D22 | O administrador libera, revoga e recupera contas de agentes, aprova a abertura pública e assume a manutenção. A responsabilidade pelo serviço é compartilhada com uma instituição parceira a formalizar (DEP-04). |
| D23 | A falta de agentes por vários dias não suspende o recebimento. Haverá um e-mail de contato para reclamações, pedidos de correção e retirada de conteúdo (DEP-05). |
| D24 | As informações devem ser preservadas por prazo indefinido, sem perda de histórico. A política por tipo de dado será formalizada em DEP-06. |
| D25 | O custo de operação deve ser baixo, idealmente zero. Ainda não há teto financeiro definido (DEP-07). |
| D26 | O cidadão corrige a própria denúncia somente enquanto ela estiver Recebida. Depois que entra Em análise, ele pede a correção pelo e-mail de contato (D23) e o administrador decide se aplica. |

## 6. Objetivos e escopo da V1

A V1 precisa levar uma denúncia até os agentes e ao mapa público sem expor os campos privados. Cada resultado abaixo tem uma evidência de entrega:

| Resultado | Evidência de entrega |
|---|---|
| Recebimento confiável | Protocolo exibido na confirmação e registro presente após recarregar |
| Visibilidade pública | A mesma denúncia no mapa, com área aproximada e só os campos permitidos |
| Operação do agente | Conta autorizada abre o detalhe, inicia a análise e registra o atendimento |
| Proteção de acesso | Visitante não lê dados privados nem executa ações dos agentes |
| Retirada de publicação | Ocultação com motivo tira o conteúdo do ar e mantém o histórico interno |
| Recuperação de falhas | GPS negado, falha de upload, resposta perdida e reenvio têm comportamento verificável |

Este PRD não fixa prazo de vistoria, número de usuários, volume de denúncias ou meta de redução da dengue. As metas de adoção serão combinadas com a operação (DEP-09).

### 6.1 Matriz de escopo

| Capacidade | V1 | Depois da V1 |
|---|---|---|
| Página Início com acesso a registrar e consultar | Incluída | Refinamentos de conteúdo |
| Confirmação de e-mail por denúncia | Incluída | Sem conta permanente prevista |
| Formulário, fotos, localização e protocolo | Incluídos | Melhorias a partir do uso |
| Mapa público com filtros | Incluído | Novas formas de leitura do território |
| Login, lista, detalhe e ações do agente | Incluídos | Outras ferramentas operacionais |
| Ponto exato no detalhe da ocorrência | Incluído | Mapa técnico dedicado, em decisão própria |
| Dashboard, gráficos e comparações | Fora do aceite | Fase seguinte |
| Guia Aedes, Repelentes, Quem somos e entrada do jogo | Complementares, em paralelo | Conteúdo conforme fontes e design |
| Agenda de visitas, Meu trabalho e rotas | Fora do aceite | Sem compromisso neste roadmap |
| Chat, resposta individual, push e central de notificações | Fora da V1 | Sem compromisso |
| Conta e histórico pessoal do cidadão | Fora da V1 | Sem compromisso |
| Comércio e produção de repelente | Fora do produto | Não importar do Repecol |

O e-mail de confirmação faz parte da V1 mesmo com notificações fora do escopo. A ausência do dashboard também não dispensa a gravação dos dados que as análises futuras vão usar.

## 7. Perfis e permissões

| Operação | Visitante | Cidadão responsável pelo envio | Agente autorizado | Administrador |
|---|---|---|---|---|
| Ver o mapa público | Sim | Sim | Sim | Sim |
| Enviar denúncia | Sim, após confirmar o e-mail | Sim, uma nova denúncia | Pelo fluxo público | Pelo fluxo público |
| Ler campos privados | Não | Só os que enviou na própria denúncia | Todas as ocorrências de Itambé, inclusive CPF completo | Sim, para corrigir |
| Corrigir campos enviados | Não | Própria denúncia, enquanto Recebida | Não | Qualquer denúncia, em qualquer etapa |
| Iniciar análise, registrar observação e concluir | Não | Não | Sim | Somente se também tiver papel de agente |
| Ocultar e republicar | Não | Não | Sim | Somente se também tiver papel de agente |
| Ver observações e histórico interno | Não | Não | Sim | No que for necessário à correção |
| Liberar, revogar e recuperar contas de agentes | Não | Não | Não | Sim |
| Apagar histórico pela interface | Não | Não | Não | Não |

Os agentes autorizados enxergam o município inteiro, sem divisão por equipe ou região. A permissão de correção do cidadão funciona sem conta permanente e não dá acesso às notas dos agentes, ao histórico interno ou a denúncias de outras pessoas. Corrigir dados é uma permissão separada das ações de análise, atendimento e publicação.

## 8. Dados da denúncia

| Campo | Obrigatório | Destino e regra |
|---|---|---|
| Nome | Sim | Privado. Iniciais e apelidos derivados também não são publicados |
| CPF | Sim | Privado. Dado declarado, sem prova de titularidade |
| E-mail | Sim, confirmado a cada denúncia | Privado. A confirmação não valida CPF nem identidade civil |
| Telefone | Não | Privado. Não implica envio de WhatsApp ou SMS |
| Ponto do foco | Sim | Exato na área dos agentes; aproximado no mapa público |
| Bairro ou localidade | Sim | Público, a partir de catálogo configurado (DEP-01) |
| Categoria | Sim | Pública, a partir de catálogo versionado para preservar registros antigos |
| Descrição | Sim | Publicada automaticamente após o recebimento |
| Fotos | De uma a três | Publicadas após tratamento técnico, sem aprovação humana prévia |
| Endereço digitado | Previsto; obrigatoriedade em DEP-12 | Privado. Não substitui o ponto marcado no mapa |
| Referência do local | Não | Privada, para não anular a aproximação pública |
| Protocolo, data e etapa | Gerados pelo serviço | Data e etapa são públicas; o protocolo é o comprovante de recebimento |
| Ação realizada, observações e autor | Na conclusão pelo agente | Internos; as observações nunca vão para o mapa |

O ponto marcado no mapa é a referência espacial exata da denúncia. Endereço e referência ficam privados porque revelariam o local que a área aproximada protege. Categorias, formatos e tamanhos de arquivo e a precisão da área pública serão configurados na implementação, sem reaproveitar automaticamente os valores do Repecol.

O CPF passa por conferência de formato e dígitos verificadores, para pegar erro de digitação. Não há consulta externa nem validação de titularidade. O mesmo CPF ou e-mail pode aparecer em denúncias diferentes, e o sistema não limita o número de denúncias por pessoa. Controle de abuso (RNF-08) atua sobre repetição e volume, sem bloquear relatos legítimos.

Antes do envio, o formulário avisa que foto e descrição serão públicas e orienta a evitar rostos, placas e dados pessoais. Como a V1 publica sem revisão prévia, uma foto ou um texto ainda pode identificar alguém. A separação dos campos protege os dados estruturados; para conteúdo indevido encontrado depois, o caminho é a ocultação.

## 9. Requisitos funcionais

### RF-AUT-01 · Confirmar o e-mail a cada denúncia

O envio final depende da prova de acesso ao e-mail, vinculada àquela tentativa de denúncia. A pessoa pode corrigir o endereço e pedir nova confirmação se o código falhar ou expirar. A confirmação acontece antes do formulário longo, para que ninguém perca o preenchimento por um e-mail errado. Essa etapa não vira cadastro com senha.

**Aceite:** e-mail sem confirmação ou com confirmação inválida não finaliza a denúncia; a confirmação de uma tentativa não vale para outra; uma resposta perdida depois do envio não obriga a pessoa a refazer a denúncia.

### RF-AUT-02 · Proteger a sessão do agente

Login individual, com autorização concedida pelo administrador fora do cadastro público, e opção de sair. A revogação bloqueia novas leituras e operações protegidas. Ao sair, a interface limpa as informações privadas da tela.

**Aceite:** visitante e conta sem papel de agente não leem o detalhe privado nem mudam a etapa; conta revogada para de operar; conhecer o endereço de uma página técnica não concede acesso.

### RF-DEN-01 · Preencher e revisar

O formulário apresenta localização, evidências, identificação e revisão em passos claros. Antes do envio a pessoa pode corrigir qualquer campo e remover ou trocar fotos. Voltar um passo não apaga o que foi preenchido.

**Aceite:** campo obrigatório vazio impede o envio e a mensagem de erro indica o campo; a revisão separa visualmente o que será público do que é privado; os valores são preservados entre os passos. A V1 não recupera o preenchimento depois que o navegador é fechado.

### RF-DEN-02 · Escolher o local e validar o território

A pessoa marca e ajusta o ponto manualmente. O GPS é opcional e só é acionado por ela; a posição do aparelho não é tratada como posição do foco. A validação do território acontece no serviço.

**Aceite:** GPS negado não impede a marcação manual; ponto fora de Itambé é recusado; trocar o bairro digitado não contorna a validação do ponto; a localização do aparelho não é coletada de forma contínua.

### RF-DEN-03 · Receber fotos

Aceita de uma a três fotos, com prévia, remoção e mensagens de progresso. O serviço verifica cada arquivo e gera a versão pública sem metadados pessoais, como as coordenadas da câmera.

**Aceite:** arquivo inválido ou acima do limite é recusado com explicação; envio sem foto não gera sucesso; falha de upload mantém o formulário preenchido para nova tentativa. O tratamento técnico da imagem não é apresentado como revisão de conteúdo.

### RF-DEN-04 · Gravar e confirmar

O protocolo só é gerado depois que a gravação da denúncia completa é confirmada. A interface bloqueia cliques repetidos e o serviço também trata a repetição.

**Aceite:** duas solicitações da mesma tentativa geram uma única denúncia e um único protocolo; queda de conexão depois da gravação permite recuperar o resultado; uma nova denúncia intencional abre nova tentativa.

### RF-DEN-05 · Informar o estado da publicação

Recebimento e publicação são resultados distintos. A denúncia gravada fica disponível aos agentes mesmo quando a publicação no mapa está pendente.

**Aceite:** serviço indisponível antes da gravação não gera confirmação; denúncia gravada com publicação falha exibe o protocolo e o aviso de publicação pendente; a nova tentativa de publicação usa o mesmo registro.

### RF-MAP-01 · Consultar denúncias públicas

Mapa sem login, com posição aproximada, bairro ou localidade, categoria, data de recebimento, etapa atual, foto e descrição. Denúncias atendidas continuam no mapa, a menos que estejam ocultas.

**Aceite:** o visitante encontra a denúncia publicada e abre seu detalhe; nenhuma resposta de rede, URL de mídia ou metadado entrega campo privado, referência do local ou ponto exato. O limite sobre conteúdo incidental em texto e foto segue a seção 8.

### RF-MAP-02 · Filtrar e tratar falhas

Filtros por localidade, período de recebimento e etapa. Os filtros continuam aplicados quando a pessoa abre uma denúncia e volta ao mapa. A tela diferencia três situações: não há denúncias, não há resultado para os filtros escolhidos, ou houve erro de carregamento.

**Aceite:** os marcadores correspondem ao recorte indicado nos filtros; erro nunca aparece como contagem zero; falha da camada do mapa oferece nova tentativa sem apagar formulário aberto. Agrupamento de pontos, busca por rua e imagem de satélite não fazem parte do aceite.

### RF-AGE-01 · Consultar a fila e o detalhe

A lista mostra protocolo, data, localidade, categoria e etapa, com filtros por protocolo, localidade, período e etapa e ordenação por mais antigas ou mais recentes. O detalhe traz fotos, descrição, ponto exato, identificação privada e histórico. A consulta espacial dos agentes usa os pontos exatos, para que se reconheçam denúncias no mesmo local; o desenho define se ela fica em tela própria ou dentro de Ocorrências.

Denúncias diferentes sobre o mesmo local continuam sendo ocorrências separadas. O agente percebe a coincidência no mapa e trata cada uma, sem fusão automática nem descarte por proximidade. Vários relatos no mesmo ponto não significam vários focos. Ações em lote não estão previstas.

**Aceite:** o filtro de protocolo leva à ocorrência certa; o detalhe corresponde a ela; abrir e fechar não altera a etapa; lista vazia e falha de carregamento têm mensagens próprias.

### RF-AGE-02 · Iniciar a análise

Ação explícita que leva a ocorrência de Recebida para Em análise e registra o agente e o momento.

**Aceite:** a leitura não muda a etapa; clique repetido não duplica o evento; o agente que iniciou fica registrado como autor, e isso não dá a ele exclusividade nem impede outros agentes de agir.

### RF-AGE-03 · Registrar o atendimento

O agente conclui a ocorrência **depois de ir ao local e analisar a situação**, informando data do atendimento, ação realizada e observações. Atendida indica que houve visita; não quer dizer que o foco foi confirmado ou eliminado. Se o problema não foi resolvido, a ocorrência fica Em análise e o impedimento vai para as observações.

**Aceite:** a conclusão exige o registro da visita e os campos obrigatórios; etapa e histórico são gravados juntos; o mapa passa a exibir Atendida quando a ocorrência está publicada; o texto interno da ação não substitui a descrição pública. O registro da visita é uma declaração do agente; não há rastreamento por GPS nem foto obrigatória após a visita.

### RF-AGE-04 · Ocultar a publicação

O agente autorizado retira o conteúdo público informando o motivo. O registro e o histórico privados continuam disponíveis. A V1 oculta a publicação inteira, incluindo as fotos; ocultar apenas uma foto não está previsto.

**Aceite:** depois da ocultação, novas consultas públicas à denúncia e às suas mídias não retornam conteúdo; o agente continua vendo o registro e o motivo; tentativas antigas de publicação não reexibem a denúncia oculta. Cópias que terceiros já tenham baixado estão fora do alcance do sistema.

### RF-AGE-05 · Registrar observações durante a análise

O agente acrescenta observações internas sobre a visita, impedimentos, a situação encontrada ou providências pendentes. As observações não alteram o texto enviado pelo morador.

**Aceite:** cada observação guarda autor e data; aparece para os agentes e fica fora da consulta pública; salvar uma observação não conclui a ocorrência nem sobrescreve as anteriores.

### RF-AGE-06 · Republicar após revisão

O agente pode republicar uma ocorrência oculta depois de revisar o conteúdo e, se for o caso, obter a correção pelo administrador ou pelo cidadão (RF-COR-01). Autor e data da decisão ficam registrados. Republicar muda apenas a visibilidade; a etapa de atendimento continua a mesma.

**Aceite:** a publicação só volta por ação explícita de agente autorizado; usa a versão atual do conteúdo e das mídias; uma tarefa antiga de publicação não desfaz a ocultação; uma ocultação posterior prevalece sobre tarefas antigas de republicação; o histórico guarda as duas decisões.

### RF-COR-01 · Corrigir campos enviados

O administrador corrige os campos de qualquer denúncia, em qualquer etapa. O cidadão responsável pelo envio corrige a própria denúncia enquanto ela estiver Recebida. Quando a ocorrência já está Em análise ou Atendida, o cidadão pede a correção pelo e-mail de contato e o administrador decide se aplica (D26).

Podem ser corrigidos o ponto do foco, bairro, categoria, descrição e os dados de identificação e contato. Um ponto corrigido passa de novo pela validação de território. A correção é diferente de uma observação de agente e nunca reabre uma ocorrência concluída.

O vínculo do cidadão é comprovado pelo acesso ao e-mail confirmado na denúncia. Esse acesso gera uma autorização de edição restrita àquela denúncia, com prazo de validade e proteção contra reutilização. Protocolo, CPF ou o endereço de e-mail digitado, isoladamente, não liberam acesso. Se o cidadão trocar o e-mail de contato, a autoria é mantida e o novo endereço precisa ser confirmado antes de servir para novas autorizações.

Toda correção guarda o valor original, o novo valor, o motivo, o autor e o instante em histórico privado. Se a denúncia estiver publicada, a versão pública é atualizada sem expor dados privados. Se estiver oculta, continua oculta até uma republicação explícita.

**Aceite:** o administrador corrige qualquer denúncia; o cidadão com vínculo comprovado corrige apenas a própria e somente na etapa Recebida; a etapa é conferida no momento de salvar, e uma correção do cidadão enviada depois do início da análise é recusada com orientação para usar o e-mail de contato; visitantes, cidadãos de outras denúncias e agentes sem papel de administrador são impedidos, inclusive em chamadas diretas ao serviço; a correção preserva o valor original, mantém o protocolo e não muda sozinha etapa ou visibilidade; o histórico de correção não aparece no mapa nem é liberado ao cidadão.

## 10. Etapas de atendimento e visibilidade

Etapa de atendimento e estado de publicação são campos independentes. Ocultar uma denúncia não significa atendê-la, rejeitá-la ou excluí-la.

### 10.1 Transições de atendimento

| Origem | Ação | Destino | Exigência |
|---|---|---|---|
| Denúncia completa | Confirmar recebimento | Recebida | Protocolo e data gerados pelo serviço |
| Recebida | Cidadão corrige campos | Recebida | Vínculo comprovado; histórico da correção |
| Recebida | Iniciar análise | Em análise | Agente autorizado, ação explícita, autor e data |
| Em análise | Concluir após visita e análise local | Atendida | Visita registrada, data, ação realizada e observações |
| Em análise | Registrar impedimento ou observação | Em análise | Autor e data |
| Qualquer etapa | Administrador corrige campos | Mesma etapa | Motivo e histórico da correção |
| Qualquer etapa | Abrir ou consultar | Mesma etapa | Nenhum evento de mudança |
| Qualquer etapa | Ocultar publicação | Mesma etapa | Motivo e papel de agente |
| Qualquer etapa | Republicar após revisão | Mesma etapa | Decisão explícita de agente autorizado |

Ocorrência Atendida não volta para Em análise, nem por correção. Conclusão por engano ou reaparecimento do problema pedem nova denúncia. Ninguém apaga histórico pela interface.

Quando duas pessoas agem ao mesmo tempo, o serviço confere a versão e a etapa atuais antes de salvar. Uma tela desatualizada não sobrescreve a ação de outro agente.

### 10.2 Estados de publicação

| Estado | O que o público vê | O que o agente vê |
|---|---|---|
| Pendente | A denúncia ainda não aparece no mapa | Registro completo, com a etapa de atendimento preservada |
| Publicada | Campos permitidos e fotos tratadas | Registro completo |
| Oculta | Registro e fotos deixam de ser servidos | Registro, etapa e motivo da ocultação |

Uma falha temporária de publicação pode ser recuperada automaticamente. A ocultação é uma decisão operacional e prevalece sobre qualquer tarefa antiga. Para passar de Oculta para Publicada, um agente precisa decidir de novo depois de revisar; a implementação distingue a decisão mais recente das retentativas de decisões anteriores.

### 10.3 Denúncias improcedentes e conteúdo inadequado

Denúncias falsas, improcedentes ou fora do assunto são analisadas pelo agente, que registra observações e pode ocultar a publicação. Detecção automática de imagens fica como ideia para o futuro, caso o problema se torne frequente.

O encerramento de uma denúncia inválida que não exige visita ainda está em definição (DEP-11). Até lá, o agente oculta a publicação quando for o caso, registra o motivo nas observações e mantém a ocorrência Em análise. Esses casos não são marcados como Atendida.

## 11. Jornadas e mensagens

**Morador:** abre Registrar foco → confirma o e-mail → marca o local → preenche descrição, categoria e fotos → informa nome, CPF e, se quiser, telefone → revisa o que será público e o que é privado → envia → recebe o protocolo e o estado da publicação.

**Visitante:** abre o mapa → aplica filtros → consulta descrição, fotos e etapa de uma denúncia publicada. Não precisa de conta e não vê identidade nem contato.

**Agente:** entra com a conta autorizada → filtra as Ocorrências → consulta detalhe e mapa → inicia a análise → visita o local → conclui com o registro do atendimento ou mantém Em análise com observações. Em qualquer etapa pode ocultar conteúdo inadequado e, depois de revisar, republicar.

**Correção pelo cidadão:** enquanto a denúncia está Recebida, ele comprova acesso ao e-mail confirmado → corrige os campos → o histórico interno registra a alteração. Depois do início da análise, ele escreve para o e-mail de contato e o administrador avalia o pedido.

**Correção pelo administrador:** abre a denúncia → corrige com motivo → se ela estiver oculta, um agente revisa e decide sobre a republicação.

O sistema usa três mensagens distintas no envio: "Não foi possível enviar", "Denúncia recebida; publicação pendente" e "Denúncia recebida e publicada". Nenhuma mensagem afirma que um agente foi avisado pessoalmente, que haverá vistoria ou que existe prazo. O protocolo comprova o recebimento. Consulta privada por protocolo e resposta individual ao cidadão estão fora do escopo.

## 12. Dados e acesso

| Grupo de dados | Consulta pública | Área dos agentes |
|---|---|---|
| Categoria, bairro, data de recebimento e etapa | Sim, quando publicada | Sim |
| Descrição e fotos tratadas | Sim, sem revisão humana prévia | Sim |
| Área aproximada | Sim | Sim, quando útil |
| Ponto exato e referência do local | Não | Sim |
| Nome, CPF, e-mail e telefone | Não, nem mascarados | Sim |
| Histórico, autor das ações e observações | Não | Sim |
| Motivo da ocultação | Não | Sim |

O cidadão com vínculo comprovado acessa os campos que enviou na própria denúncia para corrigi-los, dentro do prazo de D26. Esse acesso não torna os dados públicos e não libera histórico, observações ou dados de outras pessoas.

A separação entre público e privado acontece nos dados que o serviço devolve; esconder campos só na tela não basta. Nomes de coleções e contratos estão no Start Técnico. O e-mail confirmado não autentica o CPF, e a V1 não tem integração de verificação de identidade.

O produto não terá perfil público de denunciante, rastreamento de localização atual nem credenciais administrativas guardadas no navegador. A preferência por guardar as informações por prazo indefinido está registrada em D24. Antes da coleta de dados reais, DEP-06 precisa definir retenção por tipo de dado, correção, retirada e exclusão aplicáveis. Não haverá expiração automática arbitrária, e o produto não promete armazenamento eterno gratuito.

## 13. Requisitos não funcionais

| ID | Requisito | Como verificar |
|---|---|---|
| RNF-01 | Uso em celular e computador | Fluxo completo sem perda de conteúdo e sem rolagem horizontal em 320, 390, 768 e 1440 px |
| RNF-02 | Acessibilidade do fluxo principal | Rótulos, erro associado ao campo, foco visível, uso por teclado e etapa indicada por texto além da cor |
| RNF-03 | Autorização no serviço | Tentativas sem papel ou com conta revogada são negadas também fora da interface |
| RNF-04 | Integridade do envio | Repetição, falha parcial de foto e resposta perdida não geram sucesso falso nem duplicidade |
| RNF-05 | Publicação sem dados privados | Testes confirmam que a API pública não devolve dados privados, metadados de foto ou ponto exato |
| RNF-06 | Controle de publicação | Denúncia oculta sai da consulta e das mídias públicas; tarefas antigas não desfazem decisões posteriores; republicar exige ação explícita |
| RNF-07 | Uso limitado de recursos | Fotos e consultas têm limites configurados, a lista dos agentes é paginada e as assinaturas são encerradas ao sair |
| RNF-08 | Proteção contra abuso | Confirmação de e-mail e envio têm limite de repetição no serviço, além do bloqueio do botão |
| RNF-09 | Histórico confiável | Autor e instante vêm da sessão e do serviço; ações simultâneas não apagam registros |
| RNF-10 | Dados pessoais em logs | Logs e métricas não registram CPF, contato, texto livre ou foto sem necessidade operacional definida |

Metas numéricas de latência, volume e disponibilidade serão definidas junto com as cotas do provedor (DEP-07). A forma e a precisão do mapa público precisam ser testadas também em áreas pouco povoadas, onde aproximar o ponto protege menos.

## 14. Indicadores

O lançamento já coleta medidas operacionais para acompanhar falhas e adesão, mesmo sem dashboard.

| Medida | Definição |
|---|---|
| Denúncias recebidas | Denúncias gravadas no período |
| Distribuição por etapa | Etapa atual das denúncias do mesmo período |
| Tempo até a primeira análise | Intervalo entre o recebimento e o início da análise; não equivale ao tempo de vistoria |
| Falhas e repetições | Tentativas com falha e recuperações, sem contar a mesma tentativa duas vezes |
| Publicações ocultas | Retiradas com motivo, mantidas no histórico |
| Denúncias por localidade | Número de relatos por bairro; não representa casos confirmados nem prioridade |

O dashboard da fase seguinte usa a mesma base. Períodos e comparações serão especificados nessa fase. As contagens não geram prioridade automática, mapa de casos, metas epidemiológicas ou promessa de redução da doença.

## 15. Plano de validação e rastreabilidade

| Cenário | Critério verificável | Requisitos |
|---|---|---|
| AC-01 · Envio válido | Confirma o e-mail, envia campos, fotos e ponto válidos, recebe o protocolo e encontra o registro gravado | RF-AUT-01, RF-DEN-01 a RF-DEN-04 |
| AC-02 · Entrada inválida | E-mail sem confirmação, campo ausente, foto inválida e ponto fora do território não finalizam o envio | RF-AUT-01, RF-DEN-01 a RF-DEN-03 |
| AC-03 · GPS negado | A pessoa marca o ponto manualmente e segue sem perder dados | RF-DEN-02 |
| AC-04 · Rede e reenvio | Falha antes ou depois da gravação e envio repetido resultam em no máximo um registro por tentativa; limites de repetição aplicados no serviço | RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08 |
| AC-05 · Publicação pendente | Gravação confirmada com mapa pendente mantém o protocolo e o acesso do agente | RF-DEN-05 |
| AC-06 · Mapa e filtros | Visitante vê os campos permitidos, filtros coerentes e denúncias atendidas; erro não vira zero; limites de consulta e paginação respeitados | RF-MAP-01, RF-MAP-02, RF-AGE-01, RNF-07 |
| AC-07 · Privacidade | API, URLs e metadados públicos não trazem dados privados nem ponto exato; logs e métricas também não | RF-MAP-01, RNF-05, RNF-10 |
| AC-08 · Permissões | Visitante e conta revogada não leem dados privados nem alteram ocorrências | RF-AUT-02, RNF-03 |
| AC-09 · Atendimento | Leitura não muda a etapa; conclusão exige visita e campos obrigatórios; impedimento mantém Em análise com observações; Atendida não reabre | RF-AGE-01 a RF-AGE-03, RF-AGE-05 |
| AC-10 · Concorrência | Ação antiga ou repetida não sobrescreve transição posterior nem duplica evento | RF-AGE-02, RF-AGE-03, RNF-09 |
| AC-11 · Ocultação | Retirada interrompe consulta e mídia públicas, mantém o registro interno e resiste a retentativas de publicação | RF-AGE-04, RNF-06 |
| AC-12 · Interfaces | Jornadas executáveis nos tamanhos definidos e por teclado, com estados de erro e vazio | RNF-01, RNF-02 |
| AC-13 · Republicação | Agente revisa e republica explicitamente; histórico preservado; etapa inalterada; tarefa antiga não desfaz ocultação posterior | RF-AGE-06, RNF-06 |
| AC-14 · Correção autorizada | Administrador corrige em qualquer etapa; cidadão corrige só a própria denúncia e só enquanto Recebida; tentativa do cidadão após o início da análise é recusada; acesso indevido negado; original e motivo preservados; etapa e visibilidade inalteradas | RF-COR-01, RNF-03, RNF-05, RNF-09 |

Os testes começam com dados fictícios e serviços de teste. Cada execução registra a versão testada, o resultado e as limitações encontradas. Capturas do Figma não substituem esses cenários. A etapa com moradores reais só começa depois que as dependências de lançamento estiverem resolvidas.

## 16. Entregas

| Entrega | Resultado demonstrável |
|---|---|
| E1 · Estrutura e navegação | HTML, CSS e JavaScript das telas, com entrada do formulário, mapa e área dos agentes |
| E2 · Dados fictícios compartilhados | Formulário, mapa e Ocorrências usando o mesmo contrato de dados |
| E3 · Envio integrado | Confirmação de e-mail, fotos, gravação, protocolo e recuperação de falhas |
| E4 · Público e agente | Área aproximada, autorização, atendimento, ocultação e correção |
| E5 · Aceite da V1 | Evidências de AC-01 a AC-14 e preparação da operação |
| E6 · Evolução | Dashboard, gráficos e melhorias priorizadas pelo uso |

As primeiras atividades de HTML já combinadas são Início, Registrar foco, Jogo e Guia Aedes. Jogo e Guia entram nessa ordem por motivo didático e não bloqueiam o fluxo operacional. Datas e responsáveis por tarefa são acompanhados fora deste PRD.

## 17. Riscos assumidos

| Risco | Efeito | Tratamento na V1 |
|---|---|---|
| Publicação automática | Foto ou descrição pode identificar alguém por acidente | Aviso no formulário, ocultação e conferência diária; a revisão prévia foi adiada de propósito |
| CPF obrigatório | Aumenta o volume de dados pessoais guardados sem comprovar identidade | Mantido por decisão de produto (D07); finalidade e proteção definidas em DEP-06 |
| Adesão dos agentes | Contas ativas não comprovam disponibilidade nem vínculo oficial | Sem promessa de prazo; vínculo formalizado em DEP-04 |
| Representação do território | Imagem, texto e contexto podem revelar o local apesar da aproximação | Método testado em áreas pouco povoadas (DEP-02) |
| Abuso e volume | Lançamento aberto pode receber envios indevidos ou acima do esperado | Limites no serviço (RNF-07, RNF-08) |
| Serviços externos de mapa e e-mail | Falhas fora do controle da equipe | Mensagens de erro e recuperação sem confirmação falsa |
| Ausência de agentes | Fila cresce e a retirada de conteúdo demora | Recebimento mantido (D23); responsável pela conferência e pelo e-mail em DEP-05 |
| Retenção e custo | Guardar fotos por tempo indefinido pressiona armazenamento e orçamento | Estimativa de volume e teto de custo em DEP-07 |

Esses riscos fazem parte do produto escolhido. Mudanças como moderação prévia, retirada do CPF ou restrição a convidados exigem nova decisão registrada neste PRD.

## 18. Dependências de implementação e lançamento

| ID | O que precisa ser resolvido | Prazo | Responsável |
|---|---|---|---|
| DEP-01 | Catálogo de categorias e localidades e limite territorial de Itambé, com fonte e versão | Antes da validação de território | Produto, agentes e desenvolvimento |
| DEP-02 | Forma e precisão da área aproximada, incluindo divisas e áreas pouco povoadas | Antes de publicar pontos reais | Produto e desenvolvimento |
| DEP-03 | Serviço de e-mail, expiração dos códigos, limites e tratamento de arquivos | Antes da integração real do envio | Desenvolvimento |
| DEP-04 | Nome da instituição parceira, formato do vínculo e confirmação do uso pelos agentes | Antes do lançamento | Administrador e instituição parceira |
| DEP-05 | Responsável e substituto pela conferência diária; criação e acompanhamento do e-mail de contato | Antes de publicar conteúdo real | Administrador e operação |
| DEP-06 | Adequação à LGPD (Lei nº 13.709/2018): finalidade do CPF, base legal, controlador e encarregado, aviso de privacidade, atendimento aos direitos do titular e política de retenção por tipo de dado | Antes de coletar dados reais | Administrador, instituição parceira e operação |
| DEP-07 | Provedor de mapa, estimativa de volume e custo, teto financeiro e comportamento ao atingir cotas | Antes do ambiente público | Administrador, instituição parceira e desenvolvimento |
| DEP-08 | Mecanismo de correção pelo administrador e pelo cidadão, verificação do vínculo, trilha de alterações e recuperação segura de acesso | Antes da integração da correção | Administrador e desenvolvimento |
| DEP-09 | Período e critérios de avaliação do piloto | Antes da avaliação de resultados | Produto e agentes participantes |
| DEP-10 | A quem pertencem os dados no envio em nome de terceiros, no envio assistido e no envio por menores de idade | Antes de implementar essa modalidade | Administrador, instituição parceira e operação |
| DEP-11 | Encerramento de denúncias falsas ou improcedentes que não exigem visita | Antes de tratar esses casos no piloto | Administrador e agentes |
| DEP-12 | Obrigatoriedade do endereço digitado | Antes de fechar o formulário (E3) | Produto |

DEP-10, DEP-11 e DEP-12 são decisões de produto em aberto. As demais são preparação técnica ou operacional. Nenhuma delas impede o trabalho com dados fictícios.

## 19. Definição de pronto

**Documento:** decisões registradas, requisitos com critério de aceite, dados e permissões definidos, rastreabilidade completa e dependências identificadas. A versão 2.0 atende a esse critério, com DEP-10, DEP-11 e DEP-12 em aberto.

**V1 técnica:** cenários AC-01 a AC-14 demonstrados na versão candidata. Dashboard e recursos complementares não entram nesse aceite.

**Abertura para moradores:** dependências de lançamento resolvidas, contas de agentes funcionando, ocultação testada, custos acompanhados e comunicação clara sobre o papel do serviço. Esse marco não substitui parecer jurídico, aprovação municipal ou avaliação de impacto sanitário.

## 20. Referências e precedência

1. Decisões de produto registradas pelo responsável em 04 e 05/11/2026, incluindo publicação automática, dados privados, CPF obrigatório, dashboard posterior e prazo de correção pelo cidadão.
2. Notas internas de contexto e o roteiro de aprendizagem do projeto, mantidos fora do repositório.
3. [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), com as telas finais, e [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65), para o planejamento das tarefas.
4. PRD do Repecol (`docs/PRD_REPELCONTROL.md`, em repositório separado), usado como modelo de estrutura. Contas de cidadão, chat, produção, comércio, o território de Mogeiro, prioridade automática e SLA não foram herdados.

Em conflito com telas antigas ou recomendações anteriores, valem as decisões deste PRD. Mudanças futuras registram o motivo no histórico abaixo.

## 21. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 04/11/2026 | Primeiro rascunho do PRD e do Start Técnico (PR #2) |
| 0.2 | 04/11/2026 | Estrutura adaptada do Repecol e decisões da entrevista de produto |
| 1.0 | 05/11/2026 | Critérios por requisito, campos e acessos, etapas de atendimento e publicação, rastreabilidade e dependências de lançamento |
| 1.1 | 05/11/2026 | Visita obrigatória para Atendida, observações durante a análise, sem reabertura, republicação pelo agente, responsabilidades e preferências de retenção e custo |
| 1.2 | 05/11/2026 | Correção liberada ao administrador e ao cidadão responsável pelo envio; responsabilidades descritas por papel |
| 2.0 | 05/11/2026 | Aprovado como base de construção. Texto revisado em tom corporativo; glossário; aviso epidemiológico restaurado no resumo; D26 limita a correção do cidadão à etapa Recebida; especificações propostas incorporadas aos requisitos; papel "operador" substituído por agente autorizado; permissões separadas por perfil; riscos em tabela; LGPD explícita em DEP-06; DEP-12 para o endereço digitado; estado do repositório atualizado para `f403ef5`; telas do Figma registradas como concluídas |
