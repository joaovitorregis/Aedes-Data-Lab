# Start técnico — Aedes Data Lab

**Estado:** proposta de implementação, não sistema pronto  
**Data:** 04/11/2026  
**Documento de produto:** [PRD](./PRD_Aedes_Data_Lab.md)

## 1. Ponto de partida verificado

O repositório tem 12 páginas HTML iniciais em `site/`, um CSS compartilhado e scripts por tela. A estrutura é didática; não há envio funcional, banco integrado, autenticação, mapa operacional ou dashboard alimentado por dados. A branch `main` exige pull request e uma aprovação. A primeira entrega de desenvolvimento no Jira está concentrada no HTML de Início, Registrar Foco/Denúncia, Jogo e Guia Aedes (ADL-86 a ADL-89).

## 2. Arquitetura proposta

Manter HTML, CSS compartilhado e JavaScript modular. Usar uma fonte única para dados de denúncia consumida por lista, mapa e dashboard. Vite é uma opção de ferramenta local, a introduzir quando dependências exigirem; não refazer as páginas só para adotá-lo. Firebase é a direção aceita para persistência e acesso. Firestore, Authentication, Storage, Functions e Emulator Suite formam a proposta técnica, sujeita a custo e modelagem finais. Leaflet pode renderizar mapas; provedor de camada visual ainda precisa ser escolhido. Chart.js pode renderizar gráficos depois que as métricas estiverem corretas.

### Limites entre módulos

| Módulo | Responsabilidade |
|---|---|
| Tela | Capturar entrada, mostrar estado e chamar serviços |
| Domínio | Validar campos, normalizar status/datas, calcular filtros e métricas |
| Serviços | Enviar, listar e atualizar denúncias; autenticar agentes |
| Backend e regras | Validar operações, proteger dados privados e publicar projeção pública |

Não copiar consultas Firestore para cada tela. Definir contratos pequenos: `salvarDenuncia`, `listarDenunciasPublicas`, `listarOcorrencias`, `concluirOcorrencia`, `calcularIndicadores`.

## 3. Modelo inicial para discutir

| Recurso | Conteúdo | Leitura |
|---|---|---|
| `reports/{id}` | Relato operacional, localização, categoria, datas, etapa e fotos referenciadas | Agentes autorizados |
| `report_private/{id}` | Identidade e contato definidos no formulário final | Agentes autorizados |
| `public_reports/{id}` | Somente campos aprovados, foto/descrição tratadas e coordenada conforme decisão | Público |
| `report_events/{id}` | Histórico de mudança e ação do agente | Agentes autorizados |
| `users/{uid}` | Perfil técnico e papel | Acesso mínimo por papel |
| Storage | Originais privados e derivados públicos de imagens | Regras por finalidade |

Este modelo ainda não é esquema aprovado. O navegador público deve consultar somente `public_reports`. O backend cria a projeção pública; o cliente não escreve dados públicos livremente. Regras de Firestore não ocultam campos dentro de um mesmo documento, por isso a separação é estrutural.

## 4. Sequência de entregas

1. **Base local:** concluir HTML das quatro telas iniciais, menu e CSS comum; demonstrar navegação e revisão por outra integrante.
2. **Contrato com dados fictícios:** uma lista de denúncias de exemplo alimenta formulário, lista, mapa e indicadores; definir IDs, datas, bairro, categoria e etapas.
3. **Formulário e mapa locais:** seleção manual/GPS, fotos, revisão, validação e falhas simuladas. O mapa inicia centralizado em Itambé sem depender de GPS.
4. **Firebase em emuladores:** separar projeto do Aedes, definir regras, usuários técnicos e dados públicos/privados. Testar acesso negado antes de dados reais.
5. **Envio real:** identificador estável por tentativa, upload restrito, validação no servidor, persistência, projeção pública e protocolo. Tratar falha entre Storage e Firestore sem criar duplicatas.
6. **Área do agente:** login autorizado, consulta, filtros, detalhe, histórico, conclusão e atualização da projeção pública.
7. **Dashboard:** métricas da mesma base, filtros de período/bairro/situação, comparação opcional e estados vazio/erro.
8. **Demonstração integrada:** percorrer o critério de aceite do PRD, incluindo GPS negado, rede interrompida, reenvio e acesso indevido.

Cada etapa pede uma demonstração observável e revisão em pull request. A divisão de trabalho do Jira não deve ser tratada como prova de código entregue.

## 5. Decisões que bloqueiam a integração real

- Forma de entrada/identificação do cidadão e campos finais de contato.
- Precisão pública do ponto e tratamento de fotos/metadados.
- Fonte do território de Itambé e lista de localidades.
- Plano de custos de Storage/Functions e provedor de mapas.
- Regras de moderação, retenção e retirada de relatos públicos.

Sem essas decisões, é possível avançar nas páginas e nos dados fictícios; publicar relatos reais ou abrir escrita no Firestore seria uma decisão de produto e de privacidade tomada por acidente.

## 6. Referências

- [PRD deste repositório](./PRD_Aedes_Data_Lab.md)
- [Jira ADL-85 — Desenvolvimento do website](https://aedesdatalab.atlassian.net/browse/ADL-85)
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y)
- Roteiro de aprendizagem e desenvolvimento no segundo cérebro do projeto, atualizado em 24/10/2026.

As ferramentas e serviços citados aqui são proposta técnica, exceto a direção HTML/CSS/JS + Firebase já escolhida. Não houve teste de implementação desses serviços neste documento.
