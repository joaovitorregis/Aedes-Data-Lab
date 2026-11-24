# Aedes Data Lab: Documento de Requisitos de Produto (PRD)

| Campo | Valor |
|---|---|
| Versão | 2.9 · 22/11/2026 |
| Território | Itambé, Pernambuco |
| Responsável pelo documento | Responsável pelo produto |
| Público | Produto, design, desenvolvimento, testes e agentes participantes |
| Documentos relacionados | [Arquitetura](./ARCHITECTURE.md) · [Design](./DESIGN.md) · [Regras](./RULES.md) · [Tarefas](../TASKS.md) · [Plano de testes](./TEST_PLAN.md) · [Segurança](./SECURITY.md) |

## Visão do produto

| Item | Definição |
|---|---|
| Produto | Aedes Data Lab |
| Problema | Moradores de Itambé/PE não têm um canal simples para relatar focos do mosquito da dengue, e os agentes não recebem esses relatos com localização, fotos e histórico organizados |
| Usuários | Moradores que registram denúncias; visitantes que consultam o mapa; agentes de endemias autorizados |
| Objetivo | Levar cada denúncia do celular do morador até a fila dos agentes e ao mapa público, protegendo os dados pessoais |
| Plataforma | Site em HTML, CSS e JavaScript sem framework. O backend é o Supabase: banco de dados Postgres, arquivos, login dos agentes e funções de servidor (D38) |
| Funcionalidades principais | Registro de denúncia com confirmação do contato escolhido após os dados do cidadão; mapa público com filtros; área de Ocorrências dos agentes com registro de visita e relatório; arquivamento e correção de denúncias; registro de foco encontrado pelo agente em local sem denúncia |
| MVP (V1) | Envio com fotos e ponto no mapa, protocolo, mapa com área aproximada, login de agente, análise com registro de visita, encerramento após três tentativas sem acesso, registro de foco em local sem denúncia, relatório em PDF e Word, arquivamento, volta ao mapa e correção (seções 6 e 9) |
| Fora do escopo | Dashboard e gráficos, chat, notificações, conta do cidadão, agenda de visitas, digitalização da ficha de campo do PNCD, casos confirmados de dengue, comércio e produção de repelente (seção 6.1) |
| Critérios de sucesso | Cenários AC-01 a AC-17 demonstrados na versão candidata (seção 15 e [TEST_PLAN.md](./TEST_PLAN.md)) |

## 1. Resumo executivo

O Aedes Data Lab é uma plataforma web em que moradores de Itambé/PE registram possíveis focos do mosquito da dengue. Cada denúncia traz o ponto do foco, fotos, uma descrição e a identificação de quem enviou, que fica restrita à equipe. Assim que o recebimento é confirmado, a denúncia entra na fila dos agentes e uma versão pública, com localização aproximada, aparece no mapa.

Os agentes usam login individual; a V1 opera com uma conta de agente. Na área de Ocorrências o agente vai ao local e inicia a análise, que já abre o registro da visita, e responde com poucos toques: se teve acesso, o que encontrou e o que fez. A visita com acesso conclui a ocorrência; sem acesso, ela continua em análise e pode ser encerrada depois da terceira tentativa. Quando encontra foco num local que ninguém denunciou, o agente registra a visita e ela vira uma ocorrência feita por agente (D51). O agente também baixa um relatório do período em PDF ou Word para enviar ao supervisor e pode arquivar uma denúncia, tirando-a do mapa, e devolvê-la ao mapa depois. Não existe tela de administrador: a equipe do projeto cria e libera as contas dos agentes direto no Supabase. O agente também corrige os dados de qualquer denúncia, com motivo. O cidadão que enviou também pode corrigir a sua, enquanto ela ainda não entrou em análise.

O produto mostra à equipe e à população onde há relatos. **Denúncias não equivalem a casos confirmados de dengue nem comprovam risco epidemiológico.**

A V1 precisa entregar o caminho inteiro: **envio → gravação → mapa público → Ocorrências dos agentes → atualização do atendimento**. Dashboard e gráficos ficam para a fase seguinte. O lançamento será aberto a qualquer morador, sem lista de convidados, e o recebimento continua mesmo quando nenhum agente estiver disponível por alguns dias. A equipe do projeto aprova a abertura e responde pela manutenção, em conjunto com uma instituição parceira que ainda será formalizada (DEP-04).

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
| Ocorrência | A denúncia tratada na área dos agentes, ou o registro que o agente cria ao encontrar foco em local sem denúncia (D51) |
| Origem | Quem criou a ocorrência: cidadão ou agente de endemias. Aparece na área dos agentes e, no mapa público, só como "feita por cidadão" ou "feita por agente", sem o nome (D50) |
| Publicação | Versão pública da denúncia no mapa, apenas com os campos permitidos |
| Protocolo | Código gerado pelo serviço depois que a denúncia foi gravada; comprova o recebimento |
| Etapa de atendimento | Recebida, Em análise, Atendida ou Encerrada |
| Visita | Ida do agente ao local de uma ocorrência, registrada com data, acesso e resultado (seção 8.1) |
| Tentativa sem acesso | Visita em que o agente não conseguiu inspecionar o local: imóvel fechado, morador recusou ou local não encontrado |
| Encerrada | Etapa final de uma ocorrência que não recebeu inspeção: encerrada sem acesso depois de três tentativas ou arquivada pelo agente por ser falsa ou improcedente; não equivale a Atendida |
| Relatório | Arquivo em PDF ou Word, gerado pelo agente, com as visitas e os totais de um período, para o supervisor |
| Ficha de campo | Registro Diário do Serviço Antivetorial do PNCD, preenchido em papel na rotina dos ciclos; não é digitalizado pelo Aedes Data Lab |
| Estado de publicação | Pendente, Publicada ou Arquivada |
| Lixeira | Período de 30 dias em que uma denúncia arquivada pode voltar ao mapa; depois dele, é removida de vez (D44) |
| Agente autorizado | Pessoa com login individual liberado pela equipe do projeto para a área de Ocorrências |
| Equipe do projeto | Programadores responsáveis pelo produto. Criam, liberam e revogam as contas dos agentes e trocam o contato confirmado direto no Supabase, sem tela; aprovam a abertura pública. Não é um papel dentro do sistema (D22) |
| Cidadão responsável pelo envio | Quem enviou a denúncia e comprova o vínculo com ela por mecanismo seguro; o contato confirmado no envio é registrado, e o acesso é recuperado por código enviado a esse contato (D42) |

## 4. Contexto e estado atual

O Aedes Data Lab precisa reunir relatos com informação suficiente para o trabalho dos agentes e dar à população uma visão pública do que foi relatado. A adesão institucional ainda não foi formalizada.

**Rotina atual dos agentes (levantamento de 12/11/2026):** a coordenação de endemias de Itambé trabalha por imóveis visitados em ciclos, com retorno a cada 45 a 48 dias. Com o déficit de agentes, cada ciclo alcança cerca de 60% dos imóveis. Em campo, o agente preenche em papel a ficha Registro Diário do Serviço Antivetorial do PNCD (quarteirão, logradouro, tipo de imóvel, pendência, depósitos A1 a E, amostras e tratamento). O Aedes Data Lab não substitui essa ficha (D27): ele cuida da demanda que chega pelo morador, para que o agente veja a ocorrência, vá ao local e registre a providência. Na V1 o agente também registra o foco que encontra em local sem denúncia (D51); as visitas de rotina sem foco continuam só na ficha. A coordenação informou os 15 bairros atendidos (D33) e poucos casos confirmados de dengue e chikungunya em 2026; casos confirmados ficam fora do produto.

A experiência é pensada primeiro para o celular e precisa funcionar bem no computador. Quatro integrantes constroem HTML, CSS e JavaScript das telas. Banco de dados e integrações serão aprendidos em conjunto com a coordenação do projeto, e essa ordem de aprendizagem não altera os critérios de aceite.

O andamento da implementação é registrado em a seção Estado do projeto de [TASKS.md](../TASKS.md), que é atualizada a cada entrega. As páginas Meu trabalho, Mapa técnico e Dashboard já existem no repositório como espaço reservado, fora do aceite da V1 (seção 6.1).

**Design:** a referência visual é o [Figma](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y/Aedes-Data-Lab-%C2%B7-Wireframes-por-p%C3%A1gina?node-id=2014-13), página "Fluxo de telas · Jornada do Usuário". A denúncia segue o fluxo da seção 02 dessa página (D35, D36); a versão anterior fica arquivada fora da jornada, só para consulta. A área do agente segue a seção "Jornada do agente · telas e conexões" da mesma página. As telas simulam código, envio, protocolo e publicação e não comprovam serviço implementado. As exportações em `wireframes/` são anteriores a esse fluxo. O estado atual do arquivo fica na seção Estado do projeto de [TASKS.md](../TASKS.md).

## 5. Decisões de produto

| ID | Decisão |
|---|---|
| D01 | A V1 inclui denúncia gravada, mapa público, lista e detalhe de Ocorrências e atualização do atendimento pelos agentes. |
| D02 | O lançamento é aberto a moradores reais, sem grupo fechado de convidados. |
| D03 | Foto e descrição são publicadas automaticamente, sem aprovação prévia de agente. |
| D04 | Agente autorizado pode arquivar uma denúncia, com motivo, tirando-a do mapa e preservando o registro interno enquanto ela está na lixeira (D44). Ocultar deixou de existir como ação separada (D48). Antes da abertura pública haverá um responsável e uma rotina diária de conferência. |
| D05 | Botão público para sinalizar conteúdo e análise automática de fotos ficam fora da V1. |
| D06 | Nome, e-mail e telefone são obrigatórios no formulário. O cidadão confirma por código apenas o canal escolhido naquela denúncia: e-mail ou, quando ativos (D45), telefone por SMS ou WhatsApp. Nenhum desses campos aparece no mapa, nem de forma parcial. |
| D07 | O CPF não é coletado nem guardado. Digitar o CPF nunca comprovou a identidade de ninguém e aumentaria o dado pessoal guardado; nome, e-mail e telefone continuam obrigatórios, e o produto não anuncia identidade verificada. |
| D08 | A confirmação do contato acontece depois de preencher os dados do cidadão e antes da revisão e do envio. A confirmação de uma denúncia não vale para outra. A V1 não tem conta permanente nem histórico pessoal. |
| D09 | O público vê a localização aproximada; agentes autorizados veem o ponto exato. |
| D10 | Só são aceitas denúncias dentro de Itambé/PE. O mapa pode ser navegado fora do município, o envio não. |
| D11 | Cada agente tem login individual liberado pela equipe do projeto. Todos os agentes autorizados consultam todas as ocorrências de Itambé e os dados privados, inclusive nome, e-mail e telefone. |
| D12 | Etapas de atendimento: Recebida → Em análise → Atendida ou Encerrada. Abrir o detalhe não muda a etapa; iniciar a análise é uma ação explícita, que já abre o registro da visita (D52). |
| D13 | Para marcar como Atendida, o agente precisa ter ido ao local e analisado a situação, registrando a visita com acesso (D28). A resposta ao cidadão é a atualização da ocorrência, sem mensagem individual. |
| D14 | Se a gravação funcionar e a publicação falhar, o cidadão recebe o protocolo e o aviso de publicação pendente. |
| D15 | Dashboard e gráficos vêm depois da V1. Contagens representam relatos e não classificam risco automaticamente. |
| D16 | Repelentes é conteúdo educativo. Chat, comércio, pedidos e produção ficam fora da V1. |
| D17 | Quando não consegue resolver ou não consegue acesso ao local, o agente mantém a ocorrência Em análise e registra a tentativa ou observações internas. |
| D18 | Ocorrências Atendidas ou Encerradas não são reabertas. Conclusão por engano ou reaparecimento do problema exige nova denúncia. |
| D19 | O agente pode devolver ao mapa uma ocorrência arquivada depois de revisá-la, dentro do prazo da lixeira (D44). Arquivar não apaga o registro de imediato. |
| D20 | O agente autorizado corrige os campos de qualquer denúncia, em qualquer etapa, com motivo e histórico, menos o contato confirmado (D42). O cidadão responsável pelo envio corrige apenas a própria, dentro do prazo definido em D26. |
| D21 | Quem denuncia é a pessoa que viu o foco, com os próprios dados. O sistema não verifica a quem os dados pertencem, então alguém pode informar dados de outra pessoa; esse risco é aceito na V1. O código de confirmação comprova só que a pessoa controla o contato. |
| D22 | Não existe tela nem papel de administrador na V1. A equipe do projeto cria, libera, revoga e recupera as contas dos agentes direto no Supabase, aprova a abertura pública e assume a manutenção. A responsabilidade pelo serviço é compartilhada com uma instituição parceira a formalizar (DEP-04). |
| D23 | A falta de agentes por vários dias não suspende o recebimento. Haverá um e-mail de contato para reclamações, pedidos de correção e retirada de conteúdo (DEP-05). |
| D24 | As informações devem ser preservadas por prazo indefinido, sem perda de histórico, exceto as denúncias arquivadas, que são removidas depois de 30 dias na lixeira (D44). A política por tipo de dado será formalizada em DEP-06. |
| D25 | O custo de operação deve ser baixo. O custo zero é o ideal, mas pagar um valor pequeno é aceito, por exemplo o plano pago do Supabase ou da hospedagem. Ainda não há teto financeiro definido (DEP-07). |
| D26 | O cidadão corrige a própria denúncia somente enquanto ela estiver Recebida. Depois que entra Em análise, ele pede a correção pelo e-mail de contato (D23) e o agente decide se aplica. |
| D27 | A ficha de campo do PNCD (Registro Diário do Serviço Antivetorial) não é digitalizada. O Aedes Data Lab registra a visita feita para atender a denúncia e, na V1, o foco que o agente encontra em local sem denúncia (D51). As perguntas usam as mesmas palavras do formulário do cidadão, sem os códigos da ficha (D53). As visitas de rotina sem foco continuam só no papel. |
| D28 | A conclusão acontece pelo registro de visita. Visita com acesso leva a Atendida; visita sem acesso (imóvel fechado, morador recusou ou local não encontrado) mantém Em análise e conta uma tentativa. "Programar visita" sai da V1. |
| D29 | A partir da terceira tentativa sem acesso, o agente pode encerrar a ocorrência na etapa Encerrada, por ação explícita. Encerrada é final e não se confunde com Atendida. |
| D30 | Sobre tratamento, a V1 registra apenas se houve larvicida aplicado. Tipo de produto, quantidade em gramas e depósitos tratados ficam fora. |
| D31 | A V1 opera com uma única conta de agente, individual. Todo evento continua gravando o autor, para que novas contas possam ser liberadas sem mudar o modelo. O supervisor não usa o sistema. |
| D32 | O agente gera um relatório do período em PDF ou Word para enviar ao supervisor. O relatório não traz nome, e-mail ou telefone do morador. |
| D33 | As localidades da V1 são os 15 bairros informados pela coordenação: Altiplano, Boa Vista, Gildo Andrade, Jardim Bela Vista, Loteamento Figueiredo, Luís Gonzaga, Maracujá, Novo Itambé, Novo Itambé II, Parque das Palmeiras, Pedra Bela, Planalto, Salgadeira, Santa Maria e Vila Cohab. Não há bairro "Centro". |
| D34 | O detalhe da ocorrência avisa quando há outras denúncias num raio de 150 metros do ponto exato, distância em linha reta que corresponde ao alcance médio de voo do mosquito (100 a 150 m). O aviso não funde nem descarta ocorrências. |
| D35 | A jornada de denúncia começa na tela Início: o cidadão escolhe denunciar, informa localização, descreve o foco e anexa fotos, preenche seus dados, confirma o contato escolhido, revisa o que será público e privado, envia e recebe o resultado. Estados de erro e publicação pendente pertencem à mesma jornada. |
| D36 | O fluxo visual atualizado substitui a versão antiga como referência de implementação. Usa telas inteiras, conteúdo sem cortes, textos e ações alinhados, navegação em posição consistente e barra de URL simulada uniforme. Estados alternativos ficam próximos da etapa a que pertencem; as telas antigas servem apenas como histórico. |
| D37 | Na prévia do Figma, o mapa da tela de localização reaproveita a imagem da versão anterior por escolha visual do responsável. Essa imagem mostra Itambé/BA e não serve como mapa, contorno territorial ou validação de ponto para Itambé/PE. A cartografia real depende de DEP-01 e DEP-07 antes do uso com moradores. |
| D38 | O backend do produto é o Supabase: banco de dados Postgres, armazenamento de arquivos, login dos agentes e funções de servidor. O site é HTML, CSS e JavaScript sem framework. Como o serviço é construído está em [ARCHITECTURE.md](./ARCHITECTURE.md), e o motivo da escolha em [ARCHITECTURE.md, seção 9](./ARCHITECTURE.md#9-decisões-técnicas-adr). |
| D39 | O endereço digitado (rua, avenida ou logradouro) é obrigatório no envio. É privado e não substitui o ponto marcado no mapa. |
| D40 | O mapa público tem só três filtros: localidade, período e etapa. Origem, tipo, distrito, rua e área não fazem parte da V1, e as telas que os mostravam saem do Figma. |
| D41 | O agente confere a denúncia falsa ou improcedente no painel e decide entre seguir com ela ou arquivá-la. Arquivar em Recebida ou Em análise leva a ocorrência a Encerrada, com motivo, não exige visita e tira a denúncia do mapa; ela segue o prazo da lixeira (D44). Em Atendida ou Encerrada, arquivar só tira do mapa (D49). |
| D42 | O cidadão recupera o acesso para corrigir a própria denúncia informando o protocolo e confirmando um código enviado ao contato que confirmou no envio. A resposta é a mesma para protocolo inexistente ou sem vínculo. Trocar o contato confirmado só a equipe do projeto faz, direto no Supabase, a pedido pelo e-mail de contato (D23); o agente não troca. |
| D43 | O mapa público mostra cada denúncia como a célula de uma grade fixa de cerca de 200 m, nunca como ponto. Denúncias na mesma célula mostram a mesma área. O ponto exato só é lido pelos agentes. |
| D44 | Arquivar funciona como lixeira: a publicação sai do mapa e das mídias públicas, e o agente pode devolvê-la ao mapa em até 30 dias. Passado o prazo sem volta ao mapa, a denúncia é removida definitivamente do banco de dados e das fotos, com dados privados, visitas e histórico. É a exceção a D24. As demais denúncias, com suas visitas, ficam no banco por prazo indefinido, para que ocorrências antigas continuem consultáveis. O prazo de 30 dias vale para qualquer etapa, inclusive Atendida e Encerrada (D49): passado o prazo, as visitas já feitas também são removidas (confirmado em 16/11/2026). |
| D45 | A V1 garante o código de confirmação por e-mail. SMS e WhatsApp só ficam ativos se o custo e o prazo de contratação forem aceitáveis (DEP-03); enquanto não estiverem, a tela de canal os mostra como "em breve" e o código vai só por e-mail. O telefone continua obrigatório em qualquer caso, mas só é confirmado quando o seu canal estiver ativo. |
| D46 | O site é hospedado na Vercel. Os dados e as funções de servidor ficam no Supabase (D38). |
| D47 | O mapa público mostra uma prévia curta ao tocar no ponto ou no cartão: categoria, bairro, data, etapa, a primeira foto, a descrição pública e se a ocorrência foi feita por cidadão ou por agente, sem o nome de ninguém (D50). A V1 não tem página de detalhe completo da denúncia pública. |
| D48 | Ocultar e arquivar são a mesma ação, chamada Arquivar. Não existe mais "ocultar publicação" nem o estado Oculta: a denúncia arquivada sai do mapa e das mídias públicas e fica na lixeira (D44). Voltar ao mapa é a ação inversa e não muda a etapa. |
| D49 | Arquivar vale em qualquer etapa. Em Recebida ou Em análise, a ocorrência passa a Encerrada; em Atendida ou Encerrada, a etapa não muda e a denúncia só sai do mapa. |
| D50 | Toda ocorrência registra a origem: feita por cidadão ou feita por agente. A área dos agentes mostra a origem e os dados de quem fez; o mapa público mostra só "feita por cidadão" ou "feita por agente", nunca o nome. |
| D51 | Não existe cadastro de imóveis, então toda visita sem denúncia é em um local novo. Na V1, o agente registra visita sem denúncia só quando encontra foco. O registro cria uma ocorrência feita por agente, já Atendida, que aparece no mapa público com foto e descrição como as outras. Visitas de rotina sem foco ficam fora da V1. |
| D52 | Iniciar a análise e registrar a visita são um passo só para o agente: na ocorrência Recebida, "Iniciar análise" marca a etapa Em análise e abre o registro da visita, sem confirmação no meio. Se o agente sair sem gravar a visita, a ocorrência fica Em análise, em nome dele, com o botão "Registrar visita"; nada do formulário fica salvo (confirmado em 16/11/2026). |
| D53 | As perguntas da visita são as mesmas da denúncia do cidadão, com as mesmas palavras e sem códigos: onde está o foco (Residência, Comércio, Terreno baldio ou Outro local, em que a pessoa digita qual), se há água acumulada, em que recipiente ou estrutura a água está e se há larvas ou pupas. |
| D54 | O resumo no topo de Ocorrências acompanha os filtros aplicados. |
| D55 | Erros de rede, de sessão e de carregamento na área do agente usam uma única tela, discreta, com a ação de tentar de novo. |
| D56 | O relatório separa as denúncias de cidadãos dos registros de agentes e as ocorrências Encerradas sem acesso das Arquivadas, e conta os recipientes com água pelos nomes do formulário. |

## 6. Objetivos e escopo da V1

A V1 precisa levar uma denúncia até os agentes e ao mapa público sem expor os campos privados. Cada resultado abaixo tem uma evidência de entrega:

| Resultado | Evidência de entrega |
|---|---|
| Recebimento confiável | Protocolo exibido na confirmação e registro presente após recarregar |
| Visibilidade pública | A mesma denúncia no mapa, com área aproximada e só os campos permitidos |
| Operação do agente | Conta autorizada abre o detalhe, inicia a análise, registra a visita e baixa o relatório do período |
| Proteção de acesso | Visitante não lê dados privados nem executa ações dos agentes |
| Retirada de publicação | Arquivamento com motivo tira o conteúdo do ar e leva a denúncia à lixeira por 30 dias (D44) |
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
| Registro de foco encontrado pelo agente em local sem denúncia | Incluído (D51) | Registro de toda visita de rotina, com ou sem foco |
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

| Operação | Visitante | Cidadão responsável pelo envio | Agente autorizado |
|---|---|---|---|
| Ver o mapa público | Sim | Sim | Sim |
| Enviar denúncia | Sim, após confirmar o canal escolhido | Sim, uma nova denúncia | Pelo fluxo público; em campo, registra foco em local sem denúncia (RF-AGE-10) |
| Ler campos privados | Não | Só os que enviou na própria denúncia | Todas as ocorrências de Itambé, inclusive nome, e-mail e telefone |
| Corrigir campos enviados | Não | Própria denúncia, enquanto Recebida | Qualquer denúncia, em qualquer etapa, com motivo; menos o contato confirmado |
| Trocar o contato confirmado | Não | Não | Não |
| Iniciar análise, registrar visita e observação, encerrar sem acesso, arquivar | Não | Não | Sim |
| Gerar relatório em PDF ou Word | Não | Não | Sim |
| Devolver ao mapa uma ocorrência arquivada | Não | Não | Sim |
| Ver observações e histórico interno | Não | Não | Sim |
| Liberar, revogar e recuperar contas de agentes | Não | Não | Não |
| Apagar histórico pela interface | Não | Não | Não |

Não existe papel de administrador no sistema. As contas de agente e a troca do contato confirmado são feitas pela equipe do projeto direto no Supabase, fora da interface (D22, D42).

Os agentes autorizados enxergam o município inteiro, sem divisão por equipe ou região. Na V1 existe uma única conta de agente (D31); as regras acima continuam valendo quando outras contas forem liberadas. O supervisor não tem acesso ao sistema e acompanha o trabalho pelo relatório (D32). A permissão de correção do cidadão funciona sem conta permanente e não dá acesso às notas dos agentes, ao histórico interno ou a denúncias de outras pessoas. Corrigir dados é uma ação separada das de análise, atendimento e publicação: não muda etapa nem visibilidade.

## 8. Dados da denúncia

| Campo | Obrigatório | Destino e regra |
|---|---|---|
| Nome | Sim | Privado. Iniciais e apelidos derivados também não são publicados |
| E-mail | Sim | Privado. É confirmado se o cidadão escolher o código por e-mail; informar o endereço não valida a identidade civil |
| Telefone | Sim, com DDD | Privado. É confirmado se o cidadão escolher código por SMS ou WhatsApp, canais que só entram se forem viáveis (D45); informar o número não valida a identidade civil |
| Canal de confirmação | Um por denúncia | Privado. E-mail, SMS ou WhatsApp; registra qual contato foi confirmado, sem tornar o outro confirmado |
| Ponto do foco | Sim | Exato na área dos agentes; aproximado no mapa público |
| Bairro ou localidade | Sim | Público, escolhido entre os 15 bairros de D33 |
| Categoria | Sim | Pública, a partir de catálogo versionado para preservar registros antigos |
| Descrição | Sim | Publicada automaticamente após o recebimento |
| Fotos | De uma a três | Publicadas após tratamento técnico, sem aprovação humana prévia |
| Endereço digitado | Sim (rua, avenida ou logradouro) | Privado. Não substitui o ponto marcado no mapa |
| Referência do local | Não | Privada, para não anular a aproximação pública |
| Protocolo, data e etapa | Gerados pelo serviço | Data e etapa são públicas; o protocolo é o comprovante de recebimento |
| Origem | Gerada pelo serviço | Cidadão ou agente. Pública só como "feita por cidadão" ou "feita por agente"; o nome de quem fez nunca é público (D50) |
| Visitas, observações e autor | Registrados pelo agente | Internos; ver 8.1. Só a etapa resultante vai para o mapa |

O ponto marcado no mapa é a referência espacial exata da denúncia. Endereço e referência ficam privados porque revelariam o local que a área aproximada protege. Categorias, formatos e tamanhos de arquivo e a precisão da área pública serão configurados na implementação.

O produto não coleta CPF (D07) e não verifica a identidade de quem denuncia. O mesmo e-mail ou telefone pode aparecer em denúncias diferentes, e o sistema não limita o número de denúncias por pessoa. Controle de abuso (RNF-08) atua sobre repetição e volume, sem bloquear relatos legítimos.

Antes do envio, o formulário avisa que foto e descrição serão públicas e orienta a evitar rostos, placas e dados pessoais. Como a V1 publica sem revisão prévia, uma foto ou um texto ainda pode identificar alguém. A separação dos campos protege os dados estruturados; para conteúdo indevido encontrado depois, o caminho é o arquivamento.

A ocorrência feita por agente (RF-AGE-10) usa os mesmos campos de local, categoria, descrição e fotos. Não tem nome, e-mail, telefone nem código de confirmação, e registra o agente como autor.

### 8.1 Registro de visita

O agente responde tocando em opções, sem digitar, exceto em "Outro local" e nas observações. As perguntas são as mesmas da denúncia do cidadão, com as mesmas palavras e sem os códigos da ficha do PNCD (D53). Todos os campos são internos.

| Campo | Obrigatório | Valores |
|---|---|---|
| Data da visita | Sim | Hoje por padrão, editável. Não pode ser futura nem anterior ao recebimento |
| Acesso | Sim | Com acesso · Imóvel fechado · Morador recusou · Local não encontrado |
| Onde está o foco | Sim, com acesso | Residência · Comércio · Terreno baldio · Outro local (a pessoa digita qual) |
| Há água acumulada no local | Sim, com acesso | Sim · Não |
| Recipiente ou estrutura com água | Sim, se há água; um ou mais | Pneus · Baldes, bacias ou caixas-d'água · Vasos de planta ou pratos de vaso · Piscinas · Lonas ou coberturas que acumulam água · Lixo ou entulho · Poças ou áreas alagadas · Outro recipiente ou estrutura · Não foi possível identificar |
| Há larvas ou pupas na água | Sim, com acesso | Sim · Não · Não sei |
| O que foi feito no local | Sim, com acesso; uma ou mais | Orientação ao morador · Depósito eliminado · Larvicida aplicado · Amostra coletada · Pedido de bloqueio ou fumacê |
| Observações | Não | Texto livre, até 500 caracteres |
| Autor e momento do registro | Gerados pelo serviço | — |

Na visita sem acesso, o agente informa só a data, o motivo e, se quiser, observações. Quantidade de depósitos, tipo e gramas de larvicida, número da amostra, quarteirão, ciclo e atividade ficam fora (D27, D30). No registro de foco em local sem denúncia (RF-AGE-10) não há pergunta de acesso.

## 9. Requisitos funcionais

### RF-AUT-01 · Confirmar o contato escolhido a cada denúncia

Depois de informar localização, foco, fotos, nome, e-mail e telefone, a pessoa escolhe receber um código por e-mail ou pelo telefone. A opção e-mail avança diretamente à tela do código enviado à caixa de entrada. A opção telefone abre a escolha entre SMS e WhatsApp; só depois de escolher um deles a pessoa avança à tela do código. O código confirma o acesso ao contato escolhido e fica vinculado apenas àquela tentativa de denúncia. O outro contato permanece informado, mas não confirmado. A pessoa pode corrigir o contato correspondente e pedir novo código se ele falhar ou expirar, sem perder o formulário. Essa etapa não vira cadastro com senha. O e-mail é o canal garantido da V1. SMS e WhatsApp só ficam ativos se o custo e o prazo de contratação forem aceitáveis (D45, DEP-03); enquanto não estiverem, a tela de canal mostra os dois como "em breve", o código vai só por e-mail, e o telefone continua obrigatório e informado, mas não confirmado.

**Aceite:** a escolha do canal só aparece depois dos dados do cidadão; e-mail abre a entrada do código sem uma escolha intermediária; telefone oferece SMS e WhatsApp quando ativos (D45) e, enquanto não estiverem, a tela os mostra como "em breve" e o código vai por e-mail; código ausente, inválido ou expirado impede a revisão e o envio; confirmar um canal não marca o outro como confirmado; a confirmação de uma tentativa não vale para outra; falha de entrega ou resposta perdida preserva o preenchimento e permite recuperação sem duplicar a denúncia.

### RF-AUT-02 · Proteger a sessão do agente

Login individual, com a conta criada e liberada pela equipe do projeto no Supabase, fora do cadastro público, e opção de sair. A revogação bloqueia novas leituras e operações protegidas. Ao sair, a interface limpa as informações privadas da tela.

**Aceite:** visitante e conta sem papel de agente não leem o detalhe privado nem mudam a etapa; conta revogada para de operar; conhecer o endereço de uma página técnica não concede acesso.

### RF-DEN-01 · Preencher e revisar

Da tela Início, a ação de denunciar abre um formulário completo em passos claros: localização do foco, identificação e evidências, dados do cidadão, confirmação do contato escolhido e revisão. Na etapa dos dados do cidadão, um aviso, antes dos campos, informa que nome, e-mail e telefone não são divulgados: só os agentes que atendem a denúncia os veem, e no mapa público a denúncia aparece como anônima (D07, D50). A revisão mostra o conteúdo público e o privado antes do envio. A pessoa pode corrigir qualquer campo e remover ou trocar fotos; voltar um passo não apaga o que foi preenchido.

**Aceite:** a etapa dos dados mostra o aviso de que nome, e-mail e telefone não são divulgados; campo obrigatório vazio impede o envio e a mensagem de erro indica o campo; a revisão separa visualmente o que será público do que é privado; os valores são preservados entre os passos. A V1 não recupera o preenchimento depois que o navegador é fechado.

### RF-DEN-02 · Escolher o local e validar o território

A pessoa escolhe o bairro, informa o endereço digitado (obrigatório, D39) e marca e ajusta o ponto manualmente. O GPS é opcional e só é acionado por ela; a posição do aparelho não é tratada como posição do foco. A validação do território acontece no serviço.

**Aceite:** endereço digitado vazio impede avançar e o erro aparece no próprio campo; GPS negado não impede a marcação manual; ponto fora de Itambé é recusado; trocar o bairro digitado não contorna a validação do ponto; a localização do aparelho não é coletada de forma contínua.

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

Mapa sem login, com a área aproximada (célula de uma grade fixa de cerca de 200 m, D43), bairro ou localidade, categoria, data de recebimento, etapa atual, foto e descrição. Ao tocar no ponto ou no cartão da lista, abre-se uma prévia curta com categoria, bairro, data, etapa, a primeira foto, a descrição pública e a origem, escrita como "feita por cidadão" ou "feita por agente", sem o nome de ninguém (D47, D50); não há página de detalhe completo. Denúncias atendidas e encerradas continuam no mapa, a menos que estejam arquivadas. O resultado da visita (recipientes, larvas, o que foi feito e observações) não é público.

**Aceite:** o visitante encontra a denúncia publicada e abre a prévia curta, sem página de detalhe; a prévia mostra a origem, nunca o nome de quem fez; nenhuma resposta de rede, URL de mídia ou metadado entrega campo privado, referência do local ou ponto exato. O limite sobre conteúdo incidental em texto e foto segue a seção 8.

### RF-MAP-02 · Filtrar e tratar falhas

Filtros por localidade, período de recebimento e etapa, e nenhum outro (D40). Os filtros continuam aplicados quando a pessoa abre uma denúncia e volta ao mapa. A tela diferencia três situações: não há denúncias, não há resultado para os filtros escolhidos, ou houve erro de carregamento.

**Aceite:** os marcadores correspondem ao recorte indicado nos filtros; erro nunca aparece como contagem zero; falha da camada do mapa oferece nova tentativa sem apagar formulário aberto. Agrupamento de pontos, busca por rua e imagem de satélite não fazem parte do aceite; origem, tipo, distrito, rua e área não são filtros.

### RF-AGE-01 · Consultar a fila e o detalhe

**Lista.** No topo, um resumo que acompanha os filtros aplicados (D54): quantas ocorrências do recorte estão Recebidas, Em análise e Em análise com tentativa sem acesso. Cada cartão mostra protocolo, etapa, origem (cidadão ou agente), bairro, data, há quantos dias está aberta e, quando houver, "Sem acesso (N tentativas)" e "Arquivada". Filtros por protocolo, bairro, período de recebimento, etapa, origem e "Sem acesso" (ocorrências Em análise com pelo menos uma tentativa sem acesso; as Encerradas sem acesso aparecem pelo filtro de etapa). A ordem padrão é mais antigas primeiro; também é possível ordenar por mais recentes. Um botão alterna entre Lista e Mapa: o mapa fica dentro de Ocorrências, usa os pontos exatos, colore os marcadores por etapa, mostra a origem do ponto selecionado e respeita os mesmos filtros. O menu do agente leva a Ocorrências, Registrar visita e Relatório. Não há tela de mapa técnico separada nem Meu trabalho e Dashboard.

**Detalhe.** Mostra tudo o que foi preenchido: fotos que ampliam ao toque, categoria, descrição, ponto exato com o botão "Como chegar" (abre o aplicativo de mapas do aparelho no ponto, sem rastrear o agente), bairro, endereço digitado e referência, as respostas do formulário (onde está o foco, água acumulada, recipiente ou estrutura, larvas ou pupas e, na denúncia de cidadão, há quanto tempo percebeu e a outra evidência, que só a equipe vê), e quem fez: nome, telefone com toque para ligar e e-mail do morador ou, na ocorrência feita por agente, o agente que registrou. Mostra também a visita registrada, se a ocorrência está arquivada (com os dias que faltam para a remoção) e uma linha do tempo com o nome de quem fez cada passo: a denúncia, o início da análise, cada visita, o arquivamento e a volta ao mapa. Os botões dependem da etapa: Recebida mostra só "Iniciar análise", que abre o registro da visita (RF-AGE-02); Em análise mostra "Registrar visita" e, a partir da terceira tentativa sem acesso, "Encerrar sem acesso"; Atendida e Encerrada não têm ações de atendimento. "Outras ações" reúne Corrigir dados (RF-COR-01) e Arquivar denúncia em qualquer etapa, Adicionar observação em Em análise e Voltar ao mapa na ocorrência arquivada.

**Ocorrências próximas.** O detalhe lista outras denúncias num raio de 150 metros do ponto exato (D34), com protocolo, data e etapa. Denúncias diferentes sobre o mesmo local continuam sendo ocorrências separadas: o agente trata cada uma, sem fusão automática nem descarte por proximidade. Vários relatos no mesmo ponto não significam vários focos. Ações em lote não estão previstas.

**Aceite:** o filtro de protocolo leva à ocorrência certa; o detalhe corresponde a ela; abrir e fechar não altera a etapa; os dias em aberto e as tentativas conferem com o histórico; lista, mapa e resumo mostram o mesmo recorte; a origem aparece no cartão, no detalhe e no mapa; o aviso de proximidade aparece só para denúncias dentro de 150 metros; lista vazia e filtro sem resultado têm mensagens próprias, e falha de carregamento usa a tela única de erro (D55).

### RF-AGE-02 · Iniciar a análise

Ação explícita que leva a ocorrência de Recebida para Em análise, registra o agente e o momento e abre em seguida o registro da visita (D52). Para o agente é um passo só: não há confirmação entre o toque e o formulário. Se ele sair sem gravar a visita, a ocorrência fica Em análise, em nome dele, com o botão "Registrar visita"; nada do formulário fica salvo (D52).

**Aceite:** a leitura não muda a etapa; clique repetido não duplica o evento; o agente que iniciou fica registrado como autor, e isso não dá a ele exclusividade nem impede outros agentes de agir.

### RF-AGE-03 · Registrar a visita

O registro da visita abre por "Iniciar análise", na ocorrência Recebida, ou por "Registrar visita", na ocorrência Em análise, **depois de o agente ir ao local**. Ele preenche os campos da seção 8.1. Antes de salvar, um resumo mostra as respostas e avisa o efeito: "A ocorrência ficará Atendida e não poderá ser reaberta" (com acesso) ou "A ocorrência continua Em análise. Esta é a Nª tentativa sem acesso." (sem acesso).

- **Com acesso:** a ocorrência passa para Atendida. Atendida indica que houve visita com inspeção; não quer dizer que o foco foi confirmado ou eliminado.
- **Sem acesso:** a ocorrência continua Em análise, o histórico registra "Visita sem acesso" com o motivo e o contador de tentativas aumenta.

Se o envio falhar, a visita continua guardada no aparelho até o agente tentar de novo ou descartar, e o reenvio é tentado sozinho quando a internet volta. No reenvio, o serviço confere etapa e versão: se a ocorrência mudou nesse meio-tempo (foi arquivada, encerrada ou atendida por outra pessoa), a visita guardada é recusada com o motivo, e o agente a descarta depois de ver a ocorrência. A visita é uma declaração do agente; não há rastreamento por GPS nem foto obrigatória.

**Aceite:** só ocorrências Em análise aceitam visita; campos obrigatórios vazios impedem o envio e indicam o campo; data futura ou anterior ao recebimento é recusada; com acesso, etapa e visita são gravadas juntas; sem acesso, a etapa não muda e a tentativa é contada; o mapa passa a exibir Atendida quando a ocorrência está publicada; clique repetido não duplica a visita; falha de rede não apaga o preenchimento.

### RF-AGE-04 · Arquivar denúncia

Arquivar substitui a antiga ocultação (D48) e vale em qualquer etapa (D49). O agente informa o motivo e confirma. A denúncia sai inteira do mapa e das mídias públicas, incluindo as fotos, e entra na lixeira: o registro e o histórico privados continuam disponíveis por 30 dias, e nesse prazo o agente pode devolvê-la ao mapa (RF-AGE-06). Em Recebida ou Em análise, a ocorrência passa a Encerrada com o motivo "Arquivada: " e o texto informado; serve para denúncia falsa, improcedente ou fora do assunto e dispensa visita. Em Atendida ou Encerrada, a etapa não muda; serve para tirar do mapa conteúdo inadequado. Passado o prazo sem volta ao mapa, a denúncia é removida definitivamente (D44, com a ressalva registrada lá).

**Aceite:** sem motivo ou sem confirmação a ação é recusada, no painel e em chamada direta ao serviço; depois do arquivamento, novas consultas públicas à denúncia e às suas mídias não retornam conteúdo; o agente continua vendo o registro, o motivo e os dias que faltam para a remoção; Recebida e Em análise viram Encerrada e não reabrem nem aceitam visita; Atendida e Encerrada mantêm a etapa; o histórico guarda motivo, autor e data; clique repetido não duplica o evento; tentativas antigas de publicação não reexibem a denúncia arquivada. Cópias que terceiros já tenham baixado estão fora do alcance do sistema.

### RF-AGE-05 · Registrar observações durante a análise

O agente acrescenta observações internas sobre a visita, impedimentos, a situação encontrada ou providências pendentes. As observações não alteram o texto enviado pelo morador.

**Aceite:** cada observação guarda autor e data; aparece para os agentes e fica fora da consulta pública; salvar uma observação não conclui a ocorrência nem sobrescreve as anteriores.

### RF-AGE-06 · Voltar ao mapa

Dentro dos 30 dias da lixeira (D44), o agente pode devolver ao mapa uma ocorrência arquivada depois de revisar o conteúdo e, se for o caso, corrigir os dados (RF-COR-01). Autor e data da decisão ficam registrados. Voltar ao mapa muda apenas a visibilidade; a etapa de atendimento continua a mesma.

**Aceite:** a publicação só volta por ação explícita de agente autorizado; usa a versão atual do conteúdo e das mídias; uma tarefa antiga de publicação não desfaz o arquivamento; um arquivamento posterior prevalece sobre tarefas antigas de volta ao mapa; o histórico guarda as duas decisões; depois da remoção, a denúncia não pode voltar ao mapa.

### RF-AGE-07 · Encerrar sem acesso

Quando a ocorrência Em análise soma três ou mais tentativas sem acesso, o detalhe mostra o botão "Encerrar sem acesso". O encerramento não é automático: o agente pode preferir uma nova tentativa. Ao confirmar, a ocorrência passa para Encerrada, com o motivo "Sem acesso após N tentativas", autor e data. Encerrada é final, não volta para Em análise e não conta como Atendida nos totais.

**Aceite:** o botão não aparece nem é aceito pelo serviço com menos de três tentativas; o encerramento exige confirmação; o mapa público passa a exibir Encerrada quando a ocorrência está publicada; Encerrada não reabre nem aceita nova visita.

### RF-AGE-08 · Gerar relatório

Na tela de Ocorrências, o botão "Relatório" abre uma prévia em que o agente escolhe o período (esta semana, de segunda até hoje; semana passada; este mês; ou datas de início e fim), o bairro (todos ou um) e o formato (PDF ou Word). O arquivo é gerado no aparelho e baixado com nome que indica o período, por exemplo `relatorio-aedes-2026-11-09-a-2026-11-15.pdf`.

Como contar: entradas pela data de recebimento, separadas em denúncias de cidadãos e registros de agentes (D56); visitas, Atendidas, tentativas sem acesso, Encerradas sem acesso e Arquivadas pela data do próprio registro; pendentes são as Recebidas e Em análise abertas no último dia do período, qualquer que seja a data de recebimento. Cada ocorrência concluída entra em um só dos três finais; a arquivada depois de atendida conta como Arquivada (confirmado em 16/11/2026).

Conteúdo do relatório:

1. Cabeçalho: Aedes Data Lab · Itambé-PE, nome do agente, período, bairro escolhido e data de geração.
2. Resumo em três grupos: o que entrou no período (de cidadãos, de agentes e visitas feitas), como terminou (Atendidas, Encerradas sem acesso e Arquivadas) e o que ficou em aberto (tentativas sem acesso, pendentes e visitas com larvas).
3. Por bairro: entradas, visitas, Atendidas, Encerradas ou Arquivadas e pendentes para cada um dos 15 bairros.
4. Recipientes com água: contagem pelos nomes do formulário (pneus, baldes, vasos, lixo ou entulho e os demais), nas visitas com acesso.
5. Visitas: data, protocolo, bairro, endereço, onde está o foco, acesso, larvas, recipientes, o que foi feito e observações.
6. Pendentes: ocorrências ainda Recebidas ou Em análise, com etapa, origem, dias em aberto e tentativas.
7. Rodapé: espaço para as assinaturas do agente e do supervisor.

O relatório não traz nome, e-mail ou telefone do morador (D32). Denúncias já removidas da lixeira (D44) não entram nos totais. O arquivo Word é editável, para o supervisor anotar ou ajustar.

**Aceite:** as recebidas batem com a lista filtrada pelo mesmo período e bairro, e as pendentes batem com a lista filtrada pelo bairro e pelas etapas Recebida e Em análise, quando o período termina hoje; nenhum dado de identificação do morador aparece no arquivo; período sem dados gera relatório com aviso "Nenhuma visita no período", sem erro; o PDF abre em leitores comuns e o Word abre no Microsoft Word e no LibreOffice; a geração funciona no celular e no computador.

### RF-AGE-09 · Incorporado ao RF-AGE-04

O arquivamento de denúncia improcedente passou a fazer parte do RF-AGE-04, que reúne arquivar e a antiga ocultação numa ação só (D48). O número foi mantido para preservar as referências dos outros documentos.

### RF-AGE-10 · Registrar foco em local sem denúncia

Em "Registrar visita", no menu, o agente escolhe uma denúncia em análise ou "Local sem denúncia". Não existe cadastro de imóveis: toda visita sem denúncia é em um local novo. Na V1 o agente usa essa opção só quando encontra foco (D51). O formulário é o mesmo da visita, com as perguntas da denúncia do cidadão (D53), e pede também o local (bairro, rua, número, referência, onde está o foco e o ponto no mapa), a data da visita, o que foi encontrado (categoria), a descrição pública, de uma a três fotos, o que foi feito no local e observações internas. Não há pergunta de acesso nem nome, e-mail, telefone ou código de confirmação. Ao confirmar, o serviço cria uma ocorrência de origem "agente", já Atendida, com protocolo e com a visita registrada em nome do agente. Ela aparece no mapa público como as outras, com foto e descrição, marcada "feita por agente".

**Aceite:** só conta com papel de agente cria esse registro, inclusive em chamada direta ao serviço; campos obrigatórios vazios impedem o envio e indicam o campo; o ponto passa pela validação de território; a ocorrência nasce Atendida, com origem agente e uma visita; o mapa público não mostra o nome do agente; clique repetido não cria duas ocorrências; o registro entra no relatório como registro de agente.

### RF-COR-01 · Corrigir campos enviados

O agente autorizado corrige os campos de qualquer denúncia, em qualquer etapa, com motivo obrigatório e revisão do antes e depois. O cidadão responsável pelo envio corrige a própria denúncia enquanto ela estiver Recebida. Quando a ocorrência já está Em análise, Atendida ou Encerrada, o cidadão pede a correção pelo e-mail de contato e o agente decide se aplica (D26).

Podem ser corrigidos o ponto do foco, bairro, categoria, descrição, rua e número, referência do local, as respostas sobre onde está o foco, água acumulada, recipiente ou estrutura e larvas ou pupas, nome e o contato que não foi confirmado. Há quanto tempo percebeu e a outra evidência só o cidadão informa; o agente não altera (decidido em 16/11/2026). O contato confirmado só muda pela equipe do projeto (D42). Um ponto corrigido passa de novo pela validação de território. A correção é diferente de uma observação de agente e nunca reabre uma ocorrência concluída.

O cidadão precisa comprovar o vínculo com aquela denúncia antes de obter uma autorização temporária de edição, restrita ao registro e protegida contra reutilização. O envio registra qual contato foi confirmado. Protocolo, e-mail ou telefone digitados, isoladamente, não liberam acesso. Para recuperar o acesso, o cidadão informa o protocolo e confirma um código enviado ao contato que confirmou no envio (D42). A resposta é a mesma quando o protocolo não existe ou não tem vínculo, para não revelar quais protocolos existem. Trocar o contato confirmado é feito só pela equipe do projeto, direto no Supabase, a pedido pelo e-mail de contato; o agente não troca; um contato novo não serve para autorizações antes de ser confirmado.

Toda correção guarda o valor original, o novo valor, o motivo, o autor e o instante em histórico privado. Se a denúncia estiver publicada, a versão pública é atualizada sem expor dados privados. Se estiver arquivada, continua fora do mapa até uma volta explícita.

**Aceite:** o agente autorizado corrige qualquer denúncia, com motivo, e tem a troca do contato confirmado recusada; o cidadão com vínculo comprovado corrige apenas a própria e somente na etapa Recebida; a etapa é conferida no momento de salvar, e uma correção do cidadão enviada depois do início da análise é recusada com orientação para usar o e-mail de contato; visitantes, cidadãos de outras denúncias e contas sem papel de agente são impedidos, inclusive em chamadas diretas ao serviço; a correção preserva o valor original, mantém o protocolo e não muda sozinha etapa ou visibilidade; o histórico de correção não aparece no mapa nem é liberado ao cidadão; protocolo inexistente e protocolo sem vínculo recebem a mesma resposta; o código vale uma vez, só para aquele registro, e os pedidos têm limite (RNF-08).

## 10. Etapas de atendimento e visibilidade

Etapa de atendimento e estado de publicação são campos independentes. Arquivar uma denúncia tira-a do mapa e leva-a à lixeira; só a remoção depois de 30 dias a exclui (D44). Em Recebida ou Em análise, arquivar também encerra a ocorrência; em Atendida ou Encerrada, a etapa não muda (D49).

### 10.1 Transições de atendimento

| Origem | Ação | Destino | Exigência |
|---|---|---|---|
| Denúncia completa | Confirmar recebimento | Recebida | Protocolo e data gerados pelo serviço |
| Foco encontrado pelo agente em local sem denúncia | Registrar visita em local sem denúncia | Atendida, de origem agente | Campos de RF-AGE-10; protocolo, autor e data gerados pelo serviço |
| Recebida | Cidadão corrige campos | Recebida | Vínculo comprovado; histórico da correção |
| Recebida | Iniciar análise | Em análise, com o registro da visita aberto | Agente autorizado, ação explícita, autor e data (D52) |
| Em análise | Registrar visita com acesso | Atendida | Campos obrigatórios da seção 8.1, autor e momento |
| Em análise | Registrar visita sem acesso | Em análise | Data e motivo (fechado, recusado ou não encontrado); soma uma tentativa |
| Em análise, com três ou mais tentativas sem acesso | Encerrar sem acesso | Encerrada | Ação explícita com confirmação; motivo, autor e data |
| Recebida ou Em análise | Arquivar | Encerrada, fora do mapa | Motivo obrigatório e confirmação; autor e data; a denúncia entra na lixeira (D44) |
| Em análise | Registrar observação | Em análise | Autor e data |
| Qualquer etapa | Agente corrige campos | Mesma etapa | Motivo e histórico da correção |
| Qualquer etapa | Abrir ou consultar | Mesma etapa | Nenhum evento de mudança |
| Atendida ou Encerrada | Arquivar | Mesma etapa, fora do mapa | Motivo obrigatório e confirmação; autor e data; a denúncia entra na lixeira (D44) |
| Arquivada, em qualquer etapa | Voltar ao mapa | Mesma etapa | Decisão explícita de agente autorizado, dentro dos 30 dias da lixeira |
| Arquivada há 30 dias | Remover da lixeira | Removida | Rotina automática; apaga registro, dados privados, visitas, histórico e fotos |

Ocorrência Atendida ou Encerrada não volta para Em análise, nem por correção, e não aceita nova visita. Conclusão por engano ou reaparecimento do problema pedem nova denúncia. Ninguém apaga histórico pela interface; a única remoção é a automática da lixeira (D44).

Quando duas pessoas agem ao mesmo tempo, o serviço confere a versão e a etapa atuais antes de salvar. Uma tela desatualizada não sobrescreve a ação de outro agente.

### 10.2 Estados de publicação

| Estado | O que o público vê | O que o agente vê |
|---|---|---|
| Pendente | A denúncia ainda não aparece no mapa | Registro completo, com a etapa de atendimento preservada |
| Publicada | Campos permitidos e fotos tratadas | Registro completo |
| Arquivada | Registro e fotos deixam de ser servidos | Registro, etapa, motivo e data do arquivamento, até a remoção em 30 dias |

Uma falha temporária de publicação pode ser recuperada automaticamente. O arquivamento é uma decisão operacional e prevalece sobre qualquer tarefa antiga. Para passar de Arquivada para Publicada, um agente precisa decidir de novo depois de revisar; a implementação distingue a decisão mais recente das retentativas de decisões anteriores.

### 10.3 Denúncias improcedentes e conteúdo inadequado

Denúncias falsas, improcedentes ou fora do assunto são conferidas pelo agente no painel (D41). Ele segue com a denúncia ou a arquiva (RF-AGE-04). Conteúdo inadequado numa ocorrência já Atendida ou Encerrada também é resolvido arquivando, sem mudar a etapa (D49). Detecção automática de imagens fica como ideia para o futuro, caso o problema se torne frequente.

Quando o agente vai ao local e não o encontra, registra uma visita com o motivo "Local não encontrado"; depois de três tentativas, pode encerrar a ocorrência (RF-AGE-07). A denúncia que dispensa visita é arquivada e fica Encerrada com o motivo; ela nunca é marcada como Atendida.

## 11. Jornadas e mensagens

**Morador:** na tela Início, toca em denunciar → marca o local → descreve o foco, escolhe categoria e anexa de uma a três fotos → informa nome, e-mail e telefone em "Seus dados para o registro" → escolhe receber o código por e-mail ou, quando ativos (D45), por telefone, em SMS ou WhatsApp → digita e valida o código → revisa o que será público e privado → envia → recebe o protocolo e o estado da publicação. E-mail leva diretamente à tela do código, com orientação para conferir a caixa de entrada. GPS negado, ponto fora do município, foto ausente ou com falha, dados inválidos, código inválido, falha antes de gravar e publicação pendente têm estados próprios, sem cortar a jornada.

**Visitante:** abre o mapa → aplica filtros → toca no ponto ou no cartão e lê a prévia de uma denúncia publicada (categoria, bairro, data, etapa, foto, descrição e se foi feita por cidadão ou por agente). Não precisa de conta e não vê identidade nem contato.

**Agente:** entra com a conta autorizada → vê o resumo e as Ocorrências mais antigas primeiro, com a origem de cada uma → abre o detalhe, confere ocorrências próximas e liga para o morador se precisar → toca em "Como chegar", vai ao local e toca em "Iniciar análise", que abre o registro da visita. Com acesso, a ocorrência fica Atendida; sem acesso, continua Em análise e, a partir da terceira tentativa, pode ser encerrada. Quando encontra foco num local sem denúncia, registra a visita pelo menu e ela vira uma ocorrência feita por agente. Em qualquer etapa pode arquivar a denúncia, tirando-a do mapa, e depois devolvê-la.

**Supervisor:** recebe do agente o relatório do período em PDF ou Word, por e-mail ou mensagem, e assina ou anota no próprio arquivo. Não entra no sistema.

**Correção pelo cidadão:** enquanto a denúncia está Recebida, ele informa o protocolo e confirma o código enviado ao contato confirmado (D42) → corrige os campos → o histórico interno registra a alteração. Depois do início da análise, ele escreve para o e-mail de contato e o agente avalia o pedido.

**Correção pelo agente:** abre a denúncia → Corrigir dados → corrige com motivo e revisa o antes e depois → se ela estiver arquivada, continua fora do mapa até ele decidir devolvê-la. Pedido de troca do contato confirmado vai para a equipe do projeto.

O sistema usa três mensagens distintas no envio: "Não foi possível enviar", "Denúncia recebida; publicação pendente" e "Denúncia recebida e publicada". Nenhuma mensagem afirma que um agente foi avisado pessoalmente, que haverá vistoria ou que existe prazo. O protocolo comprova o recebimento. Consulta privada por protocolo e resposta individual ao cidadão estão fora do escopo.

## 12. Dados e acesso

| Grupo de dados | Consulta pública | Área dos agentes |
|---|---|---|
| Categoria, bairro, data de recebimento, etapa e origem (cidadão ou agente) | Sim, quando publicada | Sim |
| Descrição e fotos tratadas | Sim, sem revisão humana prévia | Sim |
| Área aproximada | Sim | Sim, quando útil |
| Ponto exato e referência do local | Não | Sim |
| Nome, e-mail e telefone | Não, nem mascarados | Sim |
| Nome do agente que registrou a ocorrência | Não | Sim |
| Histórico, autor das ações e observações | Não | Sim |
| Visitas: acesso, onde está o foco, recipientes, larvas e o que foi feito | Não | Sim |
| Motivo do arquivamento | Não | Sim |

O relatório para o supervisor traz bairro, endereço e o resultado das visitas, mas nunca nome, e-mail ou telefone do morador. Depois de baixado, o arquivo fica sob responsabilidade de quem o recebe, como qualquer documento interno da equipe de saúde.

O cidadão com vínculo comprovado acessa os campos que enviou na própria denúncia para corrigi-los, dentro do prazo de D26. Esse acesso não torna os dados públicos e não libera histórico, observações ou dados de outras pessoas.

A separação entre público e privado acontece nos dados que o serviço devolve; esconder campos só na tela não basta. Nomes de tabelas e contratos estão em [ARCHITECTURE.md](./ARCHITECTURE.md), e as regras de proteção em [SECURITY.md](./SECURITY.md). Confirmar e-mail ou telefone não autentica a identidade civil, e a V1 não tem integração de verificação de identidade.

O produto não terá perfil público de denunciante, rastreamento de localização atual nem credenciais administrativas guardadas no navegador. A preferência por guardar as informações por prazo indefinido está registrada em D24. Antes da coleta de dados reais, DEP-06 precisa definir retenção por tipo de dado, correção, retirada e exclusão aplicáveis. A única expiração automática é a remoção da denúncia arquivada depois de 30 dias na lixeira (D44), e o produto não promete armazenamento eterno gratuito. As cópias de segurança do provedor entram na política de DEP-06.

## 13. Requisitos não funcionais

| ID | Requisito | Como verificar |
|---|---|---|
| RNF-01 | Uso em celular e computador | Fluxo completo sem perda de conteúdo e sem rolagem horizontal em 320, 390, 768 e 1440 px |
| RNF-02 | Acessibilidade do fluxo principal | Rótulos, erro associado ao campo, foco visível, uso por teclado e etapa indicada por texto além da cor |
| RNF-03 | Autorização no serviço | Tentativas sem papel ou com conta revogada são negadas também fora da interface |
| RNF-04 | Integridade do envio | Repetição, falha parcial de foto e resposta perdida não geram sucesso falso nem duplicidade |
| RNF-05 | Publicação sem dados privados | Testes confirmam que a API pública não devolve dados privados, metadados de foto ou ponto exato |
| RNF-06 | Controle de publicação | Denúncia arquivada sai da consulta e das mídias públicas; tarefas antigas não desfazem decisões posteriores; voltar ao mapa exige ação explícita; denúncia arquivada há 30 dias é removida |
| RNF-07 | Uso limitado de recursos | Fotos e consultas têm limites configurados, a lista dos agentes é paginada e as assinaturas são encerradas ao sair |
| RNF-08 | Proteção contra abuso | Envio e solicitação/reenvio de códigos por e-mail, SMS ou WhatsApp têm limites no serviço, além do bloqueio do botão |
| RNF-09 | Histórico confiável | Autor e instante vêm da sessão e do serviço; ações simultâneas não apagam registros |
| RNF-10 | Dados pessoais em logs | Logs e métricas não registram contato, texto livre ou foto sem necessidade operacional definida |
| RNF-11 | Registro de visita em campo | O formulário cabe numa tela de 320 px com rolagem vertical, usa opções de toque de pelo menos 44 px e, se o envio falhar, guarda o preenchimento só no aparelho até nova tentativa ou descarte |
| RNF-12 | Relatório sem dados do morador | Arquivo gerado no navegador, sem servidor de terceiros; testes conferem que PDF e Word não contêm nome, e-mail ou telefone |

Metas numéricas de latência, volume e disponibilidade serão definidas junto com as cotas do provedor (DEP-07). A forma e a precisão do mapa público precisam ser testadas também em áreas pouco povoadas, onde aproximar o ponto protege menos.

## 14. Indicadores

O lançamento já coleta medidas operacionais para acompanhar falhas e adesão, mesmo sem dashboard.

| Medida | Definição |
|---|---|
| Denúncias recebidas | Denúncias gravadas no período |
| Ocorrências por origem | Denúncias de cidadãos e registros de agentes no período |
| Distribuição por etapa | Etapa atual das denúncias do mesmo período |
| Tempo até a primeira análise | Intervalo entre o recebimento e o início da análise; não equivale ao tempo de vistoria |
| Falhas e repetições | Tentativas com falha e recuperações, sem contar a mesma tentativa duas vezes |
| Denúncias arquivadas | Retiradas do mapa com motivo, na lixeira por 30 dias |
| Denúncias por localidade | Número de relatos por bairro; não representa casos confirmados nem prioridade |
| Tempo até a visita | Intervalo entre o recebimento e a primeira visita registrada |
| Visitas com larvas | Parte das visitas com acesso em que o agente encontrou larvas ou pupas |
| Recipientes com água | Contagem pelos nomes do formulário, por bairro |
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
| AC-01 · Envio válido | A partir de Início, preenche localização, foco, fotos, nome, e-mail e telefone; escolhe e confirma um código pelo canal disponível (e-mail e, se ativos, SMS ou WhatsApp) após os dados; revisa, envia, recebe protocolo e encontra o registro gravado. Cada canal ativo é exercitado | RF-AUT-01, RF-DEN-01 a RF-DEN-04 |
| AC-02 · Entrada inválida | Contato obrigatório ausente ou malformado, código ausente/inválido/expirado, campo ausente, foto inválida e ponto fora do território não finalizam o envio; falha de entrega e reenvio preservam o formulário e respeitam os limites do serviço | RF-AUT-01, RF-DEN-01 a RF-DEN-03, RNF-08 |
| AC-03 · GPS negado | A pessoa marca o ponto manualmente e segue sem perder dados | RF-DEN-02 |
| AC-04 · Rede e reenvio | Falha antes ou depois da gravação e envio repetido resultam em no máximo um registro por tentativa; limites de repetição aplicados no serviço | RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08 |
| AC-05 · Publicação pendente | Gravação confirmada com mapa pendente mantém o protocolo e o acesso do agente | RF-DEN-05 |
| AC-06 · Mapa e filtros | Visitante vê os campos permitidos, filtros coerentes e denúncias atendidas; erro não vira zero; limites de consulta e paginação respeitados | RF-MAP-01, RF-MAP-02, RF-AGE-01, RNF-07 |
| AC-07 · Privacidade | API, URLs e metadados públicos não trazem dados privados nem ponto exato; logs e métricas também não | RF-MAP-01, RNF-05, RNF-10 |
| AC-08 · Permissões | Visitante e conta revogada não leem dados privados nem alteram ocorrências | RF-AUT-02, RNF-03 |
| AC-09 · Atendimento | Leitura não muda a etapa; "Iniciar análise" leva a Em análise e abre o registro da visita; visita com acesso exige os campos da seção 8.1 e leva a Atendida; data inválida é recusada; Atendida não reabre; a lista mostra origem e dias em aberto, o resumo acompanha os filtros e o detalhe avisa ocorrências próximas em 150 m | RF-AGE-01 a RF-AGE-03, RF-AGE-05, RNF-11 |
| AC-10 · Concorrência | Ação antiga ou repetida não sobrescreve transição posterior nem duplica evento ou visita | RF-AGE-02, RF-AGE-03, RF-AGE-07, RNF-09 |
| AC-11 · Arquivamento | Arquivar exige motivo e confirmação em qualquer etapa; interrompe consulta e mídia públicas, mantém o registro interno por 30 dias, remove a denúncia depois disso e resiste a retentativas de publicação; Recebida e Em análise viram Encerrada; Atendida e Encerrada mantêm a etapa | RF-AGE-04, RNF-06 |
| AC-12 · Interfaces | Jornada completa, da tela Início ao resultado, executável nos tamanhos definidos e por teclado; telas e estados de erro sem conteúdo cortado, com textos, ações e navegação alinhados. Na referência visual do Figma, a barra de URL simulada também é uniforme | RNF-01, RNF-02, D35, D36 |
| AC-13 · Volta ao mapa | Agente revisa e devolve ao mapa explicitamente, só dentro dos 30 dias da lixeira; histórico preservado; etapa inalterada; tarefa antiga não desfaz arquivamento posterior | RF-AGE-06, RNF-06 |
| AC-14 · Correção autorizada | Agente corrige em qualquer etapa, mas não troca o contato confirmado; cidadão corrige só a própria denúncia e só enquanto Recebida; tentativa do cidadão após o início da análise é recusada; acesso indevido negado; original e motivo preservados; etapa e visibilidade inalteradas | RF-COR-01, RNF-03, RNF-05, RNF-09 |
| AC-15 · Sem acesso e encerramento | Visita sem acesso mantém Em análise e soma tentativa; "Encerrar sem acesso" só a partir da terceira; Encerrada não reabre e aparece no mapa enquanto não for arquivada | RF-AGE-03, RF-AGE-07 |
| AC-16 · Relatório | PDF e Word gerados para período e bairro; totais batem com a lista; denúncias de cidadãos separadas dos registros de agentes e Encerradas sem acesso separadas das Arquivadas; nenhum dado de identificação do morador; período vazio tratado | RF-AGE-08, RNF-12 |
| AC-17 · Foco em local sem denúncia | Agente registra a visita em local sem denúncia com local, categoria, descrição e fotos; a ocorrência nasce Atendida, de origem agente, aparece no mapa como "feita por agente", sem o nome, e entra no relatório como registro de agente | RF-AGE-10, RF-MAP-01 |

Os testes começam com dados fictícios e serviços de teste. Cada execução registra a versão testada, o resultado e as limitações encontradas. Capturas do Figma não substituem esses cenários. O passo a passo de cada cenário está em [TEST_PLAN.md](./TEST_PLAN.md). A etapa com moradores reais só começa depois que as dependências de lançamento estiverem resolvidas.

## 16. Entregas

| Entrega | Resultado demonstrável |
|---|---|
| E1 · Estrutura e navegação | HTML, CSS e JavaScript das telas, com entrada do formulário, mapa e área dos agentes |
| E2 · Dados fictícios compartilhados | Formulário, mapa e Ocorrências usando o mesmo contrato de dados |
| E3 · Envio integrado | Confirmação por e-mail, SMS ou WhatsApp após os dados do cidadão, fotos, gravação, protocolo e recuperação de falhas |
| E4 · Público e agente | Área aproximada, autorização, registro de visita, encerramento sem acesso, registro de foco em local sem denúncia, relatório, arquivamento e correção |
| E5 · Aceite da V1 | Evidências de AC-01 a AC-17 e preparação da operação |
| E6 · Evolução | Dashboard, gráficos e melhorias priorizadas pelo uso |

As primeiras atividades de HTML já combinadas são, nesta ordem, a página da denúncia (`registrar-foco.html`), Início, Jogo e Guia Aedes. A ordem é didática e não muda a jornada do cidadão, que começa em Início (D35). Jogo e Guia não bloqueiam o fluxo operacional. A divisão dessas entregas em tarefas numeradas está em [TASKS.md](../TASKS.md).

## 17. Riscos assumidos

| Risco | Efeito | Tratamento na V1 |
|---|---|---|
| Publicação automática | Foto ou descrição pode identificar alguém por acidente | Aviso no formulário, arquivamento e conferência diária; a revisão prévia foi adiada de propósito |
| Dois contatos obrigatórios | Amplia a coleta de dados pessoais; SMS e WhatsApp podem ter custo, falha de entrega e abuso | Uso e retenção em DEP-06; provedores, limites e custo em DEP-03 e DEP-07 |
| Adesão dos agentes | Contas ativas não comprovam disponibilidade nem vínculo oficial | Sem promessa de prazo; vínculo formalizado em DEP-04 |
| Representação do território | Imagem, texto e contexto podem revelar o local apesar da aproximação | Grade fixa de 200 m (D43), testada em áreas pouco povoadas e perto de divisas (AC-07) |
| Abuso e volume | Lançamento aberto pode receber envios indevidos ou acima do esperado | Limites no serviço (RNF-07, RNF-08) |
| Serviços externos de mapa e mensagens | Falhas fora do controle da equipe | Mensagens de erro e recuperação sem confirmação falsa; escolha de provedores em DEP-03 e DEP-07 |
| Mapa antigo do wireframe | A imagem escolhida para a prévia mostra Itambé/BA, não o território de Itambé/PE | Uso apenas ilustrativo no Figma; cartografia real e contorno municipal em DEP-01 e DEP-07 |
| Ausência de agentes | Fila cresce e a retirada de conteúdo demora | Recebimento mantido (D23); responsável pela conferência e pelo e-mail em DEP-05 |
| Retenção e custo | Guardar fotos por tempo indefinido pressiona armazenamento e orçamento | Estimativa de volume e teto de custo em DEP-07 |

Esses riscos fazem parte do produto escolhido. Mudanças como moderação prévia ou restrição a convidados exigem nova decisão registrada neste PRD.

## 18. Dependências de implementação e lançamento

| ID | O que precisa ser resolvido | Prazo | Responsável |
|---|---|---|---|
| DEP-01 | Catálogo de categorias e limite territorial de Itambé/PE, com fonte e versão. As localidades já estão definidas em D33; faltam o mapa real e o contorno municipal e de cada bairro. A imagem antiga de Itambé/BA é só referência visual (D37) | Antes da validação de território | Produto, agentes e desenvolvimento |
| DEP-03 | Provedor de código por e-mail e viabilidade de SMS e WhatsApp (custo por mensagem, prazo e burocracia de contratação; se forem inviáveis, ficam como "em breve", D45); consentimento aplicável, entrega, expiração, reenvio, limites contra abuso e tratamento de arquivos. Nenhuma prévia comprova que mensagens reais foram entregues | Antes da integração real do envio | Desenvolvimento, produto e operação |
| DEP-04 | Nome da instituição parceira, formato do vínculo e confirmação do uso pelos agentes | Antes do lançamento | Equipe do projeto e instituição parceira |
| DEP-05 | Responsável e substituto pela conferência diária; criação e acompanhamento do e-mail de contato | Antes de publicar conteúdo real | Equipe do projeto e operação |
| DEP-06 | Adequação à LGPD (Lei nº 13.709/2018): base legal, controlador e encarregado, aviso de privacidade, atendimento aos direitos do titular e política de retenção por tipo de dado, incluindo cópias de segurança do provedor e a lixeira de 30 dias (D44) | Antes de coletar dados reais | Equipe do projeto, instituição parceira e operação |
| DEP-07 | Provedor de mapa, plano do Supabase (incluindo se há cópias de segurança e por quantos dias elas guardam dados removidos), plano da Vercel (confirmar se o gratuito vale para um serviço mantido por instituição), estimativa de volume e custo, teto financeiro e comportamento ao atingir cotas | Antes do ambiente público | Equipe do projeto, instituição parceira e desenvolvimento |
| DEP-09 | Período e critérios de avaliação do piloto | Antes da avaliação de resultados | Produto e agentes participantes |

As pendências abertas são todas de preparação técnica ou operacional. Esta é a lista única de pendências do projeto: os outros documentos citam o ID em vez de repetir o texto. Nenhuma delas impede o trabalho com dados fictícios.

## 19. Definição de pronto

**Documento:** decisões registradas, requisitos com critério de aceite, dados e permissões definidos, rastreabilidade completa e dependências identificadas na seção 18.

**V1 técnica:** cenários AC-01 a AC-17 demonstrados na versão candidata. Dashboard e recursos complementares não entram nesse aceite.

**Abertura para moradores:** dependências de lançamento resolvidas, contas de agentes funcionando, arquivamento testado, custos acompanhados e comunicação clara sobre o papel do serviço. Esse marco não substitui parecer jurídico, aprovação municipal ou avaliação de impacto sanitário.

## 20. Referências e precedência

1. Decisões do responsável pelo produto: publicação automática, dados privados, dashboard posterior e prazo de correção pelo cidadão (D01 a D26).
2. Notas internas de contexto e o roteiro de aprendizagem do projeto, mantidos fora do repositório.
3. [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), com as telas finais, e [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65), para o planejamento das tarefas.
4. Levantamento com a coordenação de endemias de Itambé: ficha em papel Registro Diário do Serviço Antivetorial (PNCD), lista de bairros, cobertura por ciclo e período de retorno. Origem de D27 a D34.
5. Decisões do responsável pelo produto sobre a jornada da denúncia: confirmar um canal depois de informar e-mail e telefone, escolher entre e-mail, SMS e WhatsApp, começar pela tela Início, usar telas inteiras e reaproveitar o mapa antigo só como imagem ilustrativa. Origem de D35 a D37.
6. Decisões do responsável pelo produto sobre a jornada do agente, tomadas em 15/11/2026: origem da ocorrência, perguntas na linguagem do cidadão, arquivar como ação única, análise e visita num passo, foco em local sem denúncia e novo relatório. Origem de D48 a D56.

Em conflito com telas antigas ou recomendações anteriores, valem as decisões deste PRD. Mudanças futuras registram o motivo no histórico abaixo.

## 21. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 0.1 | 04/11/2026 | Primeiro rascunho do PRD e do Start Técnico (PR #2) |
| 0.2 | 04/11/2026 | Estrutura do documento e decisões da entrevista de produto |
| 1.0 | 05/11/2026 | Critérios por requisito, campos e acessos, etapas de atendimento e publicação, rastreabilidade e dependências de lançamento |
| 1.1 | 05/11/2026 | Visita obrigatória para Atendida, observações durante a análise, sem reabertura, republicação pelo agente, responsabilidades e preferências de retenção e custo |
| 1.2 | 05/11/2026 | Correção liberada ao administrador e ao cidadão responsável pelo envio; responsabilidades descritas por papel |
| 2.0 | 05/11/2026 | Texto revisado em tom corporativo; glossário; aviso epidemiológico restaurado no resumo; D26 limita a correção do cidadão à etapa Recebida; especificações propostas incorporadas aos requisitos; papel "operador" substituído por agente autorizado; permissões separadas por perfil; riscos em tabela; LGPD explícita em DEP-06; pendência do endereço digitado registrada; estado do repositório atualizado para `f403ef5`; telas do Figma registradas como concluídas |
| 2.1 | 11/11/2026 | Arquivo renomeado para `PRD.md` na nova estrutura de documentação; seção Visão do produto; estado da implementação movido para MEMORY.md; referências a ARCHITECTURE, DESIGN, TASKS, TEST_PLAN e SECURITY |
| 2.2 | 12/11/2026 | MVP do agente a partir do levantamento com a coordenação: ficha do PNCD não digitalizada (D27); registro de visita com campos de toque (seção 8.1, RF-AGE-03); etapa Encerrada após três tentativas sem acesso (RF-AGE-07); relatório em PDF e Word para o supervisor (RF-AGE-08); uma conta de agente na V1; 15 bairros; aviso de ocorrências próximas em 150 m; lista com resumo, dias em aberto e mapa interno; RNF-11, RNF-12, AC-15 e AC-16 |
| 2.3 | 14/11/2026 | Fluxo cidadão completo da tela Início ao protocolo; e-mail e telefone obrigatórios; código depois dos dados, com escolha de e-mail ou telefone e, no telefone, SMS ou WhatsApp; revisão, estados de erro e telas completas; mapa antigo mantido só como referência visual com ressalva de Itambé/BA; correção do cidadão vinculada a mecanismo seguro ainda a definir para os três canais; decisões anteriores do dashboard pós-V1 registradas com conflito da contagem antiga explicitado; a seção 18 reúne as pendências que estavam espalhadas em TASKS e MEMORY; D38 registra o Supabase como backend; documentos derivados alinhados a esta versão |
| 2.4 | 14/11/2026 | Decisões de produto fechadas: D21 (quem denuncia e risco aceito), D39 (endereço digitado obrigatório), D40 (filtros do mapa: localidade, período e etapa) e D41 (arquivar denúncia improcedente, RF-AGE-09); as pendências sobre dados de terceiros, endereço, filtros e arquivamento saem da seção 18; D34 confirma o raio de 150 m como alcance de voo do mosquito; D42 (recuperar o acesso por protocolo e código), D43 (grade fixa de 200 m no mapa público) e D44 (ocultar como lixeira de 30 dias); as pendências da aproximação do ponto e da recuperação de acesso saem da seção 18 |
| 2.5 | 15/11/2026 | D07 retira o CPF do produto (nome, e-mail e telefone seguem obrigatórios); D25 aceita pagar um custo baixo; D45 mantém só o e-mail como canal garantido e condiciona SMS e WhatsApp a custo e prazo; D46 define a Vercel como hospedagem |
| 2.6 | 15/11/2026 | D47: o mapa público usa prévia curta e não tem detalhe completo (RF-MAP-01) |
| 2.7 | 15/11/2026 | Resumo e filtro "Sem acesso" só com ocorrências Em análise; Atendida e Encerrada sem ações de atendimento, mas com correção e publicação no menu; reenvio da visita guardada confere etapa e versão; período e regras de contagem do relatório. Sem papel nem tela de administrador: a equipe do projeto cria as contas e troca o contato confirmado direto no Supabase (D22, D42); o agente corrige os dados de qualquer denúncia (D20, D26, RF-COR-01, AC-14) |
| 2.8 | 15/11/2026 | Jornada do agente revista: ocultar e arquivar viram uma ação só, válida em qualquer etapa, com volta ao mapa (D48, D49, RF-AGE-04, RF-AGE-06; RF-AGE-09 incorporado); origem da ocorrência, cidadão ou agente, visível também no mapa público sem o nome (D50, RF-MAP-01); registro de foco em local sem denúncia (D51, RF-AGE-10, AC-17); iniciar análise abre o registro da visita (D52); perguntas da visita na linguagem do cidadão, sem os códigos do PNCD (D53, seção 8.1); resumo que acompanha os filtros (D54); tela única de erro (D55); relatório em três grupos, por origem e por tipo de encerramento (D56, RF-AGE-08). Em 16/11/2026 confirmados o prazo da lixeira para qualquer etapa (D44), a ocorrência que fica Em análise quando o agente sai da visita sem gravar (D52) e a contagem da arquivada depois de atendida como Arquivada (RF-AGE-08). Também em 16/11/2026: respostas do formulário no detalhe e corrigíveis pelo agente, menos o tempo e a outra evidência (RF-AGE-01, RF-COR-01) |
| 2.9 | 22/11/2026 | RF-DEN-01: a etapa dos dados do cidadão traz o aviso de que nome, e-mail e telefone não são divulgados. Confirmado: CPF fora do produto (D07) e identificação obrigatória, com denúncia anônima no mapa público (D50) |
