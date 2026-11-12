# Aedes Data Lab: Requisitos de segurança

O Aedes Data Lab guarda nome, CPF, e-mail e telefone de moradores, além de fotos e da localização exata de cada denúncia. Este documento reúne as regras que protegem esses dados. Ele detalha o [PRD](./PRD.md) (seções 7, 8, 12 e 13) e vale desde a primeira tarefa, não só antes do lançamento.

## 1. Autenticação

- Agentes e administrador entram com login individual (Supabase Auth). Não existem contas compartilhadas.
- Contas de agente são criadas e liberadas pelo administrador, fora do cadastro público.
- O cidadão não tem conta. Ele prova acesso ao e-mail a cada denúncia, e a confirmação de uma tentativa não vale para outra.
- Ao sair, a interface apaga os dados privados que estavam na tela.

## 2. Autorização

| Perfil | Pode | Não pode |
|---|---|---|
| Visitante | Ler a versão pública do mapa; enviar denúncia após confirmar o e-mail | Ler qualquer dado privado ou histórico |
| Cidadão responsável pelo envio | Ler e corrigir os campos da própria denúncia enquanto ela está Recebida | Ver denúncias de outras pessoas, observações ou histórico interno |
| Agente autorizado | Ler todas as ocorrências de Itambé, incluindo dados privados; analisar, registrar visitas, encerrar sem acesso, gerar relatório, ocultar e republicar | Corrigir os campos enviados; gerenciar contas |
| Administrador | Gerenciar contas de agentes; corrigir qualquer denúncia | Apagar histórico |

- Toda permissão é conferida no servidor. Esconder um botão ou uma página não conta como proteção.
- Conta revogada perde o acesso na próxima operação.
- Conhecer o endereço de uma página técnica não dá acesso a ela.

## 3. Dados pessoais

- Nome, CPF, e-mail, telefone, endereço digitado, referência e ponto exato nunca aparecem na versão pública, nem mascarados.
- A separação acontece nas tabelas do banco (ADR-004). O navegador do visitante nunca recebe a linha privada.
- CPF é conferido só no formato e nos dígitos. O sistema não consulta bases externas nem afirma que a identidade foi verificada.
- Testes e demonstrações usam somente dados fictícios.
- O resultado das visitas (acesso, foco, depósitos, ações e observações) é interno e nunca vai para a versão pública.
- O relatório do agente não contém nome, CPF, e-mail ou telefone do morador. O contrato `dadosRelatorio` não lê `report_private`, e o arquivo é gerado no navegador, sem passar por serviço de terceiros (RNF-12, ADR-013).
- O formulário de visita guardado no aparelho após falha de envio contém só os campos da visita, nunca dados do morador, e é apagado quando o envio é confirmado ou descartado.
- Adequação à LGPD (Lei nº 13.709/2018) concluída antes de coletar dados reais: finalidade do CPF, base legal, controlador e encarregado, aviso de privacidade, direitos do titular e retenção por tipo de dado (DEP-06).

## 4. Banco de dados e arquivos

- Toda tabela tem RLS ativado e nega por padrão; as políticas liberam só o que cada perfil precisa. Tabela nova sem política é tratada como erro no PR.
- O navegador não escreve diretamente nas tabelas de denúncia; toda mudança passa por Edge Function (ADR-008).
- `public_reports` é a única tabela de denúncias com leitura pública. O catálogo de bairros (`neighborhoods`) também é público, porque não contém dados pessoais.
- `report_visits` segue as mesmas regras de `report_events`: leitura só por agentes autorizados e administrador, escrita só por Edge Function.
- O papel do usuário (agente ou administrador) é lido da tabela `profiles` no servidor, nunca de um dado que o próprio usuário consiga editar.
- No Storage, as fotos originais ficam no bucket privado, lido só por agentes autorizados; o bucket público recebe só a versão tratada.
- Ocultar uma denúncia retira também o acesso público às fotos dela.

## 5. Envio de arquivos

Cada foto é conferida no servidor:

- Tipo: somente imagens, verificando o conteúdo do arquivo e não só a extensão. A proposta é aceitar JPEG, PNG e WebP; a lista final sai em DEP-03.
- Tamanho: limite configurado em DEP-03.
- Quantidade: de uma a três por denúncia.
- Nome: o arquivo é renomeado pelo servidor; o nome original não é usado.
- Metadados: a versão pública é gerada sem EXIF, o que remove coordenadas e dados da câmera.

## 6. Entradas e chamadas ao serviço

- Todo dado recebido é validado no servidor: tipo, tamanho, campos obrigatórios e valores permitidos.
- Textos livres são exibidos como texto, nunca interpretados como HTML.
- O território é validado pelo ponto marcado no mapa, não pelo bairro digitado.
- A etapa e a versão da ocorrência são conferidas antes de cada gravação.

## 7. Abuso e custo

- Confirmação de e-mail e envio de denúncia têm limite de repetição no servidor (RNF-08).
- Consultas e uploads têm limites configurados, e a lista dos agentes é paginada (RNF-07).
- O projeto de produção tem alerta de orçamento antes de ser aberto ao público (DEP-07).

## 8. Chaves e configurações

- Nenhuma chave, senha ou token entra no Git. O repositório tem apenas o [.env.example](../.env.example).
- O site usa só a URL do projeto e a chave pública (publishable, antiga anon). Ela pode aparecer no navegador porque o acesso é limitado pelas políticas de RLS.
- A chave secreta (secret, antiga service_role) ignora o RLS. Ela fica só nos segredos das Edge Functions, nunca no código do site, num arquivo do repositório ou num print.
- Teste, prévia e produção usam projetos Supabase diferentes.

## 9. Registros

- Logs e métricas não guardam CPF, contato, texto livre ou fotos (RNF-10).
- Autor e horário de cada ação vêm da sessão e do servidor, nunca do navegador.

## 10. Lista de verificação antes do lançamento

- [ ] Nenhuma chave ou dado real no histórico do Git
- [ ] Políticas de RLS e do Storage testadas com acesso negado para cada perfil
- [ ] Nenhuma tabela com RLS desativado e chave secreta ausente do código do site
- [ ] Respostas públicas inspecionadas sem dados privados (AC-07)
- [ ] Conta revogada sem acesso (AC-08)
- [ ] Upload recusando arquivo inválido e removendo metadados
- [ ] Limites de repetição ativos no servidor
- [ ] Aviso de privacidade publicado e DEP-06 concluída
- [ ] Alerta de orçamento configurado
