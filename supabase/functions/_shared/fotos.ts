// =====================================================================
// Pipeline das fotos (ARCHITECTURE seção 5).
//
//   1. recebe os arquivos e valida (tipo, tamanho, dimensões);
//   2. grava os ORIGINAIS no bucket privado, com caminho previsível
//      (<id da tentativa>/<n>.jpg), então reenviar não duplica;
//   3. o banco grava a denúncia (api_save_report) e devolve o protocolo;
//   4. SÓ ENTÃO gera a versão pública (sem EXIF) no bucket público e pede ao
//      banco para publicar. Se este passo falhar, a denúncia já está gravada e
//      fica "publicação pendente" (D14); a rotina diária tenta de novo.
// =====================================================================
import { ErroNegocio } from "./erros.ts";
import { tratarFoto, type TipoFoto, validarFoto } from "./imagem.ts";
import { BUCKET_ORIGINAIS, BUCKET_PUBLICO, type Servico } from "./servico.ts";

export interface FotoRecebida {
  bytes: Uint8Array;
  tipo: TipoFoto;
}

// Lê os arquivos do campo "fotos" de um formulário multipart. De 1 a 3.
export async function lerFotos(form: FormData): Promise<FotoRecebida[]> {
  const arquivos = form.getAll("fotos").filter((x): x is File => x instanceof File);
  if (arquivos.length < 1 || arquivos.length > 3) throw new ErroNegocio("fotos_invalidas");
  const fotos: FotoRecebida[] = [];
  for (const f of arquivos) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    // O tipo vem dos bytes do arquivo, NUNCA do nome ou do tipo declarado pelo navegador.
    fotos.push({ bytes, tipo: validarFoto(bytes) });
  }
  return fotos;
}

// Lê e valida o campo "dados" (JSON dentro do formulário).
export function lerDadosDoForm(form: FormData): Record<string, unknown> {
  const bruto = form.get("dados");
  if (typeof bruto !== "string" || bruto.length > 100_000) throw new ErroNegocio("json_invalido");
  try {
    const v = JSON.parse(bruto);
    if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new ErroNegocio("json_invalido");
  }
}

export function caminhoOriginal(tentativa: string, n: number, tipo: TipoFoto): string {
  return `${tentativa}/${n}.${tipo === "png" ? "png" : "jpg"}`;
}

// Grava os originais no bucket privado e devolve os caminhos.
export async function gravarOriginais(svc: Servico, tentativa: string, fotos: FotoRecebida[]): Promise<string[]> {
  const caminhos = fotos.map((f, i) => caminhoOriginal(tentativa, i + 1, f.tipo));
  await Promise.all(fotos.map((f, i) =>
    svc.armazenamento.subir(BUCKET_ORIGINAIS, caminhos[i], f.bytes, f.tipo === "png" ? "image/png" : "image/jpeg")));
  return caminhos;
}

// Gera as fotos públicas a partir dos originais e envia ao bucket público.
// Caminho público: <id da denúncia>/<n>.jpg (ou .png, o mesmo tipo do original)
export async function gerarPublicas(svc: Servico, reportId: string, originais: string[]): Promise<string[]> {
  const publicos: string[] = [];
  for (let i = 0; i < originais.length; i++) {
    const bytes = await svc.armazenamento.baixar(BUCKET_ORIGINAIS, originais[i]);
    const tratada = tratarFoto(bytes);
    const destino = `${reportId}/${i + 1}.${tratada.tipo === "png" ? "png" : "jpg"}`;
    await svc.armazenamento.subir(BUCKET_PUBLICO, destino, tratada.bytes, tratada.tipo === "png" ? "image/png" : "image/jpeg");
    publicos.push(destino);
  }
  return publicos;
}

// Publica a denúncia no mapa. NUNCA lança erro: se algo falhar, devolve "pendente"
// e a denúncia continua gravada (D14). Se o banco recusar a publicação (ex.: a denúncia
// foi arquivada enquanto isso), apaga as fotos públicas que acabamos de enviar.
export async function publicar(svc: Servico, reportId: string, originais: string[]): Promise<"publicada" | "pendente"> {
  let publicos: string[] = [];
  try {
    publicos = await gerarPublicas(svc, reportId, originais);
    const r = await svc.rpc<{ published: boolean }>("api_publish_report", { p_report_id: reportId, p_photo_paths: publicos });
    if (r.published) return "publicada";
    await svc.armazenamento.remover(BUCKET_PUBLICO, publicos).catch(() => {});
    return "pendente";
  } catch (e) {
    console.error("publicação ficou pendente:", reportId, e);
    await svc.armazenamento.remover(BUCKET_PUBLICO, publicos).catch(() => {});
    return "pendente";
  }
}
