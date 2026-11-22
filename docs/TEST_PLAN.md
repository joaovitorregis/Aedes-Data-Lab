# Aedes Data Lab: Plano de testes

Este plano define o que significa "funcionando" para cada parte da V1. Os cenários AC-01 a AC-17 são os critérios de aceite do [PRD](./PRD.md), seção 15; aqui eles viram passos que qualquer pessoa da equipe consegue executar e repetir.

## 1. Como testar

- Teste sempre com dados fictícios: nomes, e-mails e telefones inventados, nunca dados de pessoas reais.
- Até a Fase 6 de [TASKS.md](../TASKS.md), os testes usam o serviço fictício; depois, o Supabase local (Supabase CLI) e o projeto de teste.
- Cada execução registra a data, a versão testada (commit ou PR), o resultado e o que ficou de fora, no próprio PR.
- Telas do Figma não substituem teste. O teste é feito no site.

## 2. Verificação de cada tarefa

Antes de abrir o PR de qualquer tarefa:

- [ ] A página abre sem erro no console do navegador
- [ ] A tela confere com o Figma e com o [DESIGN.md](./DESIGN.md)
- [ ] Sem rolagem horizontal em 320, 390, 768 e 1440px
- [ ] Dá para usar só com o teclado, com o foco visível
- [ ] Estados de carregando, vazio e erro aparecem quando devem
- [ ] Nenhum dado pessoal real ou chave no código

## 3. Cenários de aceite da V1

### Denúncia

**AC-01 · Envio válido** (RF-AUT-01, RF-DEN-01 a RF-DEN-04)
1. Na tela Início, tocar em denunciar.
2. Marcar um ponto dentro de Itambé; preencher categoria, descrição e uma foto.
3. Em "Seus dados para o registro", preencher nome, e-mail e telefone de teste.
4. Escolher onde receber o código e digitar o código recebido.
5. Revisar e enviar.
6. Esperado: protocolo exibido; depois de recarregar, a denúncia continua gravada.

Repetir o cenário três vezes, uma por canal: e-mail, telefone com SMS e telefone com WhatsApp.

**AC-02 · Entrada inválida** (RF-AUT-01, RF-DEN-01 a RF-DEN-03, RNF-08)
- [ ] A escolha do canal do código só aparece depois dos dados do cidadão
- [ ] E-mail escolhido abre direto a tela do código; com SMS e WhatsApp ativos, o telefone oferece os dois antes; sem eles, a tela os mostra como "em breve"
- [ ] Sem código, com código errado ou expirado, a revisão e o envio não são liberados
- [ ] Confirmar um canal não marca o outro contato como confirmado
- [ ] Campo obrigatório vazio, inclusive e-mail ou telefone, mostra erro no próprio campo
- [ ] Endereço digitado vazio impede avançar da localização e mostra erro no próprio campo
- [ ] E-mail ou telefone malformado mostra erro no próprio campo
- [ ] Falha na entrega do código ou pedido de novo código preserva o formulário preenchido
- [ ] Arquivo que não é imagem, ou acima do limite, é recusado com explicação
- [ ] Ponto fora de Itambé é recusado, mesmo trocando o bairro digitado

**AC-03 · GPS negado** (RF-DEN-02)
- [ ] Negar a permissão de localização e marcar o ponto à mão, sem perder o que já foi preenchido

**AC-04 · Rede e reenvio** (RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08)
- [ ] Clicar duas vezes em Enviar gera um único protocolo
- [ ] Cortar a rede antes da gravação mostra "Não foi possível enviar" e mantém o formulário
- [ ] Cortar a rede depois da gravação permite recuperar o mesmo protocolo
- [ ] Pedir ou reenviar código além do limite é bloqueado pelo serviço, sem apagar o formulário

**AC-05 · Publicação pendente** (RF-DEN-05)
- [ ] Com a publicação falhando, a pessoa recebe o protocolo e o aviso de publicação pendente, e o agente vê a denúncia

### Mapa público

**AC-06 · Mapa e filtros** (RF-MAP-01, RF-MAP-02, RF-AGE-01, RNF-07)
- [ ] Visitante vê área aproximada, bairro, categoria, data, etapa, foto e descrição
- [ ] Tocar no ponto ou no cartão abre uma prévia curta (categoria, bairro, data, etapa, primeira foto, descrição e origem) e nenhuma página de detalhe
- [ ] A prévia mostra "feita por cidadão" ou "feita por agente" e nunca o nome de quem fez
- [ ] Denúncias atendidas continuam no mapa
- [ ] Filtros por localidade, período e etapa mostram o mesmo recorte nos marcadores e na lista
- [ ] O mapa não oferece outros filtros (origem, tipo, distrito, rua ou área)
- [ ] "Sem denúncias", "sem resultado para os filtros" e "erro ao carregar" aparecem como mensagens diferentes
- [ ] A lista dos agentes carrega em páginas

**AC-07 · Privacidade** (RF-MAP-01, RNF-05, RNF-10)
- [ ] Na aba Rede do navegador, nenhuma resposta pública contém nome, e-mail, telefone, referência ou ponto exato
- [ ] Nenhuma resposta pública contém o nome do agente que registrou uma ocorrência
- [ ] A resposta pública traz a célula da grade e nunca o ponto exato; duas denúncias na mesma célula mostram a mesma área
- [ ] Em área pouco povoada e perto de uma divisa, a célula não permite deduzir o ponto
- [ ] As fotos públicas não têm coordenadas nem dados da câmera
- [ ] Logs e métricas não registram dados pessoais

### Área dos agentes

**AC-08 · Permissões** (RF-AUT-02, RNF-03)
- [ ] Visitante não abre o detalhe privado, nem pelo endereço direto da página
- [ ] Conta revogada perde o acesso na próxima operação
- [ ] Chamada direta ao serviço sem login é negada

**AC-09 · Atendimento** (RF-AGE-01 a RF-AGE-03, RF-AGE-05, RNF-11)
- [ ] Abrir e fechar o detalhe não muda a etapa
- [ ] A lista mostra o resumo, a origem (cidadão ou agente) e os dias em aberto de cada ocorrência, e começa pelas mais antigas
- [ ] Com um filtro aplicado, o resumo mostra os números do recorte
- [ ] O filtro de origem mostra só as ocorrências de cidadãos ou só as de agentes
- [ ] O detalhe mostra a linha do tempo com o nome de quem fez cada passo
- [ ] Lista e mapa de Ocorrências mostram o mesmo recorte com os mesmos filtros
- [ ] "Como chegar" abre o aplicativo de mapas no ponto exato
- [ ] O aviso de ocorrências próximas aparece para uma denúncia a 100 m e não para uma a 200 m
- [ ] Na ocorrência Recebida, "Iniciar análise" leva a Em análise e abre o registro da visita, sem confirmação no meio; "Registrar visita" só aparece com a ocorrência Em análise
- [ ] Visita com acesso sem "onde está o foco", sem resposta de água, sem resposta de larvas ou sem nada em "o que foi feito" é recusada, com o erro no campo
- [ ] "Outro local" sem texto digitado é recusado
- [ ] Água acumulada = Sim sem nenhum recipiente marcado é recusado
- [ ] Data futura ou anterior ao recebimento é recusada
- [ ] Visita com acesso completa mostra o resumo, e depois de confirmar a ocorrência fica Atendida
- [ ] Observação registrada fica no histórico e não muda a etapa
- [ ] Ocorrência Atendida não volta para Em análise e não aceita nova visita
- [ ] Com a rede cortada, o envio da visita falha e o formulário continua preenchido; ao reenviar, a visita é gravada uma vez só
- [ ] O formulário de visita funciona em 320px, com as opções de toque de pelo menos 44px

**AC-10 · Concorrência** (RF-AGE-02, RF-AGE-03, RF-AGE-07, RNF-09)
- [ ] Duas abas agindo na mesma ocorrência: a ação feita com a tela desatualizada é recusada, sem apagar a outra
- [ ] Clicar duas vezes em confirmar a visita grava uma única visita

**AC-11 · Arquivamento** (RF-AGE-04, RNF-06)
- [ ] "Arquivar denúncia" aparece em "Outras ações" em qualquer etapa; sem motivo ou sem confirmação é recusado, também em chamada direta ao serviço
- [ ] Arquivar em Recebida ou Em análise leva a Encerrada com "Arquivada: motivo", autor e data; arquivar em Atendida ou Encerrada mantém a etapa
- [ ] Clicar duas vezes em arquivar grava um único evento
- [ ] Depois de arquivar, a denúncia e suas fotos saem do mapa e das URLs públicas
- [ ] O agente continua vendo o registro e o motivo
- [ ] Uma retentativa antiga de publicação não traz a denúncia de volta
- [ ] A denúncia arquivada mostra os dias que faltam para a remoção
- [ ] Com a data simulada 30 dias depois, a rotina remove registro, dados privados, visitas, histórico e fotos dos dois buckets; antes disso, nada é removido
- [ ] Denúncia devolvida ao mapa dentro do prazo não é removida
- [ ] Denúncia que nunca foi arquivada continua no banco, com as visitas, mesmo depois de muito tempo
- [ ] Depois de restaurar uma cópia de teste, a rotina remove de novo as denúncias arquivadas há mais de 30 dias

**AC-13 · Volta ao mapa** (RF-AGE-06, RNF-06)
- [ ] Voltar ao mapa exige ação explícita, mantém a etapa e registra as duas decisões no histórico
- [ ] Devolver ao mapa uma denúncia já removida não é possível

**AC-14 · Correção** (RF-COR-01, RNF-03, RNF-05, RNF-09)
- [ ] O agente corrige uma denúncia em qualquer etapa, com motivo
- [ ] O agente corrige onde está o foco, água acumulada, recipiente ou estrutura e larvas ou pupas; há quanto tempo percebeu e a outra evidência não aparecem para edição
- [ ] O cidadão corrige a própria denúncia enquanto ela está Recebida
- [ ] Depois do início da análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato
- [ ] O cidadão não acessa denúncias de outras pessoas
- [ ] Informar o protocolo e confirmar o código enviado ao contato confirmado libera a edição
- [ ] Protocolo inexistente e protocolo sem vínculo recebem a mesma resposta
- [ ] O código vale uma vez, só para aquele registro, e os pedidos têm limite
- [ ] Trocar o contato confirmado é recusado quando vem do agente (só a equipe do projeto troca, direto no Supabase)
- [ ] O valor original e o motivo ficam no histórico; protocolo, etapa e visibilidade não mudam

**AC-15 · Sem acesso e encerramento** (RF-AGE-03, RF-AGE-07)
- [ ] Visita com "Imóvel fechado" mantém Em análise, registra "Visita sem acesso" no histórico e mostra "Sem acesso (1 tentativa)" na lista
- [ ] O filtro "Sem acesso" mostra só ocorrências Em análise com pelo menos uma tentativa; Encerrada sem acesso não aparece nele
- [ ] Com uma ou duas tentativas, "Encerrar sem acesso" não aparece, e a chamada direta ao serviço é recusada
- [ ] Na terceira tentativa, o botão aparece; ao confirmar, a ocorrência fica Encerrada com o motivo e o número de tentativas
- [ ] Encerrada sem acesso não reabre, não aceita visita e aparece como Encerrada no mapa público enquanto não for arquivada

**AC-16 · Relatório** (RF-AGE-08, RNF-12)
- [ ] Gerar PDF e Word do mês atual, para todos os bairros e para um bairro
- [ ] As recebidas do relatório batem com a lista filtrada pelo mesmo período e bairro, e as pendentes com a lista filtrada por bairro e pelas etapas Recebida e Em análise
- [ ] O resumo separa denúncias de cidadãos de registros de agentes, e Encerradas sem acesso de Arquivadas
- [ ] Os recipientes com água aparecem pelos nomes do formulário, sem códigos
- [ ] Buscar no texto do PDF e do Word pelo nome, e-mail e telefone de teste do morador: nenhum aparece
- [ ] Período sem visitas gera o arquivo com o aviso "Nenhuma visita no período"
- [ ] O PDF abre num leitor comum; o Word abre no Microsoft Word e no LibreOffice e pode ser editado
- [ ] A geração funciona no celular (390px) e no computador

**AC-17 · Foco em local sem denúncia** (RF-AGE-10, RF-MAP-01)
- [ ] Em "Registrar visita", o agente escolhe "Local sem denúncia" e preenche local, o que encontrou, descrição, fotos e o que foi feito
- [ ] Campo obrigatório vazio impede o envio e indica o campo; ponto fora de Itambé é recusado
- [ ] A ocorrência nasce Atendida, com origem agente, protocolo e uma visita em nome do agente
- [ ] No mapa público, ela aparece como "feita por agente", com foto e descrição, sem o nome do agente
- [ ] Clicar duas vezes em confirmar cria uma única ocorrência
- [ ] Conta sem papel de agente não cria o registro, nem por chamada direta ao serviço
- [ ] O registro entra no relatório como registro de agente

### Interface

**AC-12 · Interfaces** (RNF-01, RNF-02, D35, D36)
- [ ] A denúncia vai da tela Início ao resultado sem conteúdo cortado, com os estados de erro dentro da mesma etapa
- [ ] Todas as jornadas funcionam em 320, 390, 768 e 1440px
- [ ] Todas as jornadas funcionam só com o teclado
- [ ] Etapas indicadas por texto, não só por cor

## 4. Teste de ponta a ponta

Roteiro completo, executado antes de cada entrega de fase e antes do lançamento:

```
Abrir o site → Início: denunciar → preencher local, foco, fotos e dados → confirmar o código
→ revisar e enviar → anotar protocolo
→ recarregar → ver a denúncia no mapa → entrar como agente → encontrar pelo protocolo
→ iniciar análise e registrar visita sem acesso → registrar observação → registrar visita
com acesso → ver "Atendida" no mapa → arquivar → confirmar que saiu do mapa → voltar ao mapa
→ registrar foco em local sem denúncia → ver "feita por agente" no mapa
→ baixar o relatório do mês em PDF e Word → conferir as visitas no relatório → sair
```

Quando o projeto tiver `package.json`, esse roteiro pode ser automatizado com Playwright, e as políticas de RLS testadas no Supabase local. Até lá, ele é executado à mão.

## 5. Antes do lançamento

- [ ] AC-01 a AC-17 aprovados no ambiente de teste, com evidências
- [ ] Mesmo roteiro de ponta a ponta executado no endereço publicado, não só no computador local
- [ ] Testes de página recarregada, endereço direto, usuário sem login, rede lenta e banco vazio
- [ ] Lista de verificação do [SECURITY.md](./SECURITY.md) concluída
