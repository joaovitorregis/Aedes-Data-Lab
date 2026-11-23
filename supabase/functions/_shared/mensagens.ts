// Textos enviados ao cidadão. Mantidos aqui para revisão pela equipe.
// Regra do PRD: nenhuma mensagem promete visita, prazo ou aviso a um agente.
export function emailDoCodigo(codigo: string, minutos: number): { assunto: string; texto: string; html: string } {
  return {
    assunto: "Seu código de confirmação · Aedes Data Lab",
    texto:
      `Seu código de confirmação:\n\n` +
      `${codigo}\n\n` +
      `Ele vale por ${minutos} minutos e só pode ser usado uma vez.\n` +
      `Se você não pediu este código, ignore esta mensagem.\n\n` +
      `Aedes Data Lab · Itambé-PE`,
    // O código vai sozinho num bloco com user-select:all: um toque ou clique seleciona tudo, pronto para copiar.
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#222">` +
      `<p style="margin:0 0 12px">Seu código de confirmação:</p>` +
      `<p style="margin:0 0 16px;padding:16px;background:#f2f2f2;border-radius:8px;text-align:center;` +
      `font-family:'Courier New',monospace;font-size:32px;font-weight:bold;letter-spacing:6px;user-select:all">${codigo}</p>` +
      `<p style="margin:0 0 8px">Ele vale por ${minutos} minutos e só pode ser usado uma vez.</p>` +
      `<p style="margin:0 0 20px;color:#666;font-size:14px">Se você não pediu este código, ignore esta mensagem.</p>` +
      `<p style="margin:0;color:#666;font-size:14px">Aedes Data Lab · Itambé-PE</p>` +
      `</div>`,
  };
}
