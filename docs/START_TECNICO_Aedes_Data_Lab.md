# Start técnico — Aedes Data Lab

**Estado:** plano técnico proposto, alinhado ao PRD 1.2; serviços ainda não implementados
**Versão:** 1.2 — 05/11/2026
**Produto:** [PRD do Aedes](./PRD_Aedes_Data_Lab.md)

## 1. O que existe hoje

A base `main` inspecionada em 05/11/2026, commit `70bf8c2`, contém páginas HTML iniciais em `site/`, um CSS compartilhado e JavaScript por tela. Nessa base não há envio funcional, banco integrado, autenticação, publicação no mapa ou dashboard alimentado por dados. Isso não é auditoria das branches das integrantes ou de um ambiente publicado. O PR #2 exige revisão antes de integração. ADL-86 a ADL-89 tratam o HTML das primeiras quatro telas; esses cartões não comprovam implementação.

O objetivo técnico da V1 é o percurso **formulário → confirmação e persistência → projeção pública → mapa → Ocorrências do agente → atualização de etapa e ocultação**. Dashboard e gráficos ficam para depois.

## 2. Direção arquitetural

Manter HTML, CSS único compartilhado e JavaScript modular. Firebase é a direção escolhida. Firestore, Authentication, Storage, Functions e Emulator Suite são proposta de composição, dependente de modelagem, custo e regras. Vite pode ser introduzido para desenvolvimento local quando for útil; não exige reescrever as páginas. Leaflet pode renderizar mapas, mas o provedor da camada visual ainda precisa ser escolhido. Chart.js só entra com o dashboard posterior.

| Camada | Responsabilidade |
|---|---|
| Páginas | Formulário, mensagens, mapa e operações do agente |
| Domínio | Validação, etapas, datas, território, aproximação pública e regras de publicação |
| Serviços cliente | Chamar operações de envio, listagem e atendimento |
| Backend/regras | Validar, autorizar, persistir, separar dados e produzir projeção pública |

Evitar consultas diretas espalhadas entre telas. Contratos iniciais: `confirmarEmail`, `salvarDenuncia`, `listarDenunciasPublicas`, `listarOcorrencias`, `iniciarAnalise`, `registrarObservacao`, `concluirOcorrencia`, `ocultarPublicacao`, `republicarOcorrencia` e `corrigirCamposDenuncia`. O último permite administrador autorizado ou cidadão com vínculo verificado com aquela denúncia. Possuir somente papel de agente não concede permissão de correção dos campos enviados.

## 3. Modelo inicial de dados

| Recurso proposto | Conteúdo | Acesso |
|---|---|---|
| `reports/{id}` | Relato operacional, ponto exato, bairro, categoria, etapa e datas | Agentes autorizados |
| `report_private/{id}` | Nome, CPF declarado, e-mail confirmado e telefone opcional | Agentes autorizados conforme necessidade |
| `public_reports/{id}` | Área aproximada, categoria, data, etapa, foto e descrição publicáveis | Leitura pública |
| `report_events/{id}` | Início de análise, observações, atendimento, ocultação, republicação e correções com autor/data | Histórico privado conforme necessidade; nunca público |
| `users/{uid}` | Habilitação e papel técnico | Acesso mínimo |
| Storage | Originais restritos e versões públicas de fotos | Regras distintas |

Esse modelo não é esquema final. O CPF é obrigatório por decisão do usuário, mas **não autentica identidade**. Não devolver nenhum caractere de CPF, e-mail ou nome em `public_reports`. Foto pública deve ser produzida sem metadados pessoais. Descrição livre pode conter identificação incidental; a V1 publica automaticamente, portanto a ocultação precisa funcionar.

## 4. Fluxos técnicos V1

### Envio

1. Confirmar acesso ao e-mail para a denúncia, sem criar conta permanente de cidadão. Vincular a confirmação à tentativa; confirmar no início é proposta de interface, e o requisito obrigatório é confirmar antes de aceitar o envio. Expiração, reenvio e limites de tentativas precisam ser configurados.
2. Coletar local exato, bairro, categoria, descrição, uma a três fotos, nome, CPF e telefone opcional.
3. Validar território, tipos/tamanho de arquivo e dados no servidor. A validação no cliente apenas orienta.
4. Usar ID estável da tentativa. Reservar estado pendente, receber fotos em área restrita, finalizar registro e gerar protocolo.
5. Criar versão pública com **posição aproximada** e fotos tratadas. O agente tem acesso ao registro recebido imediatamente.
6. Se a publicação falhar, manter protocolo e informar “publicação pendente”, com recuperação segura. Não criar outra denúncia ao repetir a tentativa.

Firestore e Storage não compartilham transação única. Estados técnicos pendente/finalizado/publicação pendente não substituem Recebida/Em análise/Atendida. Reenvio e retentativas do backend precisam ser idempotentes.

### Mapa público

Consultar somente a projeção pública. Mostrar foto, descrição, categoria, data, etapa e área aproximada. Incluir atendidas, exceto conteúdo ocultado. A aproximação deve evitar revelar o ponto exato e não deslocar o marcador para localidade incorreta. Método e precisão ainda pendentes. Não expor o documento privado ao navegador para depois esconder campos na tela.

### Ocorrências do agente

O administrador autoriza, revoga e apoia recuperação das contas. Todos os agentes autorizados podem consultar todas as ocorrências de Itambé e os campos privados, inclusive CPF completo. Visitantes continuam sem esse acesso. Abrir detalhe não altera etapa. “Iniciar análise” e “Atendida” são operações explícitas com autor/data; conclusão exige visita e análise do local, data, ação e observações. Se não resolver, manter Em análise e permitir novas observações internas com autor/data.

O autor de uma mudança não se torna responsável exclusivo pela ocorrência. Relatos distintos no mesmo local permanecem separados; mapa operacional preciso ajuda a reconhecê-los, sem fusão ou alteração automática em lote. Conferir etapa/versão atual ao salvar para não sobrescrever outra ação concorrente. Negar operações ao visitante e ao agente desabilitado no backend/regras.

Ocultar publicação exige motivo e não apaga o registro interno nem muda a etapa de atendimento. A proposta mínima da V1 oculta a publicação inteira, incluindo o acesso público às mídias. Uma tarefa de publicação antiga não pode desfazer ocultação. Retirar somente o marcador é insuficiente se a imagem continuar acessível pela URL antiga. Cópias já baixadas por terceiros não podem ser recuperadas pelo sistema.

Manter estados separados para envio, atendimento e publicação. Recebida/Em análise/Atendida descrevem atendimento; pendente/publicada/oculta descrevem visibilidade. Ocorrências não reabrem, mesmo em conclusão por engano ou reincidência: será necessário novo relato.

Agente pode republicar após revisão e eventual correção pelo administrador ou cidadão responsável pelo envio. Registrar a versão da decisão de publicação para que tarefa antiga não substitua ocultação/republicação mais recente. Republicar nunca altera etapa de atendimento.

Administrador e cidadão responsável pelo envio podem corrigir os campos enviados. Para o cidadão, verificar acesso ao e-mail confirmado associado à denúncia e emitir autorização de edição restrita ao registro, com expiração e proteção contra reutilização indevida, sem exigir conta permanente. Protocolo, CPF ou e-mail digitado isoladamente não autorizam acesso. Limitar leitura/edição aos campos da própria denúncia, sem liberar notas e histórico operacional.

Preservar original, motivo e autor/data em histórico privado. Correção de registro oculto não o republica; correção de registro publicado atualiza apenas a projeção permitida. Trocar e-mail não herda a confirmação do endereço anterior: preservar autoria e confirmar o novo endereço antes de utilizá-lo em autorizações futuras. Diferenciar essa operação das observações e mudanças de atendimento permitidas aos agentes. O mecanismo de acesso à correção é proposta técnica e ainda não está implementado.

## 5. Sequência de trabalho

1. **HTML e navegação:** concluir páginas iniciais e menu compartilhado; cada integrante demonstra e explica sua tela.
2. **Contrato com dados fictícios:** definir formato de denúncia e fazer formulário, lista e mapa consumirem uma fonte única.
3. **Formulário e mapa locais:** ponto manual/GPS, fotos, revisão, estados de erro; mapa centralizado em Itambé sem exigir GPS.
4. **Emuladores Firebase:** criar ambiente separado do Repecol, modelar público/privado, autenticação do agente e testes de acesso negado.
5. **Envio real:** confirmação de e-mail, upload, persistência, protocolo, projeção pública, falhas parciais e reenvio.
6. **Ocorrências:** login, lista, detalhe/consulta espacial, análise, observações, conclusão após visita, histórico, ocultação e republicação; correção pelo administrador e pelo cidadão com vínculo verificado com o próprio envio.
7. **Validação V1:** percorrer critérios de aceite do PRD; inspecionar respostas de rede e testar retirada rápida de conteúdo.
8. **Fase posterior:** dashboard e gráficos da mesma base. Mapa técnico dedicado, visitas e outros complementos dependem de decisão própria e não são compromissos automáticos da fase seguinte.

Cada entrega deve ser pequena, revisada por outra integrante e demonstrável. As quatro alunas programam HTML/CSS/JS das respectivas telas; banco e integrações são trabalho de aprendizagem conjunta. Cartões Jira existentes não devem ser confundidos com módulos concluídos.

## 6. Verificações indispensáveis antes da abertura pública

Usar os cenários AC-01 a AC-14 do PRD como roteiro de aceite; os requisitos RF e RNF permitem rastrear o resultado de cada teste. As dependências DEP-01 a DEP-11 identificam decisões/configurações de implantação, sem tratá-las como implementação concluída.

- Fonte de limites de Itambé e regra de aproximação pública escolhidas e testadas.
- Identidade/contato/CPF ausentes da resposta pública, inclusive URLs e metadados de foto.
- Conta de agente revogável, operações protegidas e trilha de mudanças.
- Ocultação/republicação testadas e pessoa responsável com rotina diária designada; o administrador ainda não definiu quem fará a conferência e substituição. Criar e-mail para reclamações/correção/retirada.
- A administração e a instituição assumem o serviço; identificar instituição e formalizar o vínculo. Registrar preferência de retenção indefinida, fechando política por tipo de dado e solicitações sobre dados sem prometer guarda eterna gratuita.
- Provedor de mapas, estimativa de volume/custo, limites e monitoramento acertados. Baixo custo, idealmente zero, é objetivo; teto financeiro e reação ao atingir cotas continuam pendentes.
- Mensagem pública clara: canal ainda não oficial sem autorização; denúncia não garante vistoria nem prazo.

O usuário quer abrir para moradores reais, sem grupo fechado. O administrador aprova a abertura e assume manutenção. Ausência de agentes por vários dias não suspende novos envios por si só; não informar atendimento ou prazo garantido. Esses itens são preparação para essa abertura, não requisitos já implementados.

Ainda precisam de definição de produto: quem os dados representam no envio em nome de terceiros; desfecho de denúncia inválida sem visita; obrigatoriedade do endereço textual. Detecção de imagens indevidas permanece ideia futura, sem implementação na V1.

## 7. Referências e limites

- [PRD deste repositório](./PRD_Aedes_Data_Lab.md).
- [Jira ADL-85](https://aedesdatalab.atlassian.net/browse/ADL-85) e cartões de design/HTML.
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), protótipo.
- Roteiro de aprendizagem no segundo cérebro do usuário, atualizado em 24/10/2026.
- PRD do Repecol consultado apenas como modelo de estrutura; território, perfis extras, chat, comércio e dados daquele projeto não são requisitos do Aedes.

Nenhum serviço foi configurado nem testado por este documento. A direção HTML/CSS/JS + Firebase é decisão do projeto; bibliotecas, coleções e operações acima são proposta para revisão.
