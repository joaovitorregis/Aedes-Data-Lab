// =====================================================================
// Erros: transforma o que o banco (ou o próprio código) devolveu em uma
// resposta segura para o navegador.
//
// Regra de segurança: o navegador NUNCA recebe mensagem técnica (nome de
// tabela, de constraint, endereço de servidor). Ele recebe um código curto
// ("etapa_invalida") e uma frase em português. O detalhe técnico fica só nos
// logs da função (console.error), que só a equipe vê no painel do Supabase.
// =====================================================================

// Erro de negócio lançado pelo próprio código das funções. O "message" é o código.
export class ErroNegocio extends Error {
  constructor(public codigo: string) {
    super(codigo);
  }
}

// código -> [status HTTP, mensagem para a pessoa]
const TABELA: Record<string, [number, string]> = {
  // vindos do banco (as funções api_* levantam exatamente estes códigos)
  nao_autorizado: [403, "Você não tem permissão para esta ação."],
  denuncia_nao_encontrada: [404, "Denúncia não encontrada."],
  etapa_invalida: [409, "Esta ação não é possível na etapa atual da ocorrência."],
  versao_desatualizada: [409, "A ocorrência mudou. Atualize a tela e tente de novo."],
  tentativas_insuficientes: [409, "São necessárias ao menos três tentativas sem acesso."],
  data_invalida: [422, "A data da visita é inválida."],
  fora_do_territorio: [422, "O ponto está fora do município."],
  fotos_invalidas: [422, "Envie de uma a três fotos."],
  contato_nao_confirmado: [403, "Confirme o contato por código antes de enviar."],
  contato_confirmado_nao_editavel: [403, "O contato confirmado só pode ser trocado pela equipe do projeto."],
  campo_desconhecido: [422, "Há um campo que não pode ser corrigido."],
  campo_nao_editavel: [422, "Este campo não pode ser alterado por você."],
  campo_nao_aplicavel: [422, "Este campo não se aplica a esta ocorrência."],
  motivo_obrigatorio: [422, "Informe o motivo."],
  confirmacao_obrigatoria: [422, "Confirme a ação para continuar."],
  dados_invalidos: [422, "Alguns dados estão inválidos. Confira os campos e tente de novo."],
  nao_arquivada: [409, "A denúncia não está arquivada."],
  fora_do_prazo: [409, "O prazo de 30 dias da lixeira terminou."],
  nao_vencida: [409, "O prazo de 30 dias ainda não terminou."],
  // lançados pelo código das Edge Functions
  foto_invalida: [422, "Foto inválida. Use JPEG ou PNG de até 10 MB."],
  json_invalido: [400, "Pedido mal formado."],
  metodo_invalido: [405, "Método não permitido."],
  nao_autenticado: [401, "Entre com sua conta de agente."],
  rotina_nao_autorizada: [401, "Pedido não autorizado."],
  limite_excedido: [429, "Muitas tentativas. Aguarde um pouco e tente de novo."],
  envio_falhou: [502, "Não foi possível enviar o código agora. Tente de novo em instantes."],
  canal_indisponivel: [503, "Este canal de envio ainda não está disponível. Use o e-mail."],
  acao_desconhecida: [400, "Ação desconhecida."],
  autorizacao_invalida: [403, "A autorização expirou. Peça um novo código."],
};

// Erros do Postgres que significam "o dado enviado não respeita uma regra da tabela":
// 23514 check, 23502 not null, 23503 chave estrangeira, 22P02 valor inválido (ex.: enum),
// 22007/22008 data inválida, 22003 número fora do intervalo, 22001 texto longo demais.
const CODIGOS_DADOS_INVALIDOS = new Set(["23514", "23502", "23503", "22P02", "22007", "22008", "22003", "22001"]);

export interface ErroTraduzido {
  status: number;
  codigo: string;
  mensagem: string;
}

export function traduzir(err: unknown): ErroTraduzido {
  const e = (err ?? {}) as { message?: string; code?: string };
  // O código de negócio vem no começo da mensagem: "etapa_invalida" ou
  // "campo_desconhecido: stage" (com detalhe depois dos dois pontos).
  const codigo = /^[a-z_]+/.exec(e.message ?? "")?.[0] ?? "";
  if (codigo in TABELA) {
    const [status, mensagem] = TABELA[codigo];
    return { status, codigo, mensagem };
  }
  if (e.code && CODIGOS_DADOS_INVALIDOS.has(e.code)) {
    const [status, mensagem] = TABELA.dados_invalidos;
    return { status, codigo: "dados_invalidos", mensagem };
  }
  // Qualquer outra coisa é um problema nosso: não detalha para fora.
  return { status: 500, codigo: "erro_interno", mensagem: "Erro inesperado. Tente de novo em instantes." };
}
