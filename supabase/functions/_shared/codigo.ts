// =====================================================================
// Código de confirmação do contato (RF-AUT-01, ADR-006).
//
// O banco NUNCA guarda o código, só um "hash" dele. Hash é uma impressão
// digital de mão única: dá para conferir se o código digitado gera a mesma
// impressão, mas não dá para descobrir o código a partir dela.
//
// Como um código de 6 dígitos tem só 1 milhão de possibilidades, um hash
// simples seria quebrado em segundos por força bruta. Por isso usamos HMAC
// com um SEGREDO ("pimenta", variável CODE_PEPPER) que só a Edge Function
// conhece: sem o segredo, quem vazar o banco não consegue testar os códigos.
// =====================================================================

// Gera 6 dígitos com o gerador seguro do sistema (não Math.random, que é previsível).
// O "descarta" evita viés: sem ele, números baixos sairiam um pouco mais que os altos.
export function gerarCodigo(): string {
  const LIMITE = 4_294_000_000; // maior múltiplo de 1.000.000 abaixo de 2^32
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= LIMITE);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

// Impressão digital do código, amarrada à tentativa (subject) e ao contato:
// o mesmo código "123456" gera hashes diferentes para tentativas diferentes.
export async function hashCodigo(pimenta: string, subject: string, contato: string, codigo: string): Promise<string> {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey("raw", enc.encode(pimenta), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  // O contato vai em minúsculas porque o banco também o guarda assim.
  const dados = enc.encode(`${subject}|${contato.toLowerCase()}|${codigo}`);
  const assinatura = new Uint8Array(await crypto.subtle.sign("HMAC", chave, dados));
  return Array.from(assinatura, (b) => b.toString(16).padStart(2, "0")).join("");
}
