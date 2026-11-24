// =====================================================================
// Ambiente de teste das Edge Functions: um "Servico" falso, mas com banco de verdade.
//
//   - O banco é um Postgres em memória (PGlite) com TODAS as migrations aplicadas.
//     As chamadas rpc rodam como service_role, exatamente como em produção.
//   - Os buckets de arquivos são mapas em memória.
//   - O e-mail fica guardado numa lista, para o teste ler o código enviado.
// Isso testa as regras das funções + do banco juntas, sem internet e sem Docker.
// =====================================================================
import { PGlite } from "@electric-sql/pglite";
import { Image } from "imagescript";
import type { Servico } from "../_shared/servico.ts";

const raiz = new URL("../../", import.meta.url);
const ler = (rel: string) => Deno.readTextFileSync(new URL(rel, raiz));

export interface Ambiente {
  db: PGlite;
  svc: Servico;
  buckets: Map<string, Map<string, Uint8Array>>;
  emails: { para: string; assunto: string; texto: string }[];
  falhas: { publicoSubir: boolean }; // liga para simular falha no bucket público
  tokens: Map<string, string>; // jwt -> id do usuário
}

export async function criarAmbiente(): Promise<Ambiente> {
  const db = new PGlite();
  await db.exec(ler("tests/stubs_supabase.sql"));
  const nomes = [...Deno.readDirSync(new URL("migrations/", raiz))].map((e) => e.name).filter((n) => n.endsWith(".sql")).sort();
  for (const n of nomes) await db.exec(ler(`migrations/${n}`));

  const buckets = new Map<string, Map<string, Uint8Array>>([["fotos-originais", new Map()], ["fotos-publicas", new Map()]]);
  const emails: Ambiente["emails"] = [];
  const falhas = { publicoSubir: false };
  const tokens = new Map<string, string>();

  const svc: Servico = {
    config: { pimenta: "pimenta-de-teste", segredoToken: "segredo-token-de-teste-bem-longo", segredoRotina: "senha-da-rotina", origensPermitidas: "" },

    // Chama public.<funcao>(p_a => $1, p_b => $2 ...) como service_role, como o PostgREST faz.
    async rpc<T>(funcao: string, args: Record<string, unknown>): Promise<T> {
      const chaves = Object.keys(args);
      const params = chaves.map((k) => {
        const v = args[k];
        return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      });
      const lista = chaves.map((k, i) => `${k} => $${i + 1}${args[k] !== null && typeof args[k] === "object" ? "::jsonb" : ""}`).join(", ");
      await db.exec("reset role; set role service_role;");
      try {
        const r = await db.query<{ r: T }>(`select public.${funcao}(${lista}) as r`, params);
        return r.rows[0].r;
      } finally {
        await db.exec("reset role;");
      }
    },

    armazenamento: {
      subir(bucket, caminho, bytes) {
        if (bucket === "fotos-publicas" && falhas.publicoSubir) return Promise.reject(new Error("bucket público fora do ar"));
        buckets.get(bucket)!.set(caminho, bytes);
        return Promise.resolve();
      },
      baixar(bucket, caminho) {
        const b = buckets.get(bucket)!.get(caminho);
        return b ? Promise.resolve(b) : Promise.reject(new Error("arquivo não existe"));
      },
      remover(bucket, caminhos) {
        for (const c of caminhos) buckets.get(bucket)!.delete(c);
        return Promise.resolve();
      },
    },
    usuarioDoToken: (jwt) => Promise.resolve(tokens.get(jwt) ?? null),
    enviarEmail(para, assunto, texto) {
      emails.push({ para, assunto, texto });
      return Promise.resolve();
    },
  };
  return { db, svc, buckets, emails, falhas, tokens };
}

// ---------- ajudas ----------
export async function jpegDeTeste(w = 64, h = 48, exif?: string): Promise<Uint8Array> {
  const img = new Image(w, h);
  img.fill(0x336699ff);
  const jpg = await img.encodeJPEG(85);
  if (!exif) return jpg;
  const corpo = new TextEncoder().encode("Exif\0\0" + exif);
  const len = corpo.length + 2;
  return new Uint8Array([...jpg.slice(0, 2), 0xff, 0xe1, len >> 8, len & 0xff, ...corpo, ...jpg.slice(2)]);
}

let contadorIp = 0;
export const novoIp = () => `10.0.${Math.floor(++contadorIp / 250)}.${contadorIp % 250}`;

export function pedidoJson(corpo: unknown, { ip = novoIp(), jwt }: { ip?: string; jwt?: string } = {}): Request {
  const h: Record<string, string> = { "content-type": "application/json", "x-forwarded-for": ip };
  if (jwt) h.authorization = `Bearer ${jwt}`;
  return new Request("http://funcao.local/", { method: "POST", headers: h, body: JSON.stringify(corpo) });
}

export function pedidoForm(campos: Record<string, string>, fotos: Uint8Array[], { ip = novoIp(), jwt }: { ip?: string; jwt?: string } = {}): Request {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.append(k, v);
  fotos.forEach((b, i) => f.append("fotos", new File([b as BlobPart], `foto${i}.jpg`, { type: "image/jpeg" })));
  const h: Record<string, string> = { "x-forwarded-for": ip };
  if (jwt) h.authorization = `Bearer ${jwt}`;
  return new Request("http://funcao.local/", { method: "POST", headers: h, body: f });
}

export function codigoDoEmail(texto: string): string {
  return /(\d{6})/.exec(texto)![1];
}

export function dadosDenuncia(submissionId: string, extra: Record<string, unknown> = {}) {
  return {
    submission_id: submissionId, lat: -7.4105, lng: -35.1052, neighborhood_id: 1, category_id: 1,
    description: "Pneus com água parada no quintal ao lado.", focus_location: "terreno_baldio",
    water_present: true, containers: ["pneus"], larvae: "nao_sei", noticed_since: "uma semana",
    name: "Maria da Silva", email: "maria@exemplo.com", phone: "81999998888",
    address: "Rua das Flores, 120", reference: "perto da padaria",
    confirmed_channel: "email", confirmed_contact: "maria@exemplo.com", ...extra,
  };
}
