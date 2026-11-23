// =====================================================================
// HTTP: CORS, leitura segura do pedido, limite de repetição e tratamento de erro.
// =====================================================================
import { ErroNegocio, traduzir } from "./erros.ts";
import type { Servico } from "./servico.ts";

// CORS: o navegador só deixa o site chamar a função se a função disser que
// aquela "origem" (endereço do site) é permitida. ALLOWED_ORIGINS lista os
// endereços aceitos (ex.: "https://aedesdatalab.vercel.app"). Vazio = qualquer
// origem (aceitável só em desenvolvimento; em produção, preencha).
export function cabecalhos(req: Request, origensPermitidas: string): Record<string, string> {
  const lista = origensPermitidas.split(",").map((s) => s.trim()).filter(Boolean);
  const origem = req.headers.get("origin") ?? "";
  const permitida = lista.length === 0 ? "*" : (lista.includes(origem) ? origem : lista[0]);
  return {
    "Access-Control-Allow-Origin": permitida,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export function responder(req: Request, svc: Servico, status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos(req, svc.config.origensPermitidas) });
}

// Envolve a lógica de uma função: trata o "pré-voo" do CORS (OPTIONS), aceita só POST
// e transforma qualquer erro numa resposta segura (erros.ts), sem vazar detalhe técnico.
export function envolver(svc: Servico, logica: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cabecalhos(req, svc.config.origensPermitidas) });
    try {
      if (req.method !== "POST") throw new ErroNegocio("metodo_invalido");
      return await logica(req);
    } catch (e) {
      const t = traduzir(e);
      // Só erro INESPERADO vai para o log (ErroNegocio é resposta esperada, ex.: canal indisponível).
      if (t.status >= 500 && !(e instanceof ErroNegocio)) console.error("erro interno:", e);
      return responder(req, svc, t.status, { erro: { codigo: t.codigo, mensagem: t.mensagem } });
    }
  };
}

// Lê o corpo JSON com limite de tamanho (evita corpo gigante).
export async function lerJson(req: Request, maxBytes = 200_000): Promise<Record<string, unknown>> {
  const texto = await req.text();
  if (texto.length > maxBytes) throw new ErroNegocio("json_invalido");
  try {
    const v = JSON.parse(texto);
    if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new ErroNegocio("json_invalido");
  }
}

// Identifica quem chama pelo IP, mas só guardamos uma impressão (hash) dele:
// o IP em si não vai para o banco (privacidade). Serve só para limitar abuso.
export async function chaveDoCliente(req: Request): Promise<string> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)));
  return Array.from(h.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Limite de repetição (RNF-08): lança "limite_excedido" (HTTP 429) se estourar.
export async function limitar(svc: Servico, chave: string, maximo: number, janelaSegundos: number): Promise<void> {
  const ok = await svc.rpc<boolean>("api_hit_rate_limit", { p_key: chave, p_max: maximo, p_window_seconds: janelaSegundos });
  if (!ok) throw new ErroNegocio("limite_excedido");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function exigirUuid(v: unknown, campo = "id"): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new ErroNegocio("dados_invalidos");
  void campo;
  return v.toLowerCase();
}
export function exigirTexto(v: unknown, max = 500): string {
  if (typeof v !== "string" || v.length > max) throw new ErroNegocio("dados_invalidos");
  return v;
}
export function exigirInteiro(v: unknown): number {
  if (typeof v !== "number" || !Number.isInteger(v)) throw new ErroNegocio("dados_invalidos");
  return v;
}
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export function exigirEmail(v: unknown): string {
  if (typeof v !== "string" || v.length > 254 || !EMAIL.test(v)) throw new ErroNegocio("dados_invalidos");
  return v.trim().toLowerCase();
}

// Escolhe só os campos permitidos de um objeto. Campo que o navegador mandar a mais
// (ex.: "stage", "protocol", "photos") é descartado, nunca repassado ao banco.
export function escolher(obj: Record<string, unknown>, permitidos: string[]): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const k of permitidos) if (k in obj) saida[k] = obj[k];
  return saida;
}
