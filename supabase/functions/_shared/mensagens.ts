// Textos enviados ao cidadão. Mantidos aqui para revisão pela equipe.
// Regra do PRD: nenhuma mensagem promete visita, prazo ou aviso a um agente.
export function emailDoCodigo(codigo: string, minutos: number): { assunto: string; texto: string } {
  return {
    assunto: "Seu código de confirmação · Aedes Data Lab",
    texto:
      `Seu código de confirmação é: ${codigo}\n\n` +
      `Ele vale por ${minutos} minutos e só pode ser usado uma vez.\n` +
      `Se você não pediu este código, ignore esta mensagem.\n\n` +
      `Aedes Data Lab · Itambé-PE`,
  };
}
