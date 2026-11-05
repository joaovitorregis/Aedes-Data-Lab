# Start técnico — Aedes Data Lab

**Estado:** plano técnico proposto; serviços ainda não implementados
**Versão:** 0.2 — 04/11/2026
**Produto:** [PRD do Aedes](./PRD_Aedes_Data_Lab.md)

## 1. O que existe hoje

O repositório tem 12 páginas HTML iniciais em `site/`, um CSS compartilhado e JavaScript por tela. Não há envio funcional, banco integrado, autenticação, publicação no mapa ou dashboard alimentado por dados. A `main` exige pull request e uma aprovação. ADL-86 a ADL-89 tratam o HTML das primeiras quatro telas; esses cartões não comprovam implementação.

O objetivo técnico da V1 é o percurso **formulário → confirmação e persistência → projeção pública → mapa → Ocorrências do agente → atualização de etapa e ocultação**. Dashboard e gráficos ficam para depois.

## 2. Direção arquitetural

Manter HTML, CSS único compartilhado e JavaScript modular. Firebase é a direção escolhida. Firestore, Authentication, Storage, Functions e Emulator Suite são proposta de composição, dependente de modelagem, custo e regras. Vite pode ser introduzido para desenvolvimento local quando for útil; não exige reescrever as páginas. Leaflet pode renderizar mapas, mas o provedor da camada visual ainda precisa ser escolhido. Chart.js só entra com o dashboard posterior.

| Camada | Responsabilidade |
|---|---|
| Páginas | Formulário, mensagens, mapa e operações do agente |
| Domínio | Validação, etapas, datas, território, aproximação pública e regras de publicação |
| Serviços cliente | Chamar operações de envio, listagem e atendimento |
| Backend/regras | Validar, autorizar, persistir, separar dados e produzir projeção pública |

Evitar consultas diretas espalhadas entre telas. Contratos iniciais: `confirmarEmail`, `salvarDenuncia`, `listarDenunciasPublicas`, `listarOcorrencias`, `iniciarAnalise`, `concluirOcorrencia` e `ocultarPublicacao`.

## 3. Modelo inicial de dados

| Recurso proposto | Conteúdo | Acesso |
|---|---|---|
| `reports/{id}` | Relato operacional, ponto exato, bairro, categoria, etapa e datas | Agentes autorizados |
| `report_private/{id}` | Nome, CPF declarado, e-mail confirmado e telefone opcional | Agentes autorizados conforme necessidade |
| `public_reports/{id}` | Área aproximada, categoria, data, etapa, foto e descrição publicáveis | Leitura pública |
| `report_events/{id}` | Início de análise, atendimento, ocultação, motivo, autor e data | Agentes autorizados |
| `users/{uid}` | Habilitação e papel técnico | Acesso mínimo |
| Storage | Originais restritos e versões públicas de fotos | Regras distintas |

Esse modelo não é esquema final. O CPF é obrigatório por decisão do usuário, mas **não autentica identidade**. Não devolver nenhum caractere de CPF, e-mail ou nome em `public_reports`. Foto pública deve ser produzida sem metadados pessoais. Descrição livre pode conter identificação incidental; a V1 publica automaticamente, portanto a ocultação precisa funcionar.

## 4. Fluxos técnicos V1

### Envio

1. Confirmar acesso ao e-mail para a denúncia, sem criar conta permanente de cidadão.
2. Coletar local exato, bairro, categoria, descrição, uma a três fotos, nome, CPF e telefone opcional.
3. Validar território, tipos/tamanho de arquivo e dados no servidor. A validação no cliente apenas orienta.
4. Usar ID estável da tentativa. Reservar estado pendente, receber fotos em área restrita, finalizar registro e gerar protocolo.
5. Criar versão pública com **posição aproximada** e fotos tratadas. O agente tem acesso ao registro recebido imediatamente.
6. Se a publicação falhar, manter protocolo e informar “publicação pendente”, com recuperação segura. Não criar outra denúncia ao repetir a tentativa.

Firestore e Storage não compartilham transação única. Estados técnicos pendente/finalizado/publicação pendente não substituem Recebida/Em análise/Atendida. Reenvio e retentativas do backend precisam ser idempotentes.

### Mapa público

Consultar somente a projeção pública. Mostrar foto, descrição, categoria, data, etapa e área aproximada. Incluir atendidas, exceto conteúdo ocultado. A aproximação deve evitar revelar o ponto exato e não deslocar o marcador para localidade incorreta. Método e precisão ainda pendentes. Não expor o documento privado ao navegador para depois esconder campos na tela.

### Ocorrências do agente

Authentication identifica a conta; autorização verifica papel concedido por administrador designado. Abrir detalhe não altera etapa. “Iniciar análise” e “Atendida” são operações explícitas com autor/data; conclusão exige ação e observações. Ocultar publicação exige motivo e não apaga o registro interno. Negar operações ao visitante e ao agente desabilitado no backend/regras.

## 5. Sequência de trabalho

1. **HTML e navegação:** concluir páginas iniciais e menu compartilhado; cada integrante demonstra e explica sua tela.
2. **Contrato com dados fictícios:** definir formato de denúncia e fazer formulário, lista e mapa consumirem uma fonte única.
3. **Formulário e mapa locais:** ponto manual/GPS, fotos, revisão, estados de erro; mapa centralizado em Itambé sem exigir GPS.
4. **Emuladores Firebase:** criar ambiente separado do Repecol, modelar público/privado, autenticação do agente e testes de acesso negado.
5. **Envio real:** confirmação de e-mail, upload, persistência, protocolo, projeção pública, falhas parciais e reenvio.
6. **Ocorrências:** login, lista, detalhe, análise, conclusão, histórico e ocultação.
7. **Validação V1:** percorrer critérios de aceite do PRD; inspecionar respostas de rede e testar retirada rápida de conteúdo.
8. **Fase posterior:** dashboard e gráficos da mesma base; então mapa técnico, visitas e complementos aprovados.

Cada entrega deve ser pequena, revisada por outra integrante e demonstrável. As quatro alunas programam HTML/CSS/JS das respectivas telas; banco e integrações são trabalho de aprendizagem conjunta. Cartões Jira existentes não devem ser confundidos com módulos concluídos.

## 6. Verificações indispensáveis antes da abertura pública

- Fonte de limites de Itambé e regra de aproximação pública escolhidas e testadas.
- Identidade/contato/CPF ausentes da resposta pública, inclusive URLs e metadados de foto.
- Conta de agente revogável, operações protegidas e trilha de mudanças.
- Ocultação testada e pessoa responsável com rotina diária designada; cobertura fora do horário ainda precisa de decisão.
- Política de uso do CPF, retenção, solicitações sobre dados e organização responsável definida.
- Provedor de mapas, orçamento de Firebase/Storage/Functions, limites e monitoramento acertados.
- Mensagem pública clara: canal ainda não oficial sem autorização; denúncia não garante vistoria nem prazo.

O usuário quer abrir para moradores reais, sem grupo fechado. Esses itens são preparação para essa abertura, não requisitos já implementados.

## 7. Referências e limites

- [PRD deste repositório](./PRD_Aedes_Data_Lab.md).
- [Jira ADL-85](https://aedesdatalab.atlassian.net/browse/ADL-85) e cartões de design/HTML.
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), protótipo.
- Roteiro de aprendizagem no segundo cérebro do usuário, atualizado em 24/10/2026.
- PRD do Repecol consultado apenas como modelo de estrutura; território, perfis extras, chat, comércio e dados daquele projeto não são requisitos do Aedes.

Nenhum serviço foi configurado nem testado por este documento. A direção HTML/CSS/JS + Firebase é decisão do projeto; bibliotecas, coleções e operações acima são proposta para revisão.
