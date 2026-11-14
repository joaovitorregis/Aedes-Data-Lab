# Aedes Data Lab: Documento de Requisitos de Produto (PRD)

| Campo | Valor |
|---|---|
| Versão | 2.3 · 14/11/2026 |
| Território | Itambé, Pernambuco |
| Responsável pelo documento | Administrador do produto |
| Público | Produto, design, desenvolvimento, testes e agentes participantes |
| Documentos relacionados | [Arquitetura](./ARCHITECTURE.md) · [Design](./DESIGN.md) · [Regras](./RULES.md) · [Tarefas](../TASKS.md) · [Plano de testes](./TEST_PLAN.md) · [Segurança](./SECURITY.md) |

## Visão do produto

| Item | Definição |
|---|---|
| Produto | Aedes Data Lab |
| Problema | Moradores de Itambé/PE não têm um canal simples para relatar focos do mosquito da dengue, e os agentes não recebem esses relatos com localização, fotos e histórico organizados |
| Usuários | Moradores que registram denúncias; visitantes que consultam o mapa; agentes de endemias autorizados; administrador do produto |
| Objetivo | Levar cada denúncia do celular do morador até a fila dos agentes e ao mapa público, protegendo os dados pessoais |
| Funcionalidades principais | Registro de denúncia com confirmação do contato escolhido após os dados do cidadão; mapa público com filtros; área de Ocorrências dos agentes com registro de visita e relatório; ocultação e correção de denúncias |
| MVP (V1) | Envio com fotos e ponto no mapa, protocolo, mapa com área aproximada, login de agente, análise, registro de visita, encerramento após três tentativas sem acesso, relatório em PDF e Word, ocultação, republicação e correção (seções 6 e 9) |
| Fora do escopo | Dashboard e gráficos, chat, notificações, conta do cidadão, agenda de visitas, digitalização da ficha de campo do PNCD, casos confirmados de dengue, comércio e produção de repelente (seção 6.1) |
| Critérios de sucesso | Cenários AC-01 a AC-16 demonstrados na versão candidata (seção 15 e [TEST_PLAN.md](./TEST_PLAN.md)) |

## 1. Resumo executivo

O Aedes Data Lab é uma plataforma web em que moradores de Itambé/PE registram possíveis focos do mosquito da dengue. Cada denúncia traz o ponto do foco, fotos, uma descrição e a identificação de quem enviou, que fica restrita à equipe. Assim que o recebimento é confirmado, a denúncia entra na fila dos agentes e uma versão pública, com localização aproximada, aparece no mapa.

Os agentes usam login individual; a V1 opera com uma conta de agente. Na área de Ocorrências o agente inicia a análise, vai ao local e registra a visita com poucos toques: se teve acesso, o que encontrou e o que fez. A visita com acesso conclui a ocorrência; sem acesso, ela continua em análise e pode ser encerrada depois da terceira tentativa. O agente também baixa um relatório do período em PDF ou Word para enviar ao supervisor e pode ocultar ou republicar o conteúdo público. O administrador cuida dos acessos e pode corrigir os dados de qualquer denúncia. O cidadão que enviou também pode corrigir a sua, enquanto ela ainda não entrou em análise.

O produto mostra à equipe e à população onde há relatos. **Denúncias não equivalem a casos confirmados de dengue nem comprovam risco epidemiológico.**

A V1 precisa entregar o caminho inteiro: **envio → gravação → mapa público → Ocorrências dos agentes → atualização do atendimento**. Dashboard e gráficos ficam para a fase seguinte. O lançamento será aberto a qualquer morador, sem lista de convidados, e o recebimento continua mesmo quando nenhum agente estiver disponível por alguns dias. O administrador aprova a abertura e responde pela manutenção, em conjunto com uma instituição parceira que ainda será formalizada (DEP-04).

## 2. Como ler este documento

Este PRD responde o que será construído e por quê, e como cada parte será aceita. A forma de construir está em [ARCHITECTURE.md](./ARCHITECTURE.md), a aparência em [DESIGN.md](./DESIGN.md) e a ordem de trabalho em [TASKS.md](../TASKS.md). Se algum desses documentos divergir do PRD sobre comportamento, vale o PRD.

O texto usa três tipos de item:

- **Decisões de produto (D):** escolhas do responsável pelo produto, reunidas na seção 5.
- **Requisitos (RF e RNF):** o que o sistema precisa fazer, cada um com critério de aceite.
- **Dependências (DEP):** configurações, responsáveis ou políticas que precisam estar resolvidas antes de uma entrega específica (seção 18).

O desenvolvimento pode avançar com dados fictícios enquanto houver dependências de lançamento abertas. Toda mudança de escopo atualiza este PRD e os critérios de aceite no mesmo PR.

## 3. Glossário

| Termo | Significado |
|---|---|
| Denúncia | Envio feito pelo morador no fluxo de denúncia, que começa na tela Início e na página `registrar-foco.html` |
| Ocorrência | A mesma denúncia, tratada na área dos agentes |
| Publicação | Versão pública da denúncia no mapa, apenas com os campos permitidos |
| Protocolo | Código gerado pelo serviço depois que a denúncia foi gravada; comprova o recebimento |
| Etapa de atendimento | Recebida, Em análise, Atendida ou Encerrada |
| Visita | Ida do agente ao local de uma ocorrência, registrada com data, acesso e resultado (seção 8.1) |
| Tentativa sem acesso | Visita em que o agente não conseguiu inspecionar o local: imóvel fechado, morador recusou ou local não encontrado |
| Encerrada | Etapa final de uma ocorrência que não pôde ser inspecionada depois de três tentativas sem acesso; não equivale a Atendida |
| Relatório | Arquivo em PDF ou Word, gerado pelo agente, com as visitas e os totais de um período, para o supervisor |
| Ficha de campo | Registro Diário do Serviço Antivetorial do PNCD, preenchido em papel na rotina dos ciclos; não é digitalizado pelo Aedes Data Lab |
| Estado de publicação | Pendente, Publicada ou Oculta |
| Agente autorizado | Pessoa com login individual liberado pelo administrador para a área de Ocorrências |
| Administrador | Papel que gerencia acessos, corrige denúncias e aprova a abertura pública |
| Cidadão responsável pelo envio | Quem enviou a denúncia e comprova o vínculo com ela por mecanismo seguro; o contato confirmado no envio é registrado, e a recuperação desse acesso depende de DEP-08 |

## 4. Contexto e estado atual

O Aedes Data Lab precisa reunir relatos com informação suficiente para o trabalho dos agentes e dar à população uma visão pública do que foi relatado. A adesão institucional ainda não foi formalizada.

**Rotina atual dos agentes (levantamento de 12/11/2026):** a coordenação de endemias de Itambé trabalha por imóveis visitados em ciclos, com retorno a cada 45 a 48 dias. Com o déficit de agentes, cada ciclo alcança cerca de 60% dos imóveis. Em campo, o agente preenche em papel a ficha Registro Diário do Serviço Antivetorial do PNCD (quarteirão, logradouro, tipo de imóvel, pendência, depósitos A1 a E, amostras e tratamento). O Aedes Data Lab não substitui essa ficha (D27): ele cuida da demanda que chega pelo morador, para que o agente veja a ocorrência, vá ao local e registre a providência. A coordenação informou os 15 bairros atendidos (D33) e poucos casos confirmados de dengue e chikungunya em 2026; casos confirmados ficam fora do produto.

A experiência é pensada primeiro para o celular e precisa funcionar bem no computador. Quatro integrantes constroem HTML, CSS e JavaScript das telas. Banco de dados e integrações serão aprendidos em conjunto com a coordenação do projeto, e essa ordem de aprendizagem não altera os critérios de aceite.

O andamento da implementação é registrado em [MEMORY.md](./MEMORY.md), que é atualizado a cada entrega. As páginas Meu trabalho, Mapa técnico e Dashboard já existem no repositório como espaço reservado, fora do aceite da V1 (seção 6.1).

**Design:** a referência visual é o [Figma](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y/Aedes-Data-Lab-%C2%B7-Wireframes-por-p%C3%A1gina?node-id=2014-13), página "Fluxo de telas · Jornada do Usuário". A denúncia segue o fluxo da seção 02 dessa página (D35, D36); a versão anterior fica arquivada fora da jornada, só para consulta. As telas simulam código, envio, protocolo e publicação e não comprovam serviço implementado. As exportações em `wireframes/` são anteriores a esse fluxo. O estado atual do arquivo fica em [MEMORY.md](./MEMORY.md).

## 5. Decisões de produto

| ID | Decisão |
|---|---|
| D01 | A V1 inclui denúncia gravada, mapa público, lista e detalhe de Ocorrências e atualização do atendimento pelos agentes. |
| D02 | O lançamento é aberto a moradores reais, sem grupo fechado de convidados. |
| D03 | Foto e descrição são publicadas automaticamente, sem aprovação prévia de agente. |
| D04 | Agente autorizado pode ocultar uma publicação, com motivo, preservando o registro interno. Antes da abertura pública haverá um responsável e uma rotina diária de conferência. |
| D05 | Botão público para sinalizar conteúdo e análise automática de fotos ficam fora da V1. |
| D06 | Nome, CPF, e-mail e telefone são obrigatórios no formulário. O cidadão confirma por código apenas o canal escolhido naquela denúncia: e-mail ou telefone por SMS ou WhatsApp. Nenhum desses campos aparece no mapa, nem de forma parcial. |
| D07 | O CPF é obrigatório. A intenção é confirmar que a pessoa existe; como digitar ou validar o formato não comprova titularidade, o produto não anuncia identidade verificada. |
| D08 | A confirmação do contato acontece depois de preencher os dados do cidadão e antes da revisão e do envio. A confirmação de uma denúncia não vale para outra. A V1 não tem conta permanente nem histórico pessoal. |
| D09 | O público vê a localização aproximada; agentes autorizados veem o ponto exato. |
| D10 | Só são aceitas denúncias dentro de Itambé/PE. O mapa pode ser navegado fora do município, o envio não. |
| D11 | Cada agente tem login individual liberado pelo administrador. Todos os agentes autorizados consultam todas as ocorrências de Itambé e os dados privados, inclusive o CPF completo. |
| D12 | Etapas de atendimento: Recebida → Em análise → Atendida ou Encerrada. Abrir o detalhe não muda a etapa; iniciar a análise é uma ação explícita. |
| D13 | Para marcar como Atendida, o agente precisa ter ido ao local e analisado a situação, registrando a visita com acesso (D28). A resposta ao cidadão é a atualização da ocorrência, sem mensagem individual. |
| D14 | Se a gravação funcionar e a publicação falhar, o cidadão recebe o protocolo e o aviso de publicação pendente. |
| D15 | Dashboard e gráficos vêm depois da V1. Contagens representam relatos e não classificam risco automaticamente. |
| D16 | Repelentes é conteúdo educativo. Chat, comércio, pedidos e produção ficam fora da V1. |
| D17 | Quando não consegue resolver ou não consegue acesso ao local, o agente mantém a ocorrência Em análise e registra a tentativa ou observações internas. |
| D18 | Ocorrências Atendidas ou Encerradas não são reabertas. Conclusão por engano ou reaparecimento do problema exige nova denúncia. |
| D19 | O agente pode republicar uma ocorrência oculta depois de revisá-la. Ocultar não apaga o registro. |
| D20 | O administrador corrige os campos de qualquer denúncia. O cidadão responsável pelo envio corrige apenas a própria, dentro do prazo definido em D26. Agentes ficam com as ações operacionais. |
| D21 | Envio em nome de outra pessoa é aceito em princípio. A quem pertencem nome, CPF, e-mail e telefone nesse caso ainda será definido (DEP-10). |
| D22 | O administrador libera, revoga e recupera contas de agentes, aprova a abertura pública e assume a manutenção. A responsabilidade pelo serviço é compartilhada com uma instituição parceira a formalizar (DEP-04). |
| D23 | A falta de agentes por vários dias não suspende o recebimento. Haverá um e-mail de contato para reclamações, pedidos de correção e retirada de conteúdo (DEP-05). |
| D24 | As informações devem ser preservadas por prazo indefinido, sem perda de histórico. A política por tipo de dado será formalizada em DEP-06. |
| D25 | O custo de operação deve ser baixo, idealmente zero. Ainda não há teto financeiro definido (DEP-07). |
| D26 | O cidadão corrige a própria denúncia somente enquanto ela estiver Recebida. Depois que entra Em análise, ele pede a correção pelo e-mail de contato (D23) e o administrador decide se aplica. |
| D27 | A ficha de campo do PNCD (Registro Diário do Serviço Antivetorial) não é digitalizada. O Aedes Data Lab registra só a visita feita para atender a denúncia, com campos de toque inspirados na ficha e os mesmos códigos dela. |
| D28 | A conclusão acontece pelo registro de visita. Visita com acesso leva a Atendida; visita sem acesso (imóvel fechado, morador recusou ou local não encontrado) mantém Em análise e conta uma tentativa. "Programar visita" sai da V1. |
| D29 | A partir da terceira tentativa sem acesso, o agente pode encerrar a ocorrência na etapa Encerrada, por ação explícita. Encerrada é final e não se confunde com Atendida. |
| D30 | Sobre tratamento, a V1 registra apenas se houve larvicida aplicado. Tipo de produto, quantidade em gramas e depósitos tratados ficam fora. |
| D31 | A V1 opera com uma única conta de agente, individual. Todo evento continua gravando o autor, para que novas contas possam ser liberadas sem mudar o modelo. O supervisor não usa o sistema. |
| D32 | O agente gera um relatório do período em PDF ou Word para enviar ao supervisor. O relatório não traz nome, CPF, e-mail ou telefone do morador. |
| D33 | As localidades da V1 são os 15 bairros informados pela coordenação: Altiplano, Boa Vista, Gildo Andrade, Jardim Bela Vista, Loteamento Figueiredo, Luís Gonzaga, Maracujá, Novo Itambé, Novo Itambé II, Parque das Palmeiras, Pedra Bela, Planalto, Salgadeira, Santa Maria e Vila Cohab. Não há bairro "Centro". |
| D34 | O detalhe da ocorrência avisa quando há outras denúncias num raio de 150 metros do ponto exato. O aviso não funde nem descarta ocorrências. |
| D35 | A jornada de denúncia começa na tela Início: o cidadão escolhe denunciar, informa localização, descreve o foco e anexa fotos, preenche seus dados, confirma o contato escolhido, revisa o que será público e privado, envia e recebe o resultado. Estados de erro e publicação pendente pertencem à mesma jornada. |
| D36 | O fluxo visual atualizado substitui a versão antiga como referência de implementação. Usa telas inteiras, conteúdo sem cortes, textos e ações alinhados, navegação em posição consistente e barra de URL simulada uniforme. Estados alternativos ficam próximos da etapa a que pertencem; as telas antigas servem apenas como histórico. |
| D37 | Na prévia do Figma, o mapa da tela de localização reaproveita a imagem da versão anterior por escolha visual do responsável. Essa imagem mostra Itambé/BA e não serve como mapa, contorno territorial ou validação de ponto para Itambé/PE. A cartografia real depende de DEP-01 e DEP-07 antes do uso com moradores. |

## 6. Objetivos e escopo da V1

A V1 precisa levar uma denúncia até os agentes e ao mapa público sem expor os campos privados. Cada resultado abaixo tem uma evidência de entrega:

| Resultado | Evidência de entrega |
|---|---|
| Recebimento confiável | Protocolo exibido na confirmação e registro presente após recarregar |
| Visibilidade pública | A mesma denúncia no mapa, com área aproximada e só os campos permitidos |
| Operação do agente | Conta autorizada abre o detalhe, inicia a análise, registra a visita e baixa o relatório do período |
| Proteção de acesso | Visitante não lê dados privados nem executa ações dos agentes |
| Retirada de publicação | Ocultação com motivo tira o conteúdo do ar e mantém o histórico interno |
| Recuperação de falhas | GPS negado, falha de upload, resposta perdida e reenvio têm comportamento verificável |

Este PRD não fixa prazo de vistoria, número de usuários, volume de denúncias ou meta de redução da dengue. As metas de adoção serão combinadas com a operação (DEP-09).

### 6.1 Matriz de escopo

| Capacidade | V1 | Depois da V1 |
|---|---|---|
| Página Início com acesso a registrar e consultar | Incluída | Refinamentos de conteúdo |
| Confirmação por código no canal escolhido por denúncia (e-mail, SMS ou WhatsApp) | Incluída | Sem conta permanente prevista |
| Formulário, fotos, localização e protocolo | Incluídos | Melhorias a partir do uso |
| Mapa público com filtros | Incluído | Novas formas de leitura do território |
| Login, lista, detalhe e ações do agente | Incluídos | Outras ferramentas operacionais |
| Registro de visita, encerramento sem acesso e relatório em PDF e Word | Incluídos | Indicadores no dashboard |
| Ponto exato, "Como chegar" e mapa dentro de Ocorrências | Incluídos | Mapa técnico dedicado, em decisão própria |
| Dashboard, gráficos e comparações | Fora do aceite | Fase seguinte |
| Guia Aedes, Repelentes, Quem somos e entrada do jogo | Complementares, em paralelo | Conteúdo conforme fontes e design |
| Agenda de visitas, Meu trabalho e roteiro otimizado | Fora do aceite | Sem compromisso neste roadmap |
| Ficha de campo do PNCD: quarteirão, contagem de depósitos, tipo e gramas de larvicida, amostras, ciclo e atividade | Fora do produto (D27) | Continua no papel e no sistema oficial |
| Casos confirmados de dengue e chikungunya | Fora da V1 | Só total do município por mês, se houver fonte oficial |
| Aprovação ou acesso do supervisor | Fora da V1 (D31) | Supervisor recebe o relatório |
| Chat, resposta individual, push e central de notificações | Fora da V1 | Sem compromisso |
| Conta e histórico pessoal do cidadão | Fora da V1 | Sem compromisso |
| Comércio e produção de repelente | Fora do produto | Sem compromisso |

A confirmação por código faz parte da V1 mesmo com notificações fora do escopo. O canal escolhido serve para essa confirmação; não cria chat nem canal de resposta individual. A ausência do dashboard também não dispensa a gravação dos dados que as análises futuras vão usar.

## 7. Perfis e permissões

| Operação | Visitante | Cidadão responsável pelo envio | Agente autorizado | Administrador |
|---|---|---|---|---|
| Ver o mapa público | Sim | Sim | Sim | Sim |
| Enviar denúncia | Sim, após confirmar o canal escolhido | Sim, uma nova denúncia | Pelo fluxo público | Pelo fluxo público |
| Ler campos privados | Não | Só os que enviou na própria denúncia | Todas as ocorrências de Itambé, inclusive CPF completo | Sim, para corrigir |
| Corrigir campos enviados | Não | Própria denúncia, enquanto Recebida | Não | Qualquer denúncia, em qualquer etapa |
| Iniciar análise, registrar visita e observação, encerrar sem acesso | Não | Não | Sim | Somente se também tiver papel de agente |
| Gerar relatório em PDF ou Word | Não | Não | Sim | Somente se também tiver papel de agente |
| Ocultar e republicar | Não | Não | Sim | Somente se também tiver papel de agente |
| Ver observações e histórico interno | Não | Não | Sim | No que for necessário à correção |
| Liberar, revogar e recuperar contas de agentes | Não | Não | Não | Sim |
| Apagar histórico pela interface | Não | Não | Não | Não |

Os agentes autorizados enxergam o município inteiro, sem divisão por equipe ou região. Na V1 existe uma única conta de agente (D31); as regras acima continuam valendo quando outras contas forem liberadas. O supervisor não tem acesso ao sistema e acompanha o trabalho pelo relatório (D32). A permissão de correção do cidadão funciona sem conta permanente e não dá acesso às notas dos agentes, ao histórico interno ou a denúncias de outras pessoas. Corrigir dados é uma permissão separada das ações de análise, atendimento e publicação.

## 8. Dados da denúncia

| Campo | Obrigatório | Destino e regra |
|---|---|---|
| Nome | Sim | Privado. Iniciais e apelidos derivados também não são publicados |
| CPF | Sim | Privado. Dado declarado, sem prova de titularidade |
| E-mail | Sim | Privado. É confirmado se o cidadão escolher o código por e-mail; informar o endereço não valida CPF nem identidade civil |
| Telefone | Sim, com DDD | Privado. É confirmado se o cidadão escolher código por SMS ou WhatsApp; informar o número não valida CPF nem identidade civil |
| Canal de confirmação | Um por denúncia | Privado. E-mail, SMS ou WhatsApp; registra qual contato foi confirmado, sem tornar o outro confirmado |
| Ponto do foco | Sim | Exato na área dos agentes; aproximado no mapa público |
| Bairro ou localidade | Sim | Público, escolhido entre os 15 bairros de D33 |
| Categoria | Sim | Pública, a partir de catálogo versionado para preservar registros antigos |
| Descrição | Sim | Publicada automaticamente após o recebimento |
| Fotos | De uma a três | Publicadas após tratamento técnico, sem aprovação humana prévia |
| Endereço digitado | Previsto; obrigatoriedade em DEP-12 | Privado. Não substitui o ponto marcado no mapa |
| Referência do local | Não | Privada, para não anular a aproximação pública |
| Protocolo, data e etapa | Gerados pelo serviço | Data e etapa são públicas; o protocolo é o comprovante de recebimento |
| Visitas, observações e autor | Registrados pelo agente | Internos; ver 8.1. Só a etapa resultante vai para o mapa |

O ponto marcado no mapa é a referência espacial exata da denúncia. Endereço e referência ficam privados porque revelariam o local que a área aproximada protege. Categorias, formatos e tamanhos de arquivo e a precisão da área pública serão configurados na implementação.

O CPF passa por conferência de formato e dígitos verificadores, para pegar erro de digitação. Não há consulta externa nem validação de titularidade. O mesmo CPF ou e-mail pode aparecer em denúncias diferentes, e o sistema não limita o número de denúncias por pessoa. Controle de abuso (RNF-08) atua sobre repetição e volume, sem bloquear relatos legítimos.

Antes do envio, o formulário avisa que foto e descrição serão públicas e orienta a evitar rostos, placas e dados pessoais. Como a V1 publica sem revisão prévia, uma foto ou um texto ainda pode identificar alguém. A separação dos campos protege os dados estruturados; para conteúdo indevido encontrado depois, o caminho é a ocultação.

### 8.1 Registro de visita

O agente responde tocando em opções, sem digitar, exceto nas observações. Os códigos são os mesmos da ficha de campo do PNCD e ficam guardados junto com o valor; a tela mostra o código e o nome. Todos os campos são internos.

| Campo | Obrigatório | Valores |
|---|---|---|
| Data da visita | Sim | Hoje por padrão, editável. Não pode ser futura nem anterior ao recebimento |
| Acesso | Sim | Com acesso · Imóvel fechado · Morador recusou · Local não encontrado |
| Tipo do local | Sim, com acesso | R Residência · C Comércio · TB Terreno baldio · PE Ponto estratégico · O Outro |
| Foco encontrado | Sim, com acesso | Sim · Não |
| Depósitos com foco | Sim, se houve foco; um ou mais | A1 Caixa d'água elevada · A2 Depósito no nível do solo (tonel, barril, cisterna) · B Pequeno depósito móvel (vaso, prato, garrafa, bebedouro) · C Depósito fixo (calha, laje, ralo) · D1 Pneu · D2 Lixo, sucata ou entulho · E Depósito natural (bromélia, oco de árvore) |
| Ações realizadas | Sim, com acesso; uma ou mais | Orientação ao morador · Depósito eliminado · Larvicida aplicado · Amostra coletada · Pedido de bloqueio ou fumacê |
| Observações | Não | Texto livre, até 500 caracteres |
| Autor e momento do registro | Gerados pelo serviço | — |

Na visita sem acesso, o agente informa só a data, o motivo e, se quiser, observações. Quantidade de depósitos, tipo e gramas de larvicida, número da amostra, quarteirão, ciclo e atividade ficam fora (D27, D30).

## 9. Requisitos funcionais

### RF-AUT-01 · Confirmar o contato escolhido a cada denúncia

Depois de informar localização, foco, fotos, nome, CPF, e-mail e telefone, a pessoa escolhe receber um código por e-mail ou pelo telefone. A opção e-mail avança diretamente à tela do código enviado à caixa de entrada. A opção telefone abre a escolha entre SMS e WhatsApp; só depois de escolher um deles a pessoa avança à tela do código. O código confirma o acesso ao contato escolhido e fica vinculado apenas àquela tentativa de denúncia. O outro contato permanece informado, mas não confirmado. A pessoa pode corrigir o contato correspondente e pedir novo código se ele falhar ou expirar, sem perder o formulário. Essa etapa não vira cadastro com senha.

**Aceite:** a escolha do canal só aparece depois dos dados do cidadão; e-mail abre a entrada do código sem uma escolha intermediária; telefone oferece SMS e WhatsApp; código ausente, inválido ou expirado impede a revisão e o envio; confirmar um canal não marca o outro como confirmado; a confirmação de uma tentativa não vale para outra; falha de entrega ou resposta perdida preserva o preenchimento e permite recuperação sem duplicar a denúncia.

### RF-AUT-02 · Proteger a sessão do agente

Login individual, com autorização concedida pelo administrador fora do cadastro público, e opção de sair. A revogação bloqueia novas leituras e operações protegidas. Ao sair, a interface limpa as informações privadas da tela.

**Aceite:** visitante e conta sem papel de agente não leem o detalhe privado nem mudam a etapa; conta revogada para de operar; conhecer o endereço de uma página técnica não concede acesso.

### RF-DEN-01 · Preencher e revisar

Da tela Início, a ação de denunciar abre um formulário completo em passos claros: localização do foco, identificação e evidências, dados do cidadão, confirmação do contato escolhido e revisão. A revisão mostra o conteúdo público e o privado antes do envio. A pessoa pode corrigir qualquer campo e remover ou trocar fotos; voltar um passo não apaga o que foi preenchido.

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

Mapa sem login, com posição aproximada, bairro ou localidade, categoria, data de recebimento, etapa atual, foto e descrição. Denúncias atendidas e encerradas continuam no mapa, a menos que estejam ocultas. O resultado da visita (foco, depósitos, ações e observações) não é público.

**Aceite:** o visitante encontra a denúncia publicada e abre seu detalhe; nenhuma resposta de rede, URL de mídia ou metadado entrega campo privado, referência do local ou ponto exato. O limite sobre conteúdo incidental em texto e foto segue a seção 8.

### RF-MAP-02 · Filtrar e tratar falhas

Filtros por localidade, período de recebimento e etapa. Os filtros continuam aplicados quando a pessoa abre uma denúncia e volta ao mapa. A tela diferencia três situações: não há denúncias, não há resultado para os filtros escolhidos, ou houve erro de carregamento.

**Aceite:** os marcadores correspondem ao recorte indicado nos filtros; erro nunca aparece como contagem zero; falha da camada do mapa oferece nova tentativa sem apagar formulário aberto. Agrupamento de pontos, busca por rua e imagem de satélite não fazem parte do aceite.

### RF-AGE-01 · Consultar a fila e o detalhe

**Lista.** No topo, um resumo com quantas ocorrências estão Recebidas, Em análise e com tentativa sem acesso. Cada cartão mostra protocolo, bairro, data, etapa, há quantos dias está aberta e, quando houver, "Sem acesso (N tentativas)" e "Oculta". Filtros por protocolo, bairro, período, etapa e "Sem acesso". A ordem padrão é mais antigas primeiro; também é possível ordenar por mais recentes. Um botão alterna entre Lista e Mapa: o mapa fica dentro de Ocorrências, usa os pontos exatos, colore os marcadores por etapa e respeita os mesmos filtros. Não há tela de mapa técnico separada nem barra com Meu trabalho e Dashboard.

**Detalhe.** Fotos que ampliam ao toque, descrição, categoria, ponto exato com o botão "Como chegar" (abre o aplicativo de mapas do aparelho no ponto, sem rastrear o agente), endereço digitado e referência, nome, telefone com toque para ligar e e-mail do morador, estado de publicação, histórico com autor e as visitas registradas. Os botões dependem da etapa: Recebida mostra "Iniciar análise"; Em análise mostra "Registrar visita" e "Adicionar observação"; Atendida e Encerrada são só leitura. Ocultar e republicar ficam num menu da ocorrência, em qualquer etapa.

**Ocorrências próximas.** O detalhe lista outras denúncias num raio de 150 metros do ponto exato (D34), com protocolo, data e etapa. Denúncias diferentes sobre o mesmo local continuam sendo ocorrências separadas: o agente trata cada uma, sem fusão automática nem descarte por proximidade. Vários relatos no mesmo ponto não significam vários focos. Ações em lote não estão previstas.

**Aceite:** o filtro de protocolo leva à ocorrência certa; o detalhe corresponde a ela; abrir e fechar não altera a etapa; os dias em aberto e as tentativas conferem com o histórico; lista e mapa mostram o mesmo recorte; o aviso de proximidade aparece só para denúncias dentro de 150 metros; lista vazia, filtro sem resultado e falha de carregamento têm mensagens próprias.

### RF-AGE-02 · Iniciar a análise

Ação explícita que leva a ocorrência de Recebida para Em análise e registra o agente e o momento.

**Aceite:** a leitura não muda a etapa; clique repetido não duplica o evento; o agente que iniciou fica registrado como autor, e isso não dá a ele exclusividade nem impede outros agentes de agir.

### RF-AGE-03 · Registrar a visita

Com a ocorrência Em análise, o agente abre "Registrar visita" **depois de ir ao local** e preenche os campos da seção 8.1. Antes de salvar, um resumo mostra as respostas e avisa o efeito: "A ocorrência ficará Atendida e não poderá ser reaberta" (com acesso) ou "A ocorrência continua Em análise; esta é a tentativa N sem acesso" (sem acesso).

- **Com acesso:** a ocorrência passa para Atendida. Atendida indica que houve visita com inspeção; não quer dizer que o foco foi confirmado ou eliminado.
- **Sem acesso:** a ocorrência continua Em análise, o histórico registra "Visita sem acesso" com o motivo e o contador de tentativas aumenta.

Se o envio falhar, o formulário continua preenchido no aparelho até o agente tentar de novo ou descartar. A visita é uma declaração do agente; não há rastreamento por GPS nem foto obrigatória.

**Aceite:** só ocorrências Em análise aceitam visita; campos obrigatórios vazios impedem o envio e indicam o campo; data futura ou anterior ao recebimento é recusada; com acesso, etapa e visita são gravadas juntas; sem acesso, a etapa não muda e a tentativa é contada; o mapa passa a exibir Atendida quando a ocorrência está publicada; clique repetido não duplica a visita; falha de rede não apaga o preenchimento.

### RF-AGE-04 · Ocultar a publicação

O agente autorizado retira o conteúdo público informando o motivo. O registro e o histórico privados continuam disponíveis. A V1 oculta a publicação inteira, incluindo as fotos; ocultar apenas uma foto não está previsto.

**Aceite:** depois da ocultação, novas consultas públicas à denúncia e às suas mídias não retornam conteúdo; o agente continua vendo o registro e o motivo; tentativas antigas de publicação não reexibem a denúncia oculta. Cópias que terceiros já tenham baixado estão fora do alcance do sistema.

### RF-AGE-05 · Registrar observações durante a análise

O agente acrescenta observações internas sobre a visita, impedimentos, a situação encontrada ou providências pendentes. As observações não alteram o texto enviado pelo morador.

**Aceite:** cada observação guarda autor e data; aparece para os agentes e fica fora da consulta pública; salvar uma observação não conclui a ocorrência nem sobrescreve as anteriores.

### RF-AGE-06 · Republicar após revisão

O agente pode republicar uma ocorrência oculta depois de revisar o conteúdo e, se for o caso, obter a correção pelo administrador ou pelo cidadão (RF-COR-01). Autor e data da decisão ficam registrados. Republicar muda apenas a visibilidade; a etapa de atendimento continua a mesma.

**Aceite:** a publicação só volta por ação explícita de agente autorizado; usa a versão atual do conteúdo e das mídias; uma tarefa antiga de publicação não desfaz a ocultação; uma ocultação posterior prevalece sobre tarefas antigas de republicação; o histórico guarda as duas decisões.

### RF-AGE-07 · Encerrar sem acesso

Quando a ocorrência Em análise soma três ou mais tentativas sem acesso, o detalhe mostra o botão "Encerrar sem acesso". O encerramento não é automático: o agente pode preferir uma nova tentativa. Ao confirmar, a ocorrência passa para Encerrada, com o motivo "Sem acesso após N tentativas", autor e data. Encerrada é final, não volta para Em análise e não conta como Atendida nos totais.

**Aceite:** o botão não aparece nem é aceito pelo serviço com menos de três tentativas; o encerramento exige confirmação; o mapa público passa a exibir Encerrada quando a ocorrência está publicada; Encerrada não reabre nem aceita nova visita.

### RF-AGE-08 · Gerar relatório

Na tela de Ocorrências, o botão "Relatório" abre uma prévia em que o agente escolhe o período (esta semana, este mês ou datas de início e fim), o bairro (todos ou um) e o formato (PDF ou Word). O arquivo é gerado no aparelho e baixado com nome que indica o período, por exemplo `relatorio-aedes-2026-11.pdf`.

Conteúdo do relatório:

1. Cabeçalho: Aedes Data Lab · Itambé-PE, nome do agente, período, bairro escolhido e data de geração.
2. Resumo: ocorrências recebidas no período, visitas registradas, Atendidas, tentativas sem acesso, Encerradas e visitas com foco.
3. Por bairro: os mesmos totais para cada um dos 15 bairros.
4. Depósitos com foco: contagem de A1 a E.
5. Visitas: data, protocolo, bairro, endereço, tipo do local, acesso, foco, depósitos, ações e observações.
6. Pendentes: ocorrências ainda Recebidas ou Em análise, com dias em aberto e tentativas.
7. Rodapé: espaço para as assinaturas do agente e do supervisor.

O relatório não traz nome, CPF, e-mail ou telefone do morador (D32). O arquivo Word é editável, para o supervisor anotar ou ajustar.

**Aceite:** os totais do relatório batem com a lista filtrada pelo mesmo período e bairro; nenhum dado de identificação do morador aparece no arquivo; período sem dados gera relatório com aviso "Nenhuma visita no período", sem erro; o PDF abre em leitores comuns e o Word abre no Microsoft Word e no LibreOffice; a geração funciona no celular e no computador.

### RF-COR-01 · Corrigir campos enviados

O administrador corrige os campos de qualquer denúncia, em qualquer etapa. O cidadão responsável pelo envio corrige a própria denúncia enquanto ela estiver Recebida. Quando a ocorrência já está Em análise, Atendida ou Encerrada, o cidadão pede a correção pelo e-mail de contato e o administrador decide se aplica (D26).

Podem ser corrigidos o ponto do foco, bairro, categoria, descrição e os dados de identificação e contato. Um ponto corrigido passa de novo pela validação de território. A correção é diferente de uma observação de agente e nunca reabre uma ocorrência concluída.

O cidadão precisa comprovar o vínculo com aquela denúncia antes de obter uma autorização temporária de edição, restrita ao registro e protegida contra reutilização. O envio registra qual contato foi confirmado. Protocolo, CPF, e-mail ou telefone digitados, isoladamente, não liberam acesso. O mecanismo de recuperação e a eventual troca do canal confirmado ainda serão definidos em DEP-08; o contato novo não pode servir para autorizações antes de ser confirmado.

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
| Em análise | Registrar visita com acesso | Atendida | Campos obrigatórios da seção 8.1, autor e momento |
| Em análise | Registrar visita sem acesso | Em análise | Data e motivo (fechado, recusado ou não encontrado); soma uma tentativa |
| Em análise, com três ou mais tentativas sem acesso | Encerrar sem acesso | Encerrada | Ação explícita com confirmação; motivo, autor e data |
| Em análise | Registrar observação | Em análise | Autor e data |
| Qualquer etapa | Administrador corrige campos | Mesma etapa | Motivo e histórico da correção |
| Qualquer etapa | Abrir ou consultar | Mesma etapa | Nenhum evento de mudança |
| Qualquer etapa | Ocultar publicação | Mesma etapa | Motivo e papel de agente |
| Qualquer etapa | Republicar após revisão | Mesma etapa | Decisão explícita de agente autorizado |

Ocorrência Atendida ou Encerrada não volta para Em análise, nem por correção, e não aceita nova visita. Conclusão por engano ou reaparecimento do problema pedem nova denúncia. Ninguém apaga histórico pela interface.

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

Quando o agente vai ao local e não o encontra, registra uma visita com o motivo "Local não encontrado"; depois de três tentativas, pode encerrar a ocorrência (RF-AGE-07). O encerramento de uma denúncia inválida que dispensa visita ainda está em definição (DEP-11). Até lá, o agente oculta a publicação quando for o caso, registra o motivo nas observações e mantém a ocorrência Em análise. Esses casos não são marcados como Atendida nem Encerrada.

## 11. Jornadas e mensagens

**Morador:** na tela Início, toca em denunciar → marca o local → descreve o foco, escolhe categoria e anexa de uma a três fotos → informa nome, CPF, e-mail e telefone em "Seus dados para o registro" → escolhe receber o código por e-mail ou telefone; no telefone, escolhe SMS ou WhatsApp → digita e valida o código → revisa o que será público e privado → envia → recebe o protocolo e o estado da publicação. E-mail leva diretamente à tela do código, com orientação para conferir a caixa de entrada. GPS negado, ponto fora do município, foto ausente ou com falha, dados inválidos, código inválido, falha antes de gravar e publicação pendente têm estados próprios, sem cortar a jornada.

**Visitante:** abre o mapa → aplica filtros → consulta descrição, fotos e etapa de uma denúncia publicada. Não precisa de conta e não vê identidade nem contato.

**Agente:** entra com a conta autorizada → vê o resumo e as Ocorrências mais antigas primeiro → abre o detalhe, confere ocorrências próximas e liga para o morador se precisar → inicia a análise → toca em "Como chegar" e vai ao local → registra a visita. Com acesso, a ocorrência fica Atendida; sem acesso, continua Em análise e, a partir da terceira tentativa, pode ser encerrada. Em qualquer etapa pode ocultar conteúdo inadequado e, depois de revisar, republicar.

**Supervisor:** recebe do agente o relatório do período em PDF ou Word, por e-mail ou mensagem, e assina ou anota no próprio arquivo. Não entra no sistema.

**Correção pelo cidadão:** enquanto a denúncia está Recebida, ele comprova vínculo por mecanismo definido em DEP-08 → corrige os campos → o histórico interno registra a alteração. Depois do início da análise, ele escreve para o e-mail de contato e o administrador avalia o pedido.

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
| Visitas: acesso, tipo do local, foco, depósitos e ações | Não | Sim |
| Motivo da ocultação | Não | Sim |

O relatório para o supervisor traz bairro, endereço e o resultado das visitas, mas nunca nome, CPF, e-mail ou telefone do morador. Depois de baixado, o arquivo fica sob responsabilidade de quem o recebe, como qualquer documento interno da equipe de saúde.

O cidadão com vínculo comprovado acessa os campos que enviou na própria denúncia para corrigi-los, dentro do prazo de D26. Esse acesso não torna os dados públicos e não libera histórico, observações ou dados de outras pessoas.

A separação entre público e privado acontece nos dados que o serviço devolve; esconder campos só na tela não basta. Nomes de tabelas e contratos estão em [ARCHITECTURE.md](./ARCHITECTURE.md), e as regras de proteção em [SECURITY.md](./SECURITY.md). Confirmar e-mail ou telefone não autentica o CPF nem a identidade civil, e a V1 não tem integração de verificação de identidade.

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
| RNF-08 | Proteção contra abuso | Envio e solicitação/reenvio de códigos por e-mail, SMS ou WhatsApp têm limites no serviço, além do bloqueio do botão |
| RNF-09 | Histórico confiável | Autor e instante vêm da sessão e do serviço; ações simultâneas não apagam registros |
| RNF-10 | Dados pessoais em logs | Logs e métricas não registram CPF, contato, texto livre ou foto sem necessidade operacional definida |
| RNF-11 | Registro de visita em campo | O formulário cabe numa tela de 320 px com rolagem vertical, usa opções de toque de pelo menos 44 px e, se o envio falhar, guarda o preenchimento só no aparelho até nova tentativa ou descarte |
| RNF-12 | Relatório sem dados do morador | Arquivo gerado no navegador, sem servidor de terceiros; testes conferem que PDF e Word não contêm nome, CPF, e-mail ou telefone |

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
| Tempo até a visita | Intervalo entre o recebimento e a primeira visita registrada |
| Visitas com foco | Parte das visitas com acesso em que o agente encontrou foco |
| Depósitos com foco | Contagem por tipo, de A1 a E, por bairro |
| Visitas sem acesso | Tentativas por motivo (fechado, recusado, não encontrado) e ocorrências Encerradas |

Esses números também alimentam o relatório do agente (RF-AGE-08).

O dashboard da fase seguinte usa a mesma base. As decisões de leitura já tomadas estão registradas abaixo, mas não antecipam a entrega do dashboard na V1. As contagens não geram prioridade automática, mapa de casos, metas epidemiológicas ou promessa de redução da doença.

### 14.1 Direção já decidida para o dashboard após a V1

- A prioridade é mostrar a evolução do volume de denúncias no tempo, com igual atenção a computador e celular. O filtro global de período é uma caixa de seleção com **Semana, Mês e Personalizado**; a opção Dia foi retirada. Semana tem sete posições, de segunda a domingo; dias futuros aparecem sem dado, nunca como zero. O mês atual vai só até a data da consulta; Personalizado usa início e fim informados.
- O período e o bairro escolhidos restringem indicadores e gráficos. Com todos os bairros, há ranking por mais denúncias ou maior aumento. Maior aumento usa diferença absoluta como ordem e percentual como complemento; base anterior zero não gera percentual, e ausência de crescimento é informada sem incluir quedas.
- A comparação começa desligada. Ligada, sobrepõe dois períodos diferenciados visualmente e mostra os dois valores e datas no balão por hover, foco ou toque; desligada, mostra apenas uma série e um valor. Semana compara apenas dias já decorridos com os mesmos dias da semana anterior; Personalizado compara o intervalo imediatamente anterior de mesma duração; meses de durações diferentes comparam só os dias comuns, identificando o dia extra fora da variação. O intervalo comparado deve estar explícito.
- Indicadores, pontos do gráfico e bairros levam à lista de Ocorrências com o recorte correspondente. Pendências antigas permanecem em Ocorrências; visitas realizadas, últimas visitas e tempo até atendimento não compõem esse painel.

As primeiras prévias do dashboard usavam três etapas e a igualdade "Recebidas = Em análise + Atendidas". A decisão posterior D12/D29 introduziu **Recebida** como etapa atual e **Encerrada** como resultado final; aquela igualdade e os gráficos de três etapas não são regras vigentes. Antes de implementar o dashboard, ajustar indicadores e filtros às quatro etapas, sem contar a mesma denúncia duas vezes. A prévia visual com dados fictícios não valida essas contas em produção.

## 15. Plano de validação e rastreabilidade

| Cenário | Critério verificável | Requisitos |
|---|---|---|
| AC-01 · Envio válido | A partir de Início, preenche localização, foco, fotos, nome, CPF, e-mail e telefone; escolhe e confirma um código por e-mail, SMS ou WhatsApp após os dados; revisa, envia, recebe protocolo e encontra o registro gravado. Cada um dos três canais é exercitado | RF-AUT-01, RF-DEN-01 a RF-DEN-04 |
| AC-02 · Entrada inválida | Contato obrigatório ausente ou malformado, código ausente/inválido/expirado, campo ausente, foto inválida e ponto fora do território não finalizam o envio; falha de entrega e reenvio preservam o formulário e respeitam os limites do serviço | RF-AUT-01, RF-DEN-01 a RF-DEN-03, RNF-08 |
| AC-03 · GPS negado | A pessoa marca o ponto manualmente e segue sem perder dados | RF-DEN-02 |
| AC-04 · Rede e reenvio | Falha antes ou depois da gravação e envio repetido resultam em no máximo um registro por tentativa; limites de repetição aplicados no serviço | RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08 |
| AC-05 · Publicação pendente | Gravação confirmada com mapa pendente mantém o protocolo e o acesso do agente | RF-DEN-05 |
| AC-06 · Mapa e filtros | Visitante vê os campos permitidos, filtros coerentes e denúncias atendidas; erro não vira zero; limites de consulta e paginação respeitados | RF-MAP-01, RF-MAP-02, RF-AGE-01, RNF-07 |
| AC-07 · Privacidade | API, URLs e metadados públicos não trazem dados privados nem ponto exato; logs e métricas também não | RF-MAP-01, RNF-05, RNF-10 |
| AC-08 · Permissões | Visitante e conta revogada não leem dados privados nem alteram ocorrências | RF-AUT-02, RNF-03 |
| AC-09 · Atendimento | Leitura não muda a etapa; visita com acesso exige os campos da seção 8.1 e leva a Atendida; data inválida é recusada; Atendida não reabre; lista mostra dias em aberto e aviso de ocorrências próximas em 150 m | RF-AGE-01 a RF-AGE-03, RF-AGE-05, RNF-11 |
| AC-10 · Concorrência | Ação antiga ou repetida não sobrescreve transição posterior nem duplica evento ou visita | RF-AGE-02, RF-AGE-03, RF-AGE-07, RNF-09 |
| AC-11 · Ocultação | Retirada interrompe consulta e mídia públicas, mantém o registro interno e resiste a retentativas de publicação | RF-AGE-04, RNF-06 |
| AC-12 · Interfaces | Jornada completa, da tela Início ao resultado, executável nos tamanhos definidos e por teclado; telas e estados de erro sem conteúdo cortado, com textos, ações e navegação alinhados. Na referência visual do Figma, a barra de URL simulada também é uniforme | RNF-01, RNF-02, D35, D36 |
| AC-13 · Republicação | Agente revisa e republica explicitamente; histórico preservado; etapa inalterada; tarefa antiga não desfaz ocultação posterior | RF-AGE-06, RNF-06 |
| AC-14 · Correção autorizada | Administrador corrige em qualquer etapa; cidadão corrige só a própria denúncia e só enquanto Recebida; tentativa do cidadão após o início da análise é recusada; acesso indevido negado; original e motivo preservados; etapa e visibilidade inalteradas | RF-COR-01, RNF-03, RNF-05, RNF-09 |
| AC-15 · Sem acesso e encerramento | Visita sem acesso mantém Em análise e soma tentativa; "Encerrar sem acesso" só a partir da terceira; Encerrada não reabre e aparece no mapa | RF-AGE-03, RF-AGE-07 |
| AC-16 · Relatório | PDF e Word gerados para período e bairro; totais batem com a lista; nenhum dado de identificação do morador; período vazio tratado | RF-AGE-08, RNF-12 |

Os testes começam com dados fictícios e serviços de teste. Cada execução registra a versão testada, o resultado e as limitações encontradas. Capturas do Figma não substituem esses cenários. O passo a passo de cada cenário está em [TEST_PLAN.md](./TEST_PLAN.md). A etapa com moradores reais só começa depois que as dependências de lançamento estiverem resolvidas.

## 16. Entregas

| Entrega | Resultado demonstrável |
|---|---|
| E1 · Estrutura e navegação | HTML, CSS e JavaScript das telas, com entrada do formulário, mapa e área dos agentes |
| E2 · Dados fictícios compartilhados | Formulário, mapa e Ocorrências usando o mesmo contrato de dados |
| E3 · Envio integrado | Confirmação por e-mail, SMS ou WhatsApp após os dados do cidadão, fotos, gravação, protocolo e recuperação de falhas |
| E4 · Público e agente | Área aproximada, autorização, registro de visita, encerramento sem acesso, relatório, ocultação e correção |
| E5 · Aceite da V1 | Evidências de AC-01 a AC-16 e preparação da operação |
| E6 · Evolução | Dashboard, gráficos e melhorias priorizadas pelo uso |

As primeiras atividades de HTML já combinadas são, nesta ordem, a página da denúncia (`registrar-foco.html`), Início, Jogo e Guia Aedes. A ordem é didática e não muda a jornada do cidadão, que começa em Início (D35). Jogo e Guia não bloqueiam o fluxo operacional. A divisão dessas entregas em tarefas numeradas está em [TASKS.md](../TASKS.md).

## 17. Riscos assumidos

| Risco | Efeito | Tratamento na V1 |
|---|---|---|
| Publicação automática | Foto ou descrição pode identificar alguém por acidente | Aviso no formulário, ocultação e conferência diária; a revisão prévia foi adiada de propósito |
| CPF obrigatório | Aumenta o volume de dados pessoais guardados sem comprovar identidade | Mantido por decisão de produto (D07); finalidade e proteção definidas em DEP-06 |
| Dois contatos obrigatórios | Amplia a coleta de dados pessoais; SMS e WhatsApp podem ter custo, falha de entrega e abuso | Uso e retenção em DEP-06; provedores, limites e custo em DEP-03 e DEP-07 |
| Adesão dos agentes | Contas ativas não comprovam disponibilidade nem vínculo oficial | Sem promessa de prazo; vínculo formalizado em DEP-04 |
| Representação do território | Imagem, texto e contexto podem revelar o local apesar da aproximação | Método testado em áreas pouco povoadas (DEP-02) |
| Abuso e volume | Lançamento aberto pode receber envios indevidos ou acima do esperado | Limites no serviço (RNF-07, RNF-08) |
| Serviços externos de mapa e mensagens | Falhas fora do controle da equipe | Mensagens de erro e recuperação sem confirmação falsa; escolha de provedores em DEP-03 e DEP-07 |
| Mapa antigo do wireframe | A imagem escolhida para a prévia mostra Itambé/BA, não o território de Itambé/PE | Uso apenas ilustrativo no Figma; cartografia real e contorno municipal em DEP-01 e DEP-07 |
| Ausência de agentes | Fila cresce e a retirada de conteúdo demora | Recebimento mantido (D23); responsável pela conferência e pelo e-mail em DEP-05 |
| Retenção e custo | Guardar fotos por tempo indefinido pressiona armazenamento e orçamento | Estimativa de volume e teto de custo em DEP-07 |

Esses riscos fazem parte do produto escolhido. Mudanças como moderação prévia, retirada do CPF ou restrição a convidados exigem nova decisão registrada neste PRD.

## 18. Dependências de implementação e lançamento

| ID | O que precisa ser resolvido | Prazo | Responsável |
|---|---|---|---|
| DEP-01 | Catálogo de categorias e limite territorial de Itambé/PE, com fonte e versão. As localidades já estão definidas em D33; faltam o mapa real e o contorno municipal e de cada bairro. A imagem antiga de Itambé/BA é só referência visual (D37) | Antes da validação de território | Produto, agentes e desenvolvimento |
| DEP-02 | Forma e precisão da área aproximada, incluindo divisas e áreas pouco povoadas | Antes de publicar pontos reais | Produto e desenvolvimento |
| DEP-03 | Provedores de código por e-mail, SMS e WhatsApp; custo, consentimento aplicável, entrega, expiração, reenvio, limites contra abuso e tratamento de arquivos. Nenhuma prévia comprova que mensagens reais foram entregues | Antes da integração real do envio | Desenvolvimento, produto e operação |
| DEP-04 | Nome da instituição parceira, formato do vínculo e confirmação do uso pelos agentes | Antes do lançamento | Administrador e instituição parceira |
| DEP-05 | Responsável e substituto pela conferência diária; criação e acompanhamento do e-mail de contato | Antes de publicar conteúdo real | Administrador e operação |
| DEP-06 | Adequação à LGPD (Lei nº 13.709/2018): finalidade do CPF, base legal, controlador e encarregado, aviso de privacidade, atendimento aos direitos do titular e política de retenção por tipo de dado | Antes de coletar dados reais | Administrador, instituição parceira e operação |
| DEP-07 | Provedor de mapa, estimativa de volume e custo, teto financeiro e comportamento ao atingir cotas | Antes do ambiente público | Administrador, instituição parceira e desenvolvimento |
| DEP-08 | Mecanismo de correção pelo administrador e pelo cidadão, comprovação do vínculo quando a denúncia confirmou e-mail, SMS ou WhatsApp, troca de contato confirmado, trilha de alterações e recuperação segura de acesso | Antes da integração da correção | Administrador e desenvolvimento |
| DEP-09 | Período e critérios de avaliação do piloto | Antes da avaliação de resultados | Produto e agentes participantes |
| DEP-10 | A quem pertencem os dados no envio em nome de terceiros, no envio assistido e no envio por menores de idade | Antes de implementar essa modalidade | Administrador, instituição parceira e operação |
| DEP-11 | Encerramento de denúncias falsas ou improcedentes que não exigem visita | Antes de tratar esses casos no piloto | Administrador e agentes |
| DEP-12 | Obrigatoriedade do endereço digitado | Antes de fechar o formulário (E3) | Produto |
| DEP-13 | Filtros que aparecem nas telas e não estão em RF-MAP-02 (origem, tipo, distrito, rua e área): entrar no PRD ou sair das telas | Antes dos filtros do mapa (TASK-046) | Produto |
| DEP-14 | Confirmar com a coordenação que o aviso de D34 é um raio de 150 m; o pedido original falava em "150 metros quadrados" | Antes do aviso de ocorrências próximas (TASK-051a) | Produto e agentes |

DEP-10 a DEP-14 são decisões de produto em aberto; as demais são preparação técnica ou operacional. Esta é a lista única de pendências do projeto: os outros documentos citam o ID em vez de repetir o texto. Nenhuma delas impede o trabalho com dados fictícios.

## 19. Definição de pronto

**Documento:** decisões registradas, requisitos com critério de aceite, dados e permissões definidos, rastreabilidade completa e dependências identificadas na seção 18.

**V1 técnica:** cenários AC-01 a AC-16 demonstrados na versão candidata. Dashboard e recursos complementares não entram nesse aceite.

**Abertura para moradores:** dependências de lançamento resolvidas, contas de agentes funcionando, ocultação testada, custos acompanhados e comunicação clara sobre o papel do serviço. Esse marco não substitui parecer jurídico, aprovação municipal ou avaliação de impacto sanitário.

## 20. Referências e precedência

1. Decisões do responsável pelo produto: publicação automática, dados privados, CPF obrigatório, dashboard posterior e prazo de correção pelo cidadão (D01 a D26).
2. Notas internas de contexto e o roteiro de aprendizagem do projeto, mantidos fora do repositório.
3. [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), com as telas finais, e [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65), para o planejamento das tarefas.
4. Levantamento com a coordenação de endemias de Itambé: ficha em papel Registro Diário do Serviço Antivetorial (PNCD), lista de bairros, cobertura por ciclo e período de retorno. Origem de D27 a D34.
5. Decisões do responsável pelo produto sobre a jornada da denúncia: confirmar um canal depois de informar e-mail e telefone, escolher entre e-mail, SMS e WhatsApp, começar pela tela Início, usar telas inteiras e reaproveitar o mapa antigo só como imagem ilustrativa. Origem de D35 a D37.

Em conflito com telas antigas ou recomendações anteriores, valem as decisões deste PRD. Mudanças futuras registram o motivo no histórico abaixo.

## 21. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 04/11/2026 | Primeiro rascunho do PRD e do Start Técnico (PR #2) |
| 0.2 | 04/11/2026 | Estrutura do documento e decisões da entrevista de produto |
| 1.0 | 05/11/2026 | Critérios por requisito, campos e acessos, etapas de atendimento e publicação, rastreabilidade e dependências de lançamento |
| 1.1 | 05/11/2026 | Visita obrigatória para Atendida, observações durante a análise, sem reabertura, republicação pelo agente, responsabilidades e preferências de retenção e custo |
| 1.2 | 05/11/2026 | Correção liberada ao administrador e ao cidadão responsável pelo envio; responsabilidades descritas por papel |
| 2.0 | 05/11/2026 | Texto revisado em tom corporativo; glossário; aviso epidemiológico restaurado no resumo; D26 limita a correção do cidadão à etapa Recebida; especificações propostas incorporadas aos requisitos; papel "operador" substituído por agente autorizado; permissões separadas por perfil; riscos em tabela; LGPD explícita em DEP-06; DEP-12 para o endereço digitado; estado do repositório atualizado para `f403ef5`; telas do Figma registradas como concluídas |
| 2.1 | 11/11/2026 | Arquivo renomeado para `PRD.md` na nova estrutura de documentação; seção Visão do produto; estado da implementação movido para MEMORY.md; referências a ARCHITECTURE, DESIGN, TASKS, TEST_PLAN e SECURITY |
| 2.2 | 12/11/2026 | MVP do agente a partir do levantamento com a coordenação: ficha do PNCD não digitalizada (D27); registro de visita com campos de toque (seção 8.1, RF-AGE-03); etapa Encerrada após três tentativas sem acesso (RF-AGE-07); relatório em PDF e Word para o supervisor (RF-AGE-08); uma conta de agente na V1; 15 bairros; aviso de ocorrências próximas em 150 m; lista com resumo, dias em aberto e mapa interno; RNF-11, RNF-12, AC-15 e AC-16 |
| 2.3 | 14/11/2026 | Fluxo cidadão completo da tela Início ao protocolo; e-mail e telefone obrigatórios; código depois dos dados, com escolha de e-mail ou telefone e, no telefone, SMS ou WhatsApp; revisão, estados de erro e telas completas; mapa antigo mantido só como referência visual com ressalva de Itambé/BA; correção do cidadão vinculada a mecanismo seguro ainda a definir para os três canais; decisões anteriores do dashboard pós-V1 registradas com conflito da contagem antiga explicitado; DEP-13 e DEP-14 reúnem as pendências que estavam espalhadas em TASKS e MEMORY; documentos derivados alinhados a esta versão |
