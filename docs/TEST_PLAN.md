# Aedes Data Lab: Plano de testes

Este plano define o que significa "funcionando" para cada parte da V1. Os cenários AC-01 a AC-16 são os critérios de aceite do [PRD](./PRD.md), seção 15; aqui eles viram passos que qualquer pessoa da equipe consegue executar e repetir.

## 1. Como testar

- Teste sempre com dados fictícios: nomes inventados e CPFs gerados para teste, nunca dados de pessoas reais.
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
3. Em "Seus dados para o registro", preencher nome, CPF, e-mail e telefone de teste.
4. Escolher onde receber o código e digitar o código recebido.
5. Revisar e enviar.
6. Esperado: protocolo exibido; depois de recarregar, a denúncia continua gravada.

Repetir o cenário três vezes, uma por canal: e-mail, telefone com SMS e telefone com WhatsApp.

**AC-02 · Entrada inválida** (RF-AUT-01, RF-DEN-01 a RF-DEN-03)
- [ ] A escolha do canal do código só aparece depois dos dados do cidadão
- [ ] E-mail escolhido abre direto a tela do código; telefone oferece SMS e WhatsApp antes
- [ ] Sem código, com código errado ou expirado, a revisão e o envio não são liberados
- [ ] Confirmar um canal não marca o outro contato como confirmado
- [ ] Campo obrigatório vazio, inclusive e-mail ou telefone, mostra erro no próprio campo
- [ ] CPF, e-mail ou telefone malformado mostra erro no próprio campo
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
- [ ] Denúncias atendidas continuam no mapa
- [ ] Filtros por localidade, período e etapa mostram o mesmo recorte nos marcadores e na lista
- [ ] "Sem denúncias", "sem resultado para os filtros" e "erro ao carregar" aparecem como mensagens diferentes
- [ ] A lista dos agentes carrega em páginas

**AC-07 · Privacidade** (RF-MAP-01, RNF-05, RNF-10)
- [ ] Na aba Rede do navegador, nenhuma resposta pública contém nome, CPF, e-mail, telefone, referência ou ponto exato
- [ ] As fotos públicas não têm coordenadas nem dados da câmera
- [ ] Logs e métricas não registram dados pessoais

### Área dos agentes

**AC-08 · Permissões** (RF-AUT-02, RNF-03)
- [ ] Visitante não abre o detalhe privado, nem pelo endereço direto da página
- [ ] Conta revogada perde o acesso na próxima operação
- [ ] Chamada direta ao serviço sem login é negada

**AC-09 · Atendimento** (RF-AGE-01 a RF-AGE-03, RF-AGE-05, RNF-11)
- [ ] Abrir e fechar o detalhe não muda a etapa
- [ ] A lista mostra o resumo por etapa, os dias em aberto e começa pelas mais antigas
- [ ] Lista e mapa de Ocorrências mostram o mesmo recorte com os mesmos filtros
- [ ] "Como chegar" abre o aplicativo de mapas no ponto exato
- [ ] O aviso de ocorrências próximas aparece para uma denúncia a 100 m e não para uma a 200 m
- [ ] "Registrar visita" só aparece com a ocorrência Em análise
- [ ] Visita com acesso sem tipo do local, sem resposta de foco ou sem ação é recusada, com o erro no campo
- [ ] Foco = Sim sem nenhum depósito marcado é recusado
- [ ] Data futura ou anterior ao recebimento é recusada
- [ ] Visita com acesso completa mostra o resumo, e depois de confirmar a ocorrência fica Atendida
- [ ] Observação registrada fica no histórico e não muda a etapa
- [ ] Ocorrência Atendida não volta para Em análise e não aceita nova visita
- [ ] Com a rede cortada, o envio da visita falha e o formulário continua preenchido; ao reenviar, a visita é gravada uma vez só
- [ ] O formulário de visita funciona em 320px, com as opções de toque de pelo menos 44px

**AC-10 · Concorrência** (RF-AGE-02, RF-AGE-03, RF-AGE-07, RNF-09)
- [ ] Duas abas agindo na mesma ocorrência: a ação feita com a tela desatualizada é recusada, sem apagar a outra
- [ ] Clicar duas vezes em confirmar a visita grava uma única visita

**AC-11 · Ocultação** (RF-AGE-04, RNF-06)
- [ ] Depois de ocultar, a denúncia e suas fotos saem do mapa e das URLs públicas
- [ ] O agente continua vendo o registro e o motivo
- [ ] Uma retentativa antiga de publicação não traz a denúncia de volta

**AC-13 · Republicação** (RF-AGE-06, RNF-06)
- [ ] Republicar exige ação explícita, mantém a etapa e registra as duas decisões no histórico

**AC-14 · Correção** (RF-COR-01, RNF-03, RNF-05, RNF-09)
- [ ] O administrador corrige uma denúncia em qualquer etapa
- [ ] O cidadão corrige a própria denúncia enquanto ela está Recebida
- [ ] Depois do início da análise, a correção do cidadão é recusada com orientação para usar o e-mail de contato
- [ ] O cidadão não acessa denúncias de outras pessoas
- [ ] O valor original e o motivo ficam no histórico; protocolo, etapa e visibilidade não mudam

**AC-15 · Sem acesso e encerramento** (RF-AGE-03, RF-AGE-07)
- [ ] Visita com "Imóvel fechado" mantém Em análise, registra "Visita sem acesso" no histórico e mostra "Sem acesso (1 tentativa)" na lista
- [ ] O filtro "Sem acesso" mostra só ocorrências com tentativa
- [ ] Com uma ou duas tentativas, "Encerrar sem acesso" não aparece, e a chamada direta ao serviço é recusada
- [ ] Na terceira tentativa, o botão aparece; ao confirmar, a ocorrência fica Encerrada com o motivo e o número de tentativas
- [ ] Encerrada não reabre, não aceita visita e aparece como Encerrada no mapa público

**AC-16 · Relatório** (RF-AGE-08, RNF-12)
- [ ] Gerar PDF e Word do mês atual, para todos os bairros e para um bairro
- [ ] Os totais do relatório batem com a lista filtrada pelo mesmo período e bairro
- [ ] Buscar no texto do PDF e do Word pelo nome, CPF, e-mail e telefone de teste do morador: nenhum aparece
- [ ] Período sem visitas gera o arquivo com o aviso "Nenhuma visita no período"
- [ ] O PDF abre num leitor comum; o Word abre no Microsoft Word e no LibreOffice e pode ser editado
- [ ] A geração funciona no celular (390px) e no computador

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
→ iniciar análise → registrar observação → registrar visita sem acesso → registrar visita
com acesso → ver "Atendida" no mapa → ocultar → confirmar que saiu do mapa → republicar
→ baixar o relatório do mês em PDF e Word → conferir a visita no relatório → sair
```

Quando o projeto tiver `package.json`, esse roteiro pode ser automatizado com Playwright, e as políticas de RLS testadas no Supabase local. Até lá, ele é executado à mão.

## 5. Antes do lançamento

- [ ] AC-01 a AC-16 aprovados no ambiente de teste, com evidências
- [ ] Mesmo roteiro de ponta a ponta executado no endereço publicado, não só no computador local
- [ ] Testes de página recarregada, endereço direto, usuário sem login, rede lenta e banco vazio
- [ ] Lista de verificação do [SECURITY.md](./SECURITY.md) concluída
