// =====================================================================
// Autorização temporária de correção do cidadão (D42).
//
// O cidadão não tem conta. Depois de digitar o código certo, a Edge Function
// entrega um "token": um texto assinado que diz "esta pessoa pode corrigir a
// denúncia X, na versão V, até a hora H". Nas chamadas seguintes o token volta
// e a função confere a assinatura. Sem o segredo (CORRECTION_TOKEN_SECRET)
// ninguém consegue fabricar nem alterar um token: trocar a denúncia dentro dele
// invalida a assinatura.
//
// Formato:  <dados em base64url>.<assinatura em base64url>
// Uso único: o token carrega a VERSÃO da denúncia. Cada correção soma 1 na
// versão, então o mesmo token não vale uma segunda vez (o banco confere).
// =====================================================================

export interface DadosToken {
  rid: string; // id da denúncia a que o token se restringe
  ver: number; // versão da denúncia no momento da emissão
}
export interface PayloadToken extends DadosToken {
  exp: number; // expira em (segundos desde 1970)
}

const enc = new TextEncoder();

function paraBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function deBase64Url(texto: string): Uint8Array<ArrayBuffer> {
  const b64 = texto.replaceAll("-", "+").replaceAll("_", "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function chaveHmac(segredo: string, usos: KeyUsage[]) {
  return crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, usos);
}

export async function emitirToken(segredo: string, dados: DadosToken, validadeSegundos: number): Promise<string> {
  const payload: PayloadToken = { ...dados, exp: Math.floor(Date.now() / 1000) + validadeSegundos };
  const parte = paraBase64Url(enc.encode(JSON.stringify(payload)));
  const assinatura = new Uint8Array(await crypto.subtle.sign("HMAC", await chaveHmac(segredo, ["sign"]), enc.encode(parte)));
  return `${parte}.${paraBase64Url(assinatura)}`;
}

// Devolve os dados se o token é autêntico e está no prazo; senão, null. Nunca lança erro.
export async function verificarToken(segredo: string, token: string): Promise<PayloadToken | null> {
  try {
    const partes = token.split(".");
    if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
    // "verify" compara em tempo constante (não vaza a assinatura por diferença de tempo).
    const ok = await crypto.subtle.verify(
      "HMAC", await chaveHmac(segredo, ["verify"]), deBase64Url(partes[1]), enc.encode(partes[0]));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(deBase64Url(partes[0]))) as PayloadToken;
    if (typeof p.rid !== "string" || typeof p.ver !== "number" || typeof p.exp !== "number") return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}
