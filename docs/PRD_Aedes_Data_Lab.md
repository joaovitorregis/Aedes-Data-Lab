# PRD — Aedes Data Lab

**Estado:** rascunho para revisão; não é aprovação institucional
**Versão:** 0.2 — 04/11/2026
**Local pretendido:** Itambé/PE
**Referência:** estrutura do PRD do Repecol, sem herdar automaticamente seus requisitos

## 1. Resumo executivo

O Aedes Data Lab permitirá que moradores registrem possíveis focos do mosquito da dengue com localização, descrição e foto. O relato recebido será publicado automaticamente em um mapa com posição aproximada. Agentes autorizados verão o ponto exato e os dados privados, consultarão ocorrências e registrarão análise e atendimento.

A primeira entrega será aberta a moradores reais. Para ser aceita, precisa funcionar o caminho **denúncia → persistência → mapa público → Ocorrências dos agentes → atualização de etapa**. Dashboard e gráficos pertencem à fase seguinte. O sistema conta **relatos de possíveis focos**, não casos confirmados de dengue, inspeções feitas ou risco epidemiológico calculado.

## 2. Leitura deste documento

- **Decidido:** escolha explícita do usuário no contexto do projeto ou nesta revisão.
- **Proposto:** solução de implementação ainda sujeita à revisão.
- **Pendente:** decisão, responsável ou fonte ainda não definida.
- **Implementado:** código executado e verificado; protótipo Figma, cartão Jira e este PRD não são implementação.

Requisitos marcados **V1** integram a primeira entrega. **Posterior** identifica trabalho complementar. Este documento adapta a profundidade e a organização do PRD do Repecol; chat, comércio, produção e outros recursos daquele produto não passam automaticamente para o Aedes.

## 3. Problema, pessoas e objetivos

Moradores precisam indicar possíveis focos; agentes precisam acessar relatos para orientar sua atuação; visitantes precisam visualizar os relatos publicados. Contagens por área podem chamar atenção para mais denúncias, mas não comprovam incidência da doença nem justificam classificação automática de risco. A experiência deve funcionar em celular e computador.

| Perfil | Necessidade | Acesso |
|---|---|---|
| Visitante | Consultar mapa e conteúdo público | Sem conta |
| Morador | Enviar denúncia e receber protocolo | Confirma e-mail a cada denúncia; sem conta persistente na V1 |
| Agente | Consultar, iniciar análise, concluir e ocultar publicação | Login individual autorizado |
| Administrador de acesso | Autorizar e revogar contas de agente | Pessoa designada; ainda não identificada |

O uso operacional por agentes ainda não foi confirmado com eles. A instituição responsável pelo serviço também não foi identificada. O site não deve se declarar canal oficial sem autorização, nem prometer vistoria ou prazo de atendimento ainda não acordados.

### Objetivos V1

1. Receber relato dentro da área atendida de Itambé, confirmar recebimento real e gerar protocolo.
2. Persistir o registro, disponibilizá-lo aos agentes e publicar versão sem dados privados no mapa.
3. Permitir análise e conclusão por agente, com trilha de ações.
4. Permitir ocultação rápida de conteúdo público indevido sem apagar o relato interno.
5. Tratar falhas de GPS, rede, upload e repetição do envio sem confirmação falsa ou duplicação da tentativa.

### Medidas a acompanhar

Denúncias recebidas, proporção completa, falhas de envio, duplicações, tempo até análise, conteúdo ocultado e contagens de relatos por área. Metas, duração do piloto e critérios de sucesso operacional ainda estão pendentes. A contagem de denúncias não é métrica de casos confirmados.

## 4. Escopo da primeira entrega

### 4.1 Entrada e identificação

- **RF-AUT-01 · V1:** confirmar o e-mail para cada denúncia antes de aceitar o envio. O mecanismo técnico e sua validade ainda precisam ser desenhados.
- **RF-AUT-02 · V1:** exigir nome, CPF e e-mail confirmado; telefone é opcional. Esses campos são privados, sem qualquer versão parcial no mapa ou resposta pública.
- **RF-AUT-03 · V1:** CPF é informação declarada pelo morador. Conferir formato/dígitos ou situação cadastral não prova que a pessoa que preencheu é titular. Não exibir selo de “identidade verificada” por causa desse campo.
- **RF-AUT-04 · V1:** cada agente usa conta individual autorizada; não existe cadastro público de agente nem autoconcessão de privilégio.

### 4.2 Registro de foco

- **RF-DEN-01 · V1:** formulário guiado de localização, evidências/informações e revisão. Voltar uma etapa não apaga o preenchimento.
- **RF-DEN-02 · V1:** cidadão pode selecionar/corrigir o ponto manualmente; GPS é opcional e a localização do dispositivo não é assumida como local do foco.
- **RF-DEN-03 · V1:** aceitar somente pontos na área atendida de Itambé. A fonte de limites e localidades deve ser definida e testada.
- **RF-DEN-04 · V1:** exigir ponto, bairro/localidade, categoria, descrição, nome, CPF, e-mail confirmado e ao menos uma foto. Direção anterior: até três fotos. Lista de categorias, limites de arquivo e inconsistência entre ponto e bairro precisam de regra final.
- **RF-DEN-05 · V1:** informar claramente que foto e descrição serão publicadas automaticamente. O aviso não substitui mecanismos de retirada.
- **RF-DEN-06 · V1:** validar no cliente para orientar e no servidor para decidir. Confirmar apenas após persistência, gerar protocolo e reutilizar identificador da tentativa em reenvios.
- **RF-DEN-07 · V1:** se a publicação no mapa falhar após o recebimento, mostrar protocolo e estado “publicação pendente”; o agente ainda encontra a denúncia.

### 4.3 Mapa público

- **RF-MAP-01 · V1:** acesso sem conta; publicação automática após recebimento validado, incluindo relatos atendidos.
- **RF-MAP-02 · V1:** mostrar posição **aproximada**, categoria, data, etapa atual, foto e descrição. A técnica e precisão da aproximação serão testadas para evitar revelar o ponto exato ou deslocar o relato para outra localidade.
- **RF-MAP-03 · V1:** não devolver nome, CPF, caracteres do e-mail, telefone, ponto exato, histórico privado ou metadados pessoais de imagem na resposta pública.
- **RF-MAP-04 · V1:** filtros coerentes ao menos por localidade, data e etapa, com estados de carregamento, vazio e falha.
- **RF-MAP-05 · V1:** ocultação por agente remove a publicação, mas preserva registro interno e motivo. Botão público para sinalizar conteúdo fica fora da V1 por decisão do usuário.

### 4.4 Ocorrências dos agentes

- **RF-AGE-01 · V1:** lista e detalhe com filtros, estados de carregamento/erro/vazio, contato e ponto exato apenas para agente autorizado.
- **RF-AGE-02 · V1:** etapas **Recebida → Em análise → Atendida**. Abrir o detalhe não muda a etapa. “Iniciar análise” é ação explícita com agente e data registrados.
- **RF-AGE-03 · V1:** somente agente autorizado marca “Atendida”, registrando data, ação realizada e observações. O relato atendido continua no mapa, salvo ocultação justificada.
- **RF-AGE-04 · V1:** agente ou operador autorizado oculta conteúdo público imediatamente, com motivo, sem apagar evidência interna. Republicação, correção e contestação precisam de desenho posterior.
- **RF-AGE-05 · V1:** “responder” significa registrar análise, ação e resultado na ocorrência; não há mensagem individual ao cidadão na V1.

## 5. Jornadas principais

1. **Morador:** confirma e-mail → informa ponto/localidade → descreve e adiciona foto/categoria → informa nome, CPF e telefone opcional → revisa → envia → recebe protocolo e estado da publicação.
2. **Publicação:** serviço valida e persiste → cria projeção pública com área aproximada → mapa exibe relato. Falha de publicação não desfaz o recebimento confirmado.
3. **Agente:** login individual → Ocorrências → detalhe → “Iniciar análise” → registra ação e conclusão → etapa pública atualiza.
4. **Conteúdo indevido:** agente/operador encontra publicação inadequada → oculta rapidamente → registra motivo → registro interno permanece.

## 6. Regras de negócio

- Denúncia é relato, não diagnóstico ou caso confirmado.
- CPF obrigatório é decisão do usuário, mas não comprova titularidade; finalidade operacional concreta e avaliação de privacidade estão pendentes.
- E-mail confirmado prova acesso à caixa de entrada, não identidade civil.
- Estado técnico de upload/publicação não é etapa de atendimento.
- Toda mudança operacional registra agente e momento; simples leitura não muda a etapa.
- Contagens por área são informativas; não classificam automaticamente risco ou prioridade.
- Foto e descrição são públicas sem revisão prévia na V1. O formulário avisa; agente pode ocultar depois.
- Nenhum prazo de vistoria ou tratamento oficial deve ser prometido sem acordo operacional.

## 7. Dados e matriz de acesso — proposta

| Recurso | Dados | Acesso |
|---|---|---|
| `reports/{id}` | Relato operacional, ponto exato, categoria, bairro, etapa, datas | Agentes autorizados |
| `report_private/{id}` | Nome, CPF, e-mail, telefone opcional | Agentes autorizados conforme necessidade |
| `public_reports/{id}` | Área aproximada, categoria, data, etapa, foto e descrição publicáveis | Visitantes |
| `report_events/{id}` | Mudanças, ação, ocultação, motivo, agente e data | Agentes autorizados |
| `users/{uid}` | Papel técnico e habilitação | Acesso mínimo por papel |
| Storage | Originais restritos e imagens destinadas à publicação | Regras separadas |

Nomes de coleções são proposta, não esquema aprovado. A projeção pública é gerada pelo serviço; o cliente não escolhe quais campos privados publica. Esconder campos com CSS/JavaScript não protege um documento legível publicamente.

## 8. Requisitos não funcionais

- **Privacidade:** separar dados na origem; remover metadados pessoais de imagens públicas; testar resposta de rede, não só a aparência.
- **Segurança:** negar acesso no backend/regras, limitar abuso e upload, registrar ações, revogar contas individuais.
- **Confiabilidade:** envio idempotente, confirmação real, recuperação de falha parcial entre fotos, registro e publicação.
- **Acessibilidade:** rótulos, mensagens de erro, teclado/foco visível e caminho manual quando GPS falhar.
- **Custo e desempenho:** limitar consultas/fotos, paginar área técnica, monitorar uso e orçamento antes de abrir a moradores.
- **Compatibilidade:** priorizar celular e conferir desktop/navegadores atuais.

Não há metas numéricas de escala, disponibilidade, desempenho ou custo aprovadas.

## 9. Critérios de aceite V1

1. Uma pessoa de teste confirma e-mail, envia denúncia com dados/foto/ponto, recebe protocolo e o registro persiste após recarga.
2. O mapa mostra versão publicada com posição aproximada, foto, descrição, categoria, data e etapa, sem dados privados na interface **nem na resposta de rede**.
3. Agente autorizado vê lista/detalhe e ponto exato; visitante não acessa dados ou operações técnicas.
4. Abrir detalhe não altera etapa; iniciar análise registra agente/data; concluir exige data, ação e observações; mapa reflete a etapa.
5. Ocultar retira a publicação, registra motivo e preserva relato interno.
6. GPS negado permite ponto manual; falha de rede/upload não gera sucesso falso; repetir a mesma tentativa não duplica.
7. Se o registro é recebido e publicação falha, a confirmação distingue os estados e o agente ainda encontra a ocorrência.

Dashboard, gráficos, mapa técnico, agenda de visitas e conteúdo complementar completo não compõem esse aceite.

## 10. Testes e validação

Revisar fluxo com agentes antes de dizer que corresponde à rotina deles. Testar com dados fictícios/emuladores; antes de abrir a moradores, verificar permissões, isolamento público/privado, ocultação, custos e operação responsável. Casos mínimos: acesso negado, foto com metadados, descrição com dado pessoal, GPS negado, ponto fora do território, upload interrompido, reenvio, publicação falha e ocultação urgente.

O Figma é protótipo e o README antigo contém jornadas legadas; nenhum deles comprova entrega funcional.

## 11. Roadmap

| Etapa | Resultado |
|---|---|
| V1 | Envio real, persistência, mapa público, Ocorrências, transições e ocultação |
| V1.x | Corrigir falhas observadas com moradores e agentes |
| Posterior | Dashboard, gráficos e comparação a partir da mesma base |
| Posterior | Mapa técnico, visitas e conteúdo complementar conforme decisões próprias |

Não é cronograma. Responsáveis, capacidade, orçamento e datas ainda não foram fechados.

## 12. Riscos e decisões abertas

| Tema | Estado |
|---|---|
| Operador e vínculo institucional | Organização e pessoa responsáveis não identificadas; agentes não confirmaram uso. Não afirmar que é canal oficial. |
| CPF | Obrigatório por decisão do usuário; não verifica titularidade. Finalidade operacional, acesso mínimo e avaliação de privacidade pendentes. |
| Publicação automática | Foto/descrição podem conter dados pessoais. Ocultação testada, responsável e rotina diária são condições antes da abertura pública; cobertura fora do horário e canal de reclamação ainda pendentes. |
| Território e área pública | Fonte de limites, bairros e precisão aproximada ainda pendentes. |
| Infraestrutura | Provedor de mapa, custos de Storage/Functions, limites e monitoramento pendentes. |
| Dados | Retenção, correção, exclusão, republicação e pedidos dos titulares pendentes. |
| Piloto aberto | Usuário quer moradores reais sem lista fechada; volume, suporte, duração e critérios de avaliação pendentes. |
| Atendimento | Nenhum prazo ou compromisso institucional validado. |

## 13. Definição de pronto

V1 pronta significa passar os critérios de aceite com serviço real, regras de acesso verificadas, responsável operacional designado, ocultação testada e informação pública honesta. Funcionar tecnicamente não prova adoção por agentes nem efetividade sanitária. A abertura pública exige fechar as pendências operacionais e de privacidade acima.

## 14. Fontes

- PRD local do Repecol: `docs/PRD_REPELCONTROL.md` no projeto separado; usado como referência de estrutura e perguntas.
- [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65), incluindo ADL-76/77/82–89.
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y), protótipo.
- Segundo cérebro do usuário: `02 Projects/Aedes Data Lab/Contexto.md` e `Roteiro de aprendizagem e desenvolvimento.md`.
- Decisões do usuário na revisão de 04/11/2026.
