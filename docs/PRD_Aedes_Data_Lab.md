# PRD — Aedes Data Lab

**Estado:** rascunho para revisão da equipe  
**Data:** 04/11/2026  
**Produto:** plataforma de prevenção da dengue e registro de possíveis focos em Itambé/PE

## 1. Problema e objetivo

O cidadão precisa registrar um possível foco com evidências e localização; os agentes precisam consultar e atender os registros; a população precisa visualizar os relatos publicáveis em um mapa. Hoje, o repositório contém estrutura inicial de páginas, sem fluxo funcional de envio, persistência, autenticação ou indicadores. O objetivo do primeiro produto funcional é fazer uma denúncia atravessar todo o caminho: **registro → armazenamento → mapa público → área restrita do agente → atualização do atendimento → indicadores**.

O produto registra **relatos de possíveis focos**, não casos confirmados de dengue. O recorte inicial é Itambé/PE. A interface deve funcionar em celular e computador. A construção também é uma atividade de aprendizagem: as quatro integrantes desenvolvem HTML, CSS e JavaScript de suas telas; banco e integrações são estudados em conjunto.

## 2. Pessoas e jornadas

| Pessoa | Necessidade | Jornada essencial |
|---|---|---|
| Cidadão | Relatar um possível foco | Informar local, evidências e contato → revisar → enviar → receber confirmação/protocolo |
| Visitante | Entender os relatos e aprender sobre prevenção | Abrir mapa e conteúdo educativo sem cadastro |
| Agente autorizado | Consultar e tratar ocorrências | Entrar na área restrita → filtrar/abrir registro → registrar ação → mudar etapa → consultar indicadores |

## 3. Escopo do primeiro produto funcional

### Denúncia

- Formulário em etapas com localização do foco, seleção manual do ponto e opção de GPS. A localização do dispositivo pode diferir da do foco e deve ser corrigível.
- Uma a três fotos obrigatórias; categoria, bairro e descrição da situação. A lista final de campos e obrigatoriedade de contato está pendente.
- Revisão antes do envio, validação por etapa, mensagens de erro compreensíveis e preservação dos dados quando a pessoa volta uma etapa.
- Envio com confirmação real do servidor e protocolo. Uma tentativa repetida após falha não deve criar outra denúncia.
- A recusa de GPS, falha de mapa, rede ou upload deve ter tratamento explícito. Nenhum aviso de sucesso antes de persistência confirmada.

### Mapa e informação pública

- Acesso sem cadastro; mostra denúncias publicáveis, incluindo as atendidas, com filtros úteis de localidade, data e situação.
- Foto e descrição podem ser públicas por decisão do usuário. Identidade e contato do denunciante **não** podem aparecer na resposta pública, inclusive em texto livre, imagem ou metadados.
- A precisão da coordenada pública ainda exige decisão antes de operar com dados reais.
- Conteúdo educativo Guia Aedes, Repelentes, Quem Somos e entrada do jogo integra a navegação. O jogo aparece como acesso ao recurso definido no design; sua implementação própria não está confirmada.

### Área do agente

- Acesso autenticado e autorizado; lista, filtros, detalhe e mapa de ocorrências. O registro completo e dados de contato ficam restritos aos agentes autorizados.
- Etapas de atendimento: **Recebida → Em análise → Atendida**. “Denúncias recebidas no período” é uma medida de entrada, separada da etapa atual.
- A conclusão exige data, ação realizada e observações. Histórico registra as mudanças relevantes. Ocultação de conteúdo público problemático exige justificativa.
- Dashboard usa a mesma base das ocorrências, com período, bairro e situação. Períodos: dia, semana, mês e personalizado; comparação com período anterior é opcional e inicia desligada. Indicadores e gráficos precisam respeitar o mesmo recorte.

## 4. Regras de produto e privacidade

1. O relato é publicado somente após validação do envio. Estados técnicos de upload não são etapas de atendimento.
2. Os documentos públicos e privados devem ser separados na origem. Esconder campos com CSS ou JavaScript não é proteção.
3. Foto/descrição publicáveis exigem revisão de exposição incidental de nome, telefone, endereço de terceiro e metadados da imagem.
4. Agente não pode criar o próprio privilégio; cada operação técnica verifica permissão no serviço, não apenas na interface.
5. Indicadores contam denúncias recebidas no intervalo selecionado e classificam essas denúncias pela etapa atual. Recebidas = soma das etapas atuais no recorte.
6. Mapa e dashboard não devem comunicar relatos como diagnóstico, inspeção concluída ou números epidemiológicos oficiais.

## 5. Fora do núcleo aprovado

Chat cidadão–agente, distribuição automática ou atribuição de ocorrências, rotas otimizadas, construtor livre de gráficos e canais externos de aviso não foram aprovados para o primeiro produto funcional. “Meu trabalho” consta em cartões de design, mas foi retirado da jornada do agente no protótipo atual; visitas podem ser tratadas após o fluxo principal. Wireframes antigos do repositório contêm funções que não definem o escopo atual.

## 6. Critérios de aceite do núcleo

- Uma denúncia fictícia enviada pelo celular gera protocolo e persiste após recarregar.
- O registro aparece no mapa com os campos públicos autorizados; a resposta de rede pública não inclui contato ou identidade.
- Um agente autorizado vê o registro completo, registra atendimento e a alteração aparece no mapa e nos indicadores.
- Um visitante não acessa registros privados nem operações técnicas; o bloqueio é verificado no backend/regras.
- GPS negado permite selecionar o ponto manualmente. Falhas de rede e upload não produzem sucesso falso nem duplicação em nova tentativa.
- Filtros do dashboard e da lista produzem contagens consistentes, inclusive em estado vazio.

## 7. Decisões pendentes antes de dados reais

| Decisão | Impacto |
|---|---|
| Entrada do cidadão: conta ou confirmação por denúncia; campos obrigatórios de contato | Modelo de identidade e recuperação de envio |
| Precisão da coordenada pública | Exposição de residências e utilidade do mapa |
| Fonte de limites territoriais, bairros e localidades de Itambé | Validação do relato e filtros |
| Provedor de mapas, custos e orçamento Firebase/Storage | Operação e publicação |
| Política de moderação, retirada e retenção de fotos/descrições | Publicação segura e manutenção |
| Significado operacional de “ciclo” | Filtro, se mantido |
| Datas, responsáveis e horas disponíveis | Cronograma executável |

## 8. Fontes e grau de certeza

Este PRD consolida decisões registradas no contexto do projeto, cartões ADL-65/76/77/82–84, roteiro de aprendizagem e revisões do dashboard. O fluxo e telas de Figma são protótipos, não funcionalidade entregue nem validação com agentes. Referência técnica ao Repecol foi autorizada para comparação do fluxo cidadão, sem importar automaticamente seus requisitos. A equipe ainda precisa revisar e aprovar este documento.

- Contexto e decisões: nota `02 Projects/Aedes Data Lab/Contexto.md` no segundo cérebro do usuário (fonte local externa ao repositório).
- Roteiro de aprendizagem e desenvolvimento: nota de mesmo nome na pasta do projeto no segundo cérebro (fonte local externa ao repositório).
- [Jira ADL](https://aedesdatalab.atlassian.net/browse/ADL-65)
- [Figma do Aedes](https://www.figma.com/design/l2jRvkAj2tgcaD4RqnZD4Y)
