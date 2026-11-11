# Aedes Data Lab: Plano de testes

Este plano define o que significa "funcionando" para cada parte da V1. Os cenários AC-01 a AC-14 são os critérios de aceite do [PRD](./PRD.md), seção 15; aqui eles viram passos que qualquer pessoa da equipe consegue executar e repetir.

## 1. Como testar

- Teste sempre com dados fictícios: nomes inventados e CPFs gerados para teste, nunca dados de pessoas reais.
- Até a Fase 6 de [TASKS.md](../TASKS.md), os testes usam o serviço fictício; depois, o Firebase Emulator Suite e o projeto de teste.
- Cada execução registra a data, a versão testada (commit ou PR), o resultado e o que ficou de fora, no próprio PR.
- Telas do Figma não substituem teste. O teste é feito no site.

## 2. Verificação de cada tarefa

Antes de abrir o PR de qualquer tarefa:

- [ ] A página abre sem erro no console do navegador
- [ ] A tela confere com o wireframe e com o [DESIGN.md](./DESIGN.md)
- [ ] Sem rolagem horizontal em 320, 390, 768 e 1440px
- [ ] Dá para usar só com o teclado, com o foco visível
- [ ] Estados de carregando, vazio e erro aparecem quando devem
- [ ] Nenhum dado pessoal real ou chave no código

## 3. Cenários de aceite da V1

### Denúncia

**AC-01 · Envio válido** (RF-AUT-01, RF-DEN-01 a RF-DEN-04)
1. Abrir Registrar foco e confirmar o e-mail.
2. Marcar um ponto dentro de Itambé, preencher categoria, descrição, uma foto, nome e CPF de teste.
3. Revisar e enviar.
4. Esperado: protocolo exibido; depois de recarregar, a denúncia continua gravada.

**AC-02 · Entrada inválida** (RF-AUT-01, RF-DEN-01 a RF-DEN-03)
- [ ] Sem confirmar o e-mail, o envio não é aceito
- [ ] Campo obrigatório vazio mostra erro no próprio campo
- [ ] Arquivo que não é imagem, ou acima do limite, é recusado com explicação
- [ ] Ponto fora de Itambé é recusado, mesmo trocando o bairro digitado

**AC-03 · GPS negado** (RF-DEN-02)
- [ ] Negar a permissão de localização e marcar o ponto à mão, sem perder o que já foi preenchido

**AC-04 · Rede e reenvio** (RF-DEN-03 a RF-DEN-05, RNF-04, RNF-08)
- [ ] Clicar duas vezes em Enviar gera um único protocolo
- [ ] Cortar a rede antes da gravação mostra "Não foi possível enviar" e mantém o formulário
- [ ] Cortar a rede depois da gravação permite recuperar o mesmo protocolo
- [ ] Repetir confirmações de e-mail além do limite é bloqueado pelo serviço

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

**AC-09 · Atendimento** (RF-AGE-01 a RF-AGE-03, RF-AGE-05)
- [ ] Abrir e fechar o detalhe não muda a etapa
- [ ] Concluir exige visita, data, ação realizada e observações
- [ ] Sem solução, a ocorrência fica Em análise com a observação registrada
- [ ] Ocorrência Atendida não volta para Em análise

**AC-10 · Concorrência** (RF-AGE-02, RF-AGE-03, RNF-09)
- [ ] Duas pessoas agindo na mesma ocorrência: a ação feita com a tela desatualizada é recusada, sem apagar a outra

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

### Interface

**AC-12 · Interfaces** (RNF-01, RNF-02)
- [ ] Todas as jornadas funcionam em 320, 390, 768 e 1440px
- [ ] Todas as jornadas funcionam só com o teclado
- [ ] Etapas indicadas por texto, não só por cor

## 4. Teste de ponta a ponta

Roteiro completo, executado antes de cada entrega de fase e antes do lançamento:

```
Abrir o site → Registrar foco → confirmar e-mail → enviar denúncia → anotar protocolo
→ recarregar → ver a denúncia no mapa → entrar como agente → encontrar pelo protocolo
→ iniciar análise → registrar observação → concluir após visita → ver "Atendida" no mapa
→ ocultar → confirmar que saiu do mapa → republicar → sair
```

Quando o projeto tiver `package.json`, esse roteiro pode ser automatizado com Playwright, e as regras do Firestore testadas no Emulator Suite. Até lá, ele é executado à mão.

## 5. Antes do lançamento

- [ ] AC-01 a AC-14 aprovados no ambiente de teste, com evidências
- [ ] Mesmo roteiro de ponta a ponta executado no endereço publicado, não só no computador local
- [ ] Testes de página recarregada, endereço direto, usuário sem login, rede lenta e banco vazio
- [ ] Lista de verificação do [SECURITY.md](./SECURITY.md) concluída
