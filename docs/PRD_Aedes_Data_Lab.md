# PRD — Aedes Data Lab

| Documento | Informação |
|---|---|
| Versão | 1.2 — 05/11/2026 |
| Estado | Consolidado para revisão da equipe no PR; não representa software entregue ou aprovação institucional |
| Território | Itambé, Pernambuco |
| Público | Produto, design, desenvolvimento, testes e agentes participantes |
| Complemento | [Start Técnico](./START_TECNICO_Aedes_Data_Lab.md) |

## 1. Resumo executivo

O Aedes Data Lab é uma plataforma web para moradores relatarem possíveis focos do mosquito da dengue em Itambé/PE. Cada denúncia reúne localização, evidências e identificação privada do denunciante. Após confirmação do recebimento, o sistema disponibiliza a ocorrência aos agentes e publica automaticamente a versão pública no mapa, com localização aproximada.

Agentes autorizados usam login individual para consultar ocorrências, iniciar análise explicitamente, registrar observações, concluir após visita ao local e ocultar ou republicar conteúdo. O administrador gerencia os acessos. O administrador e o cidadão responsável pelo envio podem corrigir os campos da denúncia; o cidadão pode corrigir somente a própria denúncia, após confirmação de seu vínculo com o envio. O produto ajuda a equipe a observar onde há relatos.

A primeira entrega exige o caminho completo **envio → persistência → mapa público → Ocorrências dos agentes → atualização do atendimento**. Dashboard e gráficos são da fase seguinte. O lançamento pretendido recebe relatos de moradores reais, sem lista de convidados; mesmo na ausência de agente disponível por vários dias, o recebimento continua. O administrador aprova a abertura e assume a manutenção, com responsabilidade pelo serviço compartilhada com uma instituição ainda não identificada neste documento. O compromisso dos agentes e a forma do vínculo institucional ainda precisam de confirmação documentada.

## 2. Como usar este PRD

O PRD define comportamento e aceite do produto; o Start Técnico organiza sua implementação. O PRD do Repecol serviu de referência de estrutura e profundidade, sem transferir automaticamente seus requisitos.

Há três tipos de informação:

- **Decisão do usuário:** diretriz confirmada na conversa e consolidada na seção 4.
- **Especificação proposta:** detalhamento feito nesta versão para tornar as decisões implementáveis, sem atribuí-lo ao usuário. Identificado nas seções correspondentes.
- **Dependência de implantação:** configuração, responsável ou política que precisa ser resolvida antes de determinada entrega; registrada na seção 17.

Uma dependência de lançamento não torna o documento uma aplicação pronta nem exige interromper o desenvolvimento com dados fictícios. Alterações de escopo devem atualizar este PRD e seus critérios de aceite no mesmo PR.

## 3. Contexto, problema e visão

O problema de produto é reunir relatos com informação suficiente para consulta pelos agentes e apresentar uma visão pública do que foi relatado. Não houve nesta documentação uma pesquisa que comprove a rotina atual da prefeitura ou que o Aedes já tenha adesão institucional.

A experiência começa no celular e deve funcionar também em computador. As quatro integrantes desenvolvem HTML, CSS e JavaScript de suas telas; banco e integrações serão aprendidos em conjunto com a coordenação do projeto. A sequência de aprendizagem não altera os critérios de funcionamento do produto.

**Estado do repositório:** na base `main` inspecionada em 05/11/2026, commit `70bf8c2`, há estrutura inicial de páginas, CSS compartilhado e scripts orientadores. O fluxo real de envio e operação não está implementado nessa base. Essa constatação não é auditoria de todos os trabalhos das branches das integrantes nem de um ambiente publicado. O Figma e a prévia externa do dashboard são referências de design, não prova de implementação no site.

## 4. Decisões consolidadas

| ID | Decisão válida para esta versão |
|---|---|
| D01 | A V1 inclui denúncia persistida, mapa público, lista/detalhe de Ocorrências e atualização pelos agentes. |
| D02 | O lançamento pretendido é aberto a moradores reais. Grupo fechado de convidados não é requisito. |
| D03 | Foto e descrição são publicadas automaticamente, sem aprovação prévia de agente na V1. |
| D04 | Agente ou operador autorizado pode ocultar publicação com motivo, preservando o registro interno. Haverá responsável e rotina diária de conferência antes da abertura pública. |
| D05 | Botão público de sinalização de conteúdo e análise automática de fotos ficam fora da V1. |
| D06 | Nome, CPF e e-mail confirmado são obrigatórios; telefone é opcional. Nenhum desses campos aparece no mapa, nem parcialmente. |
| D07 | CPF é mantido por decisão do usuário. A intenção declarada foi verificar a existência da pessoa, mas digitar/validar CPF não comprova titularidade; o produto não promete identidade verificada. |
| D08 | O cidadão confirma acesso ao e-mail por denúncia, sem conta persistente ou histórico pessoal na V1. |
| D09 | O público vê localização aproximada; agentes autorizados veem o ponto exato. |
| D10 | O território de envio é Itambé/PE. Navegar no mapa fora do município não significa poder enviar fora dele. |
| D11 | Cada agente tem login individual autorizado pelo administrador. Todos os agentes autorizados podem consultar todas as ocorrências de Itambé e os dados privados, inclusive CPF completo; visitantes não podem. |
| D12 | Etapas: Recebida → Em análise → Atendida. Abrir detalhe não muda a etapa; iniciar análise exige ação explícita. |
| D13 | Atendida exige que o agente tenha ido ao local e analisado a situação, registrando data, ação realizada e observações. Responder significa atualizar a ocorrência, sem mensagem individual ao cidadão. |
| D14 | Se a persistência funcionar e a publicação falhar, o cidadão recebe protocolo e informação de publicação pendente. |
| D15 | Dashboard e gráficos ficam após a primeira entrega. Contagens representam relatos e não classificam automaticamente risco. |
| D16 | Repelentes é conteúdo educativo. Chat, comércio, pedidos e produção não integram a V1. |
| D17 | Quando não consegue resolver, o agente mantém Em análise e registra observações internas. |
| D18 | Ocorrências não reabrem. Conclusão por engano ou reaparecimento do problema exige nova ocorrência. |
| D19 | Agente pode republicar ocorrência ocultada após revisão/correção. Ocultação não apaga o registro. |
| D20 | O administrador e o cidadão responsável pelo envio podem corrigir os campos da denúncia. O cidadão só altera a própria denúncia, com vínculo verificado. Agentes continuam autorizados às ações operacionais próprias. |
| D21 | Envio em nome de outra pessoa é permitido em princípio; quais pessoas os dados de identificação representam ainda precisa ser definido. |
| D22 | O administrador autoriza, revoga e recupera contas de agentes, aprova a abertura pública e assume a manutenção. Responsabilidade pelo serviço é compartilhada com a instituição a identificar. |
| D23 | Ausência de agentes disponíveis por vários dias não suspende o recebimento. Será criado e-mail para reclamações, correções e retirada; endereço e responsável por acompanhá-lo ainda não definidos. |
| D24 | Preferência do usuário: preservar as informações por prazo indefinido, sem perda de histórico. A política por tipo de dado, inclusive dados pessoais e visibilidade pública, ainda será formalizada. |
| D25 | Prioridade de custo: aplicação de baixo custo, idealmente sem custo. Não há teto financeiro numérico ou garantia de gratuidade definidos. |

## 5. Objetivos e limite da primeira entrega

O núcleo deve permitir que uma denúncia recebida chegue aos agentes e seja consultada publicamente sem divulgar os campos privados. Cada resultado abaixo precisa de evidência:

| Resultado | Evidência de entrega |
|---|---|
| Recebimento confiável | Protocolo recuperável na confirmação e registro persistente após recarga |
| Visibilidade pública | Mesmo relato no mapa com área aproximada e campos permitidos |
| Operação do agente | Conta autorizada acessa detalhe, inicia análise e registra atendimento |
| Proteção de acesso | Visitante não lê dados privados nem executa ações técnicas |
| Retirada de publicação | Ocultação justificada retira conteúdo público e preserva histórico interno |
| Recuperação de falhas | GPS negado, falha de upload, resposta perdida e reenvio têm comportamento verificável |

Não há prazo de vistoria, quantidade de usuários, redução de dengue ou volume de denúncias prometidos. Metas de adoção precisam ser definidas com a operação.

### 5.1 Matriz de escopo

| Capacidade | Primeira entrega | Evolução |
|---|---|---|
| Entrada pública para registrar/consultar | Necessária ao fluxo | Refinamento da página Início |
| Confirmação de e-mail por denúncia | Incluída | Sem conta permanente prevista na V1 |
| Formulário, fotos, localização, protocolo | Incluídos | Melhorias a partir do uso |
| Mapa público e filtros | Incluídos | Mais formas de leitura territorial |
| Login, lista, detalhe e ações do agente | Incluídos | Outras ferramentas operacionais |
| Ponto exato no detalhe autorizado | Incluído | Mapa técnico dedicado pode ser desenvolvido separadamente |
| Dashboard, gráficos e comparação | Não exigidos no aceite V1 | Fase seguinte |
| Guia Aedes, Repelentes, Quem Somos e entrada do jogo | Complementares; podem ser desenvolvidos em paralelo | Conteúdo conforme fontes e design |
| Agenda de visitas, Meu trabalho e rotas | Não exigidos no aceite mínimo | Dependem de decisão própria; não são compromissos deste roadmap |
| Chat, resposta individual, push e central de notificações | Fora da V1 | Sem compromisso de implementação |
| Conta/histórico pessoal do cidadão | Fora da V1 | Sem compromisso de implementação |
| Comércio e produção de repelente | Fora do produto aqui especificado | Não importar do Repecol |

O e-mail de confirmação necessário ao envio é parte da V1; a exclusão de notificações não o elimina. A ausência de um dashboard não impede o registro dos dados necessários às análises futuras.

## 6. Perfis e permissões

| Operação | Público/morador | Agente autorizado | Administração de acesso |
|---|---|---|---|
| Ler mapa publicado | Sim | Sim | Sim |
| Enviar denúncia | Após confirmação do e-mail e validações | Pelo fluxo público, se necessário | Pelo fluxo público, se necessário |
| Ler campos privados para consulta/correção | Visitante: não. Cidadão com vínculo verificado: somente os campos enviados na própria denúncia | Sim, para a operação | Sim, no exercício da correção autorizada |
| Iniciar análise e concluir | Não | Sim | Somente se também tiver autorização operacional |
| Ocultar publicação com motivo | Não | Sim | Somente se também tiver autorização operacional |
| Republicar após revisão | Não | Sim | Somente se também tiver autorização operacional |
| Registrar observação e atendimento | Não | Sim | Somente se também tiver autorização operacional |
| Corrigir campos enviados da denúncia | Cidadão com vínculo verificado: somente a própria denúncia | Não por possuir apenas papel de agente | Sim |
| Conceder/revogar acesso e apoiar recuperação de conta | Não | Não por possuir apenas papel de agente | Administrador |
| Apagar histórico pelo navegador | Não | Não | Não previsto na interface V1 |

O administrador gerencia os acessos e pode corrigir os campos enviados. O cidadão responsável pelo envio também pode corrigi-los na própria denúncia, após verificação do vínculo. Essa permissão é distinta das ações de análise, observação, atendimento e publicação dos agentes. Todos os agentes autorizados consultam ocorrências de todo o município, sem restrição por equipe ou subterritório. Visitantes não recebem dados privados. A correção pelo cidadão não exige conta permanente nem cria acesso a histórico interno, notas dos agentes ou denúncias de terceiros.

## 7. Informações da denúncia

| Informação | Obrigatória | Destino e regra |
|---|---|---|
| Nome | Sim | Privado; não publicar iniciais ou apelido derivado |
| CPF | Sim | Privado; dado declarado, sem prova de titularidade |
| E-mail | Sim, confirmado por denúncia | Privado; a confirmação não valida CPF ou identidade civil |
| Telefone | Não | Privado; não implica envio de WhatsApp ou SMS |
| Ponto do foco | Sim | Exato na área técnica; representação aproximada no público |
| Bairro/localidade | Sim | Público; catálogo e relação com território serão configurados |
| Categoria | Sim | Pública; catálogo versionado para não quebrar registros antigos |
| Descrição | Sim | Pública automaticamente após recebimento |
| Fotos | De uma a três | Públicas após processamento técnico; sem aprovação humana prévia |
| Endereço digitado | Preenchimento previsto; obrigatoriedade ainda não fechada | Privado na proposta de detalhamento; não substitui o ponto exato marcado |
| Referência do local | Opcional, conforme direção anterior | Privada na proposta de detalhamento, para não contrariar a aproximação pública |
| Protocolo, data e etapa | Gerados pelo serviço | A data e a etapa são públicas; protocolo é comprovante de recebimento |
| Ação realizada, observações e autor da ação | Na conclusão pelo agente | Internos; não publicar automaticamente as observações |

A quantidade de uma a três fotos vem da direção anterior do Aedes. O usuário quer digitação de endereço e marcação precisa do foco; o ponto marcado no mapa é a referência espacial exata. Na proposta de detalhamento, endereço/referência ficam privados para preservar a decisão de localização pública aproximada. Categorias, formatos/tamanhos de arquivo e precisão da área pública são configurações a fechar na implementação, sem copiar silenciosamente os valores do Repecol.

O envio em nome de terceiros foi aceito em princípio. Não assumir que nome, CPF e e-mail pertencem todos ao titular representado ou todos a quem preenche: essa definição ainda está pendente, inclusive para envio assistido e menores. A implementação dessa modalidade depende de fechar essa regra.

**Especificação proposta:** conferir formato/dígitos do CPF para detectar erro de digitação, sem consulta externa ou validação de titularidade. O mesmo CPF/e-mail pode estar associado a relatos distintos; o sistema não impõe limite de uma denúncia por pessoa. Controle de abuso é diferente de bloquear relatos legítimos.

O aviso de publicação deve citar foto e descrição e orientar a evitar rostos, placas e dados pessoais. Como não há revisão prévia ou detecção automática de conteúdo na V1, o sistema não pode garantir que uma foto ou texto nunca identifique alguém. A separação de campos privados protege os dados estruturados; a ocultação trata conteúdo indevido encontrado depois.

## 8. Requisitos funcionais e aceite por função

### RF-AUT-01 — Confirmar e-mail por denúncia

O envio final depende de prova de acesso ao e-mail vinculada à tentativa de denúncia. Permitir corrigir endereço e solicitar nova confirmação em caso de falha ou expiração. Não transformar essa etapa em cadastro com senha e histórico pessoal.

**Aceite:** e-mail não confirmado ou confirmação inválida não finaliza relato; confirmação de uma tentativa não autoriza outra; resposta perdida após envio não exige nova denúncia.

**Especificação proposta:** confirmar no início, antes do preenchimento longo. A ordem exata dos passos é escolha de implementação; a obrigação confirmada pelo usuário é verificar antes de aceitar o envio.

### RF-AUT-02 — Proteger a sessão do agente

Login individual, autorização atribuída fora do cadastro público e saída de sessão. A revogação deve impedir novas leituras e operações protegidas; limpar informações privadas da interface ao sair.

**Aceite:** visitante e conta sem papel não leem detalhe privado nem mudam etapa; conta revogada não continua operando; exibir um link de página não concede permissão.

### RF-DEN-01 — Preencher e revisar

Apresentar localização, evidências/informações, identificação privada e revisão de forma compreensível. Permitir corrigir campos e remover/trocar fotos antes do envio. Não perder valores ao voltar uma etapa.

**Aceite:** não finalizar com campo obrigatório ausente; erro aponta o campo; revisão distingue informação pública de privada. Preservação entre etapas é obrigatória. Recuperação após fechar navegador não é promessa da V1.

### RF-DEN-02 — Escolher o local e validar território

Permitir selecionar e corrigir ponto manualmente. GPS é opcional e depende de ação do usuário; posição do dispositivo não é assumida como posição do foco. Validar a área atendida no serviço.

**Aceite:** GPS negado não impede seleção manual; ponto fora da área não é aceito; alterar bairro escrito não contorna a validação do ponto; não coletar localização contínua.

### RF-DEN-03 — Receber fotos

Aceitar de uma a três fotos com prévia, remoção e mensagens de upload. Verificar arquivos no serviço; gerar imagem destinada ao público sem metadados pessoais como coordenadas da câmera.

**Aceite:** arquivo inválido ou acima do limite configurado é recusado com explicação; foto faltante não gera sucesso; falha de upload mantém o preenchimento para nova tentativa. Não chamar processamento técnico de revisão do conteúdo da foto.

### RF-DEN-04 — Persistir e confirmar

Finalizar relato completo e gerar protocolo apenas depois de confirmar persistência. Bloquear acionamentos repetidos na interface e tratar a repetição também no serviço.

**Aceite:** duas solicitações da mesma tentativa produzem um único relato/protocolo; queda após gravação permite recuperar o resultado; um novo relato intencional tem nova tentativa.

### RF-DEN-05 — Mostrar o estado da publicação

Recebimento e publicação são resultados distintos. Registro completo recebido fica disponível aos agentes mesmo se o mapa estiver pendente.

**Aceite:** serviço indisponível antes de gravar não gera confirmação; registro gravado com publicação falha mostra protocolo e publicação pendente; recuperação usa o mesmo registro.

### RF-MAP-01 — Consultar relatos públicos

Mapa sem login, com posição aproximada, bairro/localidade, categoria, data de recebimento, etapa atual, foto e descrição. Relatos atendidos permanecem visíveis salvo ocultação.

**Aceite:** visitante encontra o relato publicado e seu detalhe; não recebe campos privados, referência precisa ou ponto exato em resposta de rede, URL de mídia ou metadados. A limitação de conteúdo incidental em texto/foto permanece conforme seção 7.

### RF-MAP-02 — Filtrar e lidar com falhas

Filtrar por localidade, período de recebimento e etapa. Preservar os filtros ao consultar um relato e retornar ao mapa. Distinguir “sem relatos”, “sem resultado para estes filtros” e erro de carregamento.

**Aceite:** os marcadores correspondem ao mesmo recorte indicado nos filtros; erro não aparece como contagem zero; falha da camada visual oferece nova tentativa sem apagar o formulário aberto. Agrupamento de pontos, busca por rua e satélite não são dependências do aceite V1.

### RF-AGE-01 — Consultar fila e detalhe

Listar protocolos, datas, localidades, categorias e etapas. Detalhe inclui fotos, descrição, ponto exato, identificação privada e histórico. Filtros: protocolo, localidade, período e etapa; ordenação por mais antigas/mais recentes.

**Aceite:** filtro de protocolo leva à ocorrência correta; detalhe mostra a mesma ocorrência; abrir e fechar não altera sua etapa; lista vazia ou falha têm mensagem própria. A consulta espacial do agente usa pontos exatos para reconhecer relatos no mesmo local. A organização dessa consulta em uma tela dedicada ou componente da área de Ocorrências será definida no desenho.

Relatos distintos do mesmo local permanecem ocorrências separadas. O agente pode identificar a coincidência no mapa e iniciar análise de cada uma; não há fusão automática ou descarte por proximidade. A existência de vários relatos não comprova vários focos distintos. Ação em lote não é requisito confirmado.

### RF-AGE-02 — Iniciar análise

Disponibilizar ação explícita para passar de Recebida a Em análise, registrando agente e momento.

**Aceite:** leitura não muda etapa; clique repetido não duplica evento; o agente que iniciou fica registrado como autor, sem criar atribuição exclusiva ou impedir outros agentes autorizados.

### RF-AGE-03 — Registrar atendimento

Somente agente autorizado conclui **depois de comparecer ao local e analisar a situação**, preenchendo data do atendimento, ação realizada e observações. “Atendida” não significa automaticamente foco confirmado ou eliminado. Se não conseguiu resolver, mantém Em análise e registra o impedimento em observações.

**Aceite:** conclusão exige registro da visita/análise local e os campos obrigatórios; gravação confirma etapa e histórico juntos; mapa exibe Atendida quando a ocorrência estiver pública. Não publicar o texto interno da ação como descrição pública. Registro da visita é declaração do agente; o PRD não exige rastreamento GPS ou foto pós-visita como prova automática.

### RF-AGE-04 — Ocultar publicação

Agente ou operador com permissão retira conteúdo público com justificativa, mantendo o registro e histórico privados.

**Especificação proposta:** ocultar a publicação inteira, inclusive suas mídias, permanece a operação mínima; ocultação seletiva por foto não foi especificada. A republicação agora é permitida por decisão do usuário, conforme RF-AGE-06.

**Aceite:** após confirmação da retirada, nova consulta pública ao relato e às mídias não disponibiliza conteúdo; o agente ainda vê registro e motivo. Retentativas antigas de publicação não podem republicar um relato ocultado. Cópias já baixadas por terceiros não são recuperáveis.

### RF-AGE-05 — Registrar observações durante a análise

Agente autorizado acrescenta observações internas sobre visita, impedimento, situação encontrada ou providência ainda necessária. Se não consegue resolver, mantém a ocorrência Em análise. Observações não alteram o texto enviado pelo morador.

**Aceite:** cada observação mantém autor e data; é visível aos agentes e ausente da consulta pública; salvá-la não conclui a ocorrência nem sobrescreve notas anteriores.

### RF-AGE-06 — Republicar após revisão

Agente autorizado pode republicar uma ocorrência ocultada depois de revisar o conteúdo e, quando necessária, obter correção pelo administrador ou pelo cidadão responsável pelo envio. Registrar autor e data da decisão. Republicar afeta apenas a visibilidade, sem reabrir ou mudar a etapa de atendimento.

**Aceite:** a publicação retorna somente após ação explícita autorizada; usa a versão atual do conteúdo e mídias; uma tarefa antiga de publicação continua impedida de desfazer ocultação; nova ocultação posterior prevalece sobre tarefas antigas de republicação. O histórico mantém ambas as decisões.

### RF-COR-01 — Corrigir campos enviados

O administrador, autenticado com a permissão correspondente, e o cidadão responsável pelo envio, com vínculo verificado com a denúncia, podem corrigir local, bairro, categoria, descrição e dados de identificação/contato enviados. O cidadão só corrige a própria denúncia. Correção não se confunde com observação do agente e não permite reabrir uma ocorrência concluída.

**Especificação proposta:** verificar o vínculo do cidadão pelo e-mail confirmado associado ao envio, com autorização de edição restrita àquela denúncia. Protocolo, CPF ou conhecimento do endereço de e-mail, isoladamente, não concedem acesso. O mecanismo de recuperação/edição será definido no Start Técnico sem exigir conta permanente. Troca do e-mail de contato deve preservar a vinculação de autoria e confirmar o novo endereço antes de usá-lo para futuras autorizações.

**Especificação proposta:** preservar o valor original e registrar alteração, motivo, autor e instante em histórico privado. Se o registro estiver publicado, atualizar sua projeção sem expor dados privados; se estiver oculto, manter oculto até republicação explícita. Alterar e-mail não transfere a confirmação anterior ao novo endereço.

**Aceite:** administrador consegue corrigir; cidadão com vínculo verificado consegue corrigir apenas a própria denúncia. Visitante, cidadão de outra denúncia e agente sem autorização de administrador ou de autor do envio são impedidos de alterar os campos, inclusive ao chamar o serviço diretamente. Correção não apaga a informação original, não redefine protocolo e não muda sozinha a etapa/visibilidade. O histórico interno de correção não é enviado ao público nem concedido ao cidadão por essa permissão.

## 9. Etapas de atendimento e visibilidade

Etapa de atendimento e visibilidade pública são campos independentes. Ocultar não significa atender, rejeitar ou excluir.

### 9.1 Transições de atendimento

| Origem | Ação | Destino | Exigência |
|---|---|---|---|
| Novo relato completo | Confirmar recebimento | Recebida | Protocolo e data gerados pelo serviço |
| Recebida | Iniciar análise | Em análise | Agente autorizado, ação explícita, agente/data registrados |
| Em análise | Concluir após visita e análise local | Atendida | Visita registrada, data, ação realizada e observações |
| Em análise | Registrar impedimento/observação | Em análise | Autor e data; sem confirmação falsa de resolução |
| Qualquer etapa | Abrir/consultar | Mesma etapa | Sem evento de mudança de etapa |
| Qualquer etapa | Ocultar publicação | Mesma etapa | Motivo e autorização operacional |
| Qualquer etapa | Republicar após revisão | Mesma etapa | Decisão explícita de agente autorizado |

**Decisão do usuário:** ocorrência concluída não é reaberta. Em conclusão por engano ou reaparecimento do problema, registrar nova ocorrência. Administrador e cidadão responsável pelo envio podem corrigir os campos permitidos com histórico, mas essa permissão não autoriza retorno de Atendida para Em análise. Não há exclusão de histórico pelo navegador.

Em ações concorrentes, verificar a versão/etapa atual antes de salvar. Uma tela antiga não pode sobrescrever silenciosamente ação de outro agente.

### 9.2 Estados de publicação

| Estado | Público | Agente |
|---|---|---|
| Publicação pendente | Não consta como publicada | Registro recebido visível; etapa de atendimento preservada |
| Publicada | Campos permitidos e mídia pública | Registro completo |
| Oculta | Registro e mídias deixam de ser servidos publicamente | Registro, etapa e motivo preservados |

Falha temporária de publicação pode ser recuperada automaticamente. Ocultação é uma decisão operacional e prevalece sobre qualquer tarefa antiga. A transição Oculta → Publicada exige nova decisão explícita do agente após revisão; tarefas anteriores não substituem essa decisão. A implementação deve distinguir a decisão mais recente das retentativas de decisões anteriores.

### 9.3 Denúncias improcedentes e conteúdo inadequado

Denúncia falsa, improcedente ou fora do assunto será analisada pelo agente, que pode registrar observações e ocultar a publicação. O usuário cogitou detecção automática de imagens se o problema se tornar frequente; isso é uma ideia futura, sem implementação ou compromisso de prazo.

O desfecho administrativo de uma denúncia inválida que não exige visita ainda está pendente: não foi aprovado status adicional, motivo padronizado de encerramento ou exceção à visita exigida para Atendida. Não classificar silenciosamente esses relatos como atendimentos realizados.

## 10. Jornadas e mensagens essenciais

**Morador:** acessa Registrar foco → confirma e-mail por denúncia → marca local → preenche informações e fotos → informa nome/CPF/telefone opcional → revisa campos públicos/privados → envia → recebe protocolo e estado da publicação.

**Visitante:** abre mapa → filtra → consulta descrição/fotos e etapa de uma denúncia publicada. Não vê identidade ou contato, nem precisa de conta.

**Agente:** entra com conta autorizada → filtra Ocorrências → consulta detalhe/mapa → inicia análise → visita e analisa o local → registra atendimento e conclui, ou mantém Em análise com observações se não resolveu. Pode ocultar publicação inadequada em qualquer etapa e republicar após revisão.

**Correção e republicação:** administrador ou cidadão responsável pelo envio acessa a correção com autorização verificada → corrige os campos, com histórico interno preservado → agente revisa e republica se a ocorrência estiver oculta. Corrigir conteúdo não reabre atendimento concluído nem republica automaticamente conteúdo ocultado.

Mensagens devem distinguir: “Não foi possível enviar”, “Denúncia recebida; publicação pendente” e “Denúncia recebida e publicada”. Não informar que um agente foi pessoalmente avisado, que vistoriará o local ou que existe prazo garantido. O protocolo comprova recebimento; consulta privada por protocolo e envio de resposta individual não são requisitos do núcleo definido.

## 11. Dados e acesso

| Grupo de dados | Consulta pública | Consulta operacional |
|---|---|---|
| Categoria, bairro, data de recebimento e etapa | Sim, quando publicada | Sim |
| Descrição e fotos públicas | Sim, sem revisão humana prévia | Sim |
| Representação aproximada | Sim | Sim, se útil |
| Coordenada exata e referência do local | Não | Sim |
| Nome, CPF, e-mail e telefone | Não, nem mascarados | Agentes autorizados conforme finalidade |
| Histórico, agente autor, ação e observações | Não | Sim |
| Motivo de ocultação | Não | Sim |

O cidadão com vínculo verificado pode acessar os campos enviados na própria denúncia para corrigi-los. Isso não os torna públicos e não libera histórico operacional, observações internas ou dados de outros denunciantes.

A separação deve existir nos dados devolvidos pelo serviço, não apenas na interface. Os nomes de coleções e contratos ficam no Start Técnico. E-mail confirmado não autentica CPF. Sem integração de verificação de identidade escolhida, a finalidade de comprovar titularidade continua não atendida pela V1.

Não introduzir perfil público de denunciante, rastreamento de localização atual ou armazenamento de credenciais administrativas no cliente. O usuário quer preservar informações por prazo indefinido, idealmente para sempre. Registrar essa preferência não equivale a uma política concluída para todos os campos, mídias e dados pessoais: ainda é necessário especificar retenção por tipo de dado, correção, retirada, exclusão aplicável e histórico de alterações. Não implementar expiração automática arbitrária nem prometer armazenamento eterno gratuito.

## 12. Requisitos não funcionais

As condições de verificação abaixo são especificação proposta para a implementação, não testes já realizados.

| ID | Requisito | Verificação esperada |
|---|---|---|
| RNF-01 | Usabilidade em celular e computador | Fluxo sem perda de ações/conteúdo e sem rolagem horizontal indevida em 320, 390, 768 e 1440 px |
| RNF-02 | Acessibilidade do núcleo | Rótulos, erro associado ao campo, foco visível, uso por teclado e etapa não indicada só por cor |
| RNF-03 | Autorização no serviço | Tentativas sem papel e com conta revogada são negadas mesmo fora da interface |
| RNF-04 | Integridade do envio | Repetição da tentativa, falha parcial de foto e resposta perdida não criam sucesso falso/duplicação |
| RNF-05 | Publicação controlada | Testes verificam ausência de dados estruturados privados, metadados e ponto exato na API pública |
| RNF-06 | Controle de publicação | Consulta e mídia pública deixam de servir relato ocultado; tarefas antigas não desfazem decisão posterior; republicação exige ação explícita autorizada |
| RNF-07 | Uso limitado de recursos | Fotos/consultas têm limites configurados, lista técnica é paginada e assinaturas são encerradas ao sair |
| RNF-08 | Proteção contra abuso | Confirmador de e-mail e envio possuem limites de repetição no serviço; não basta bloquear botão |
| RNF-09 | Histórico confiável | Autor e instante vêm da sessão/serviço; mudanças concorrentes não apagam evidência |
| RNF-10 | Dados pessoais em logs | Logs e métricas não registram CPF, contato, texto livre ou foto sem necessidade operacional explícita |

Metas numéricas de latência, volume e disponibilidade não foram acordadas. Escolher cotas e condições de teste antes de fazer promessas de escala. A precisão/forma do mapa público deve ser conferida também em áreas pouco densas; aproximar não equivale a garantir anonimato.

## 13. Indicadores e fase seguinte

O lançamento pode coletar medidas operacionais para avaliar falhas e adoção sem construir um dashboard.

| Medida | Definição |
|---|---|
| Denúncias recebidas | Registros finalizados no intervalo de recebimento |
| Distribuição por etapa | Etapa atual dos mesmos registros do intervalo |
| Tempo até primeira análise | Diferença entre recebimento e primeiro evento de início; não confundir com tempo de vistoria |
| Falhas e repetição | Tentativas que falharam e recuperações, sem contar a mesma tentativa como novo relato |
| Publicações ocultadas | Retiradas com justificativa, mantidas no histórico |
| Relatos por localidade | Quantidade de relatos; não casos confirmados nem prioridades automáticas |

Dashboard e gráficos futuros usam a mesma base. As decisões anteriores sobre períodos e comparação devem ser retomadas na especificação dessa fase; não condicionam o aceite V1. Não criar prioridade automática, mapa de casos confirmados, metas epidemiológicas ou promessas de redução de doença com essas contagens.

## 14. Plano de validação e rastreabilidade

| Cenário | Critério verificável | Requisitos |
|---|---|---|
| AC-01 · Envio válido | Confirma e-mail, envia campos/fotos/ponto válidos, recebe protocolo e encontra registro persistido | RF-AUT-01, RF-DEN-01 a RF-DEN-04 |
| AC-02 · Entrada inválida | E-mail sem confirmação, campos ausentes, foto inválida e ponto fora do território não finalizam | RF-AUT-01, RF-DEN-01 a RF-DEN-03 |
| AC-03 · GPS negado | Pessoa seleciona ponto manual e continua sem perder dados | RF-DEN-02 |
| AC-04 · Rede e reenvio | Falha antes/depois da gravação e envio repetido resultam em no máximo um registro por tentativa; limites de repetição de confirmação/envio são aplicados no serviço | RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08 |
| AC-05 · Publicação pendente | Persistência confirmada com mapa pendente mantém protocolo e acesso do agente | RF-DEN-05 |
| AC-06 · Mapa e filtros | Visitante vê campos permitidos, filtros coerentes e atendidas; erro não vira zero; consultas respeitam limites e lista técnica pagina resultados | RF-MAP-01, RF-MAP-02, RF-AGE-01, RNF-07 |
| AC-07 · Privacidade | API/URLs/metadados públicos não retornam dados estruturados privados ou ponto exato; logs e métricas não recebem esses dados sem necessidade definida | RF-MAP-01, RNF-05, RNF-10 |
| AC-08 · Permissões | Visitante e conta revogada não consultam privado nem alteram ocorrência | RF-AUT-02, RNF-03 |
| AC-09 · Atendimento | Leitura não muda etapa; conclusão exige visita/análise local e campos necessários; impedimento mantém Em análise com observações; Atendida não reabre | RF-AGE-01 a RF-AGE-03, RF-AGE-05 |
| AC-10 · Concorrência | Ação antiga/repetida não sobrescreve transição posterior nem duplica evento | RF-AGE-02, RF-AGE-03, RNF-09 |
| AC-11 · Ocultação | Retirada interrompe consulta/mídia pública, mantém interno e resiste a republicação por retentativa | RF-AGE-04, RNF-06 |
| AC-12 · Interfaces | Jornada executável nos tamanhos escolhidos e por teclado, com estados de erro/vazio | RNF-01, RNF-02 |
| AC-13 · Republicação | Agente revisa e republica explicitamente; histórico preservado; republicação não muda atendimento e tarefa antiga não desfaz ocultação posterior | RF-AGE-06, RNF-06 |
| AC-14 · Correção autorizada | Administrador e cidadão com vínculo verificado corrigem; cidadão só acessa a própria denúncia; acesso indevido negado; valores originais e motivo preservados; etapa/visibilidade não mudam automaticamente | RF-COR-01, RNF-03, RNF-05, RNF-09 |

Executar primeiro com dados fictícios e serviços de teste. Guardar evidência da versão testada, resultado e limitações. Não substituir esses cenários por capturas do Figma. A etapa com moradores reais exige resolver as dependências de lançamento abaixo.

## 15. Entregas e aprendizagem

| Entrega | Resultado demonstrável |
|---|---|
| E1 · Estrutura e navegação | HTML/CSS/JS das telas, entrada do formulário, mapa e área técnica |
| E2 · Dados fictícios compartilhados | Formulário, mapa e Ocorrências usam o mesmo contrato |
| E3 · Envio integrado | Confirmação de e-mail, fotos, persistência, protocolo e recuperação |
| E4 · Público e agente | Projeção aproximada, autorização, atendimento e ocultação |
| E5 · Aceite V1 | Evidências AC-01 a AC-14 e preparação de operação |
| E6 · Evolução | Dashboard/gráficos e melhorias priorizadas pelo uso |

As primeiras atividades de HTML já acordadas são Início, Registrar Foco/Denúncia, Jogo e Guia Aedes. Sua ordem didática não significa que jogo e guia sejam bloqueadores do núcleo operacional. Datas e atribuições de novas tarefas não são inventadas neste documento.

## 16. Riscos e limites assumidos

- **Publicação automática:** fotos e descrição podem identificar pessoas incidentalmente. Aviso, retirada posterior e rotina diária reduzem exposição, mas não garantem prevenção. Revisão prévia foi adiada explicitamente.
- **CPF obrigatório:** aumenta o conjunto de dados privados armazenados e não atinge, sozinho, a comprovação de identidade pretendida. O requisito permanece conforme decisão do usuário.
- **Uso operacional:** logins não comprovam disponibilidade dos agentes ou vínculo oficial. Não há compromisso de prazo de atendimento documentado.
- **Representação territorial:** aproximar o ponto reduz precisão, mas imagem, texto e contexto podem revelar o local. Fonte territorial e método precisam de teste.
- **Abuso e custo:** piloto aberto pode receber envios indevidos e volume acima do esperado; limites devem existir no serviço.
- **Dependência do mapa/e-mail:** falhas externas precisam de mensagens e recuperação, sem confirmação falsa.
- **Ausência de agentes:** o recebimento continua por decisão do usuário, mesmo que agentes fiquem indisponíveis por dias. Isso pode aumentar fila e demora de retirada; o e-mail de contato e a conferência diária precisam de responsável.
- **Retenção e custo:** preservar relatos e imagens por tempo indefinido e manter custo mínimo são objetivos que precisam de planejamento de volume, armazenamento e financiamento. Nenhum plano gratuito permanente foi garantido.

Esses riscos são parte do produto escolhido, não autorização para adicionar silenciosamente moderação prévia, remover CPF ou restringir o piloto a convidados.

## 17. Dependências de implementação e lançamento

| ID | Entrega necessária | Resolver até | Responsabilidade a assumir |
|---|---|---|---|
| DEP-01 | Catálogo de categorias/localidades e limite territorial de Itambé com fonte e versão | Integração da validação territorial | Produto com agentes e desenvolvimento |
| DEP-02 | Forma/precisão da representação aproximada, incluindo fronteiras e áreas pouco densas | Publicação de pontos reais | Produto e desenvolvimento |
| DEP-03 | Mecanismo de e-mail, expiração, limites e tratamento de arquivos | Integração real do envio | Desenvolvimento |
| DEP-04 | Identificar a instituição corresponsável, esclarecer vínculo do piloto e confirmar uso com agentes | Lançamento com moradores | Administração e instituição ainda não nomeada; o administrador gerencia acessos, aprova abertura e assume manutenção |
| DEP-05 | Designar conferência diária/substituto e criar e acompanhar e-mail de reclamação/correção/retirada | Publicação de conteúdo real | Administração e operação; responsável pela conferência ainda não definido |
| DEP-06 | Finalidade documentada da coleta de CPF, aviso de privacidade e política por tipo de dado, considerando intenção de retenção indefinida | Coleta de dados pessoais reais | Administração, instituição corresponsável e operação |
| DEP-07 | Provedor de mapa, estimativa de volume/custo, teto financeiro e comportamento ao atingir cotas; prioridade é baixo custo, idealmente zero | Ambiente público | Administração e instituição com desenvolvimento; teto ainda não definido |
| DEP-08 | Correção pelo administrador e cidadão, verificação de vínculo por denúncia, trilha de alterações e recuperação segura de acesso | Integração da correção | Administração com desenvolvimento |
| DEP-09 | Período e critérios de avaliação do piloto, sem prometer metas ainda não definidas | Avaliação de resultados | Produto e agentes participantes |
| DEP-10 | Definir titularidade dos campos no envio em nome de terceiros e envio assistido/por menores | Implementação dessa modalidade | Administração e instituição com operação |
| DEP-11 | Definir desfecho operacional de denúncias falsas/improcedentes sem visita, sem rotulá-las falsamente como Atendida | Tratamento dessas ocorrências no piloto | Administração e agentes |

O administrador assumiu explicitamente as responsabilidades descritas. A instituição ainda não foi nomeada, e o vínculo formal não está confirmado; não presumir compromisso de uma instituição específica. DEP-06 mantém CPF obrigatório e registra o limite da verificação. Não constitui pedido de reabrir a decisão de campo nesta versão.

## 18. Definição de pronto

**Documento consolidado:** decisões confirmadas, requisitos com aceite, dados e permissões registrados, rastreabilidade e dependências identificadas. A versão 1.2 inclui correção pelo administrador e pelo cidadão responsável pelo envio; envio em nome de terceiros e encerramento de denúncia inválida continuam explicitamente pendentes.

**Núcleo técnico entregue:** cenários AC-01 a AC-14 demonstrados na versão candidata. Dashboard e recursos complementares não condicionam esse aceite.

**Abertura para moradores:** dependências de lançamento resolvidas, contas autorizadas operantes, ocultação testada, custos observáveis e comunicação honesta sobre o papel do serviço. Não equivale a integração deste PR, aval jurídico, aprovação municipal ou validação de impacto sanitário.

## 19. Referências e precedência

1. Decisões explícitas do usuário nesta conversa em 04–05/11/2026, inclusive publicação automática, dados privados, CPF mantido e dashboard posterior.
2. Notas do segundo cérebro: `02 Projects/Aedes Data Lab/Contexto.md` e `Roteiro de aprendizagem e desenvolvimento.md`. Fontes locais externas ao repositório.
3. [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y) e [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65), como referências de design e trabalho; não auditados ao vivo para esta finalização.
4. PRD do Repecol, `docs/PRD_REPELCONTROL.md`, consultado no projeto separado: referência de organização, requisitos por função, jornadas, acesso e aceite. Contas de cidadão, chat, produção, comércio, território de Mogeiro, prioridade automática e SLA não foram herdados.

Em conflito com telas históricas ou recomendações antigas, prevalecem as decisões atuais registradas neste PRD. Mudanças futuras devem manter o histórico do motivo da alteração.

## 20. Histórico documental

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 04/11/2026 | Primeiro rascunho do Aedes e Start Técnico no PR #2 |
| 0.2 | 04/11/2026 | Adaptação estrutural do Repecol e decisões da entrevista |
| 1.0 | 05/11/2026 | Critérios por requisito, campos/acesso, estados de atendimento/publicação, rastreabilidade, limites de afirmação e dependências de lançamento |
| 1.1 | 05/11/2026 | Visita para Atendida, observações em análise, sem reabertura, republicação pelo agente, correção inicialmente exclusiva da administração, responsabilidades e preferências de retenção/custo |
| 1.2 | 05/11/2026 | Correção permitida ao administrador e ao cidadão responsável pelo envio, com autorização restrita à própria denúncia; responsabilidades descritas por papel, sem nome pessoal |
