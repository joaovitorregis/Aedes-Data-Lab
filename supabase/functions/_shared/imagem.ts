// =====================================================================
// Fotos: validação e tratamento (RF-DEN-03, SECURITY.md).
//
// Por que tratar? A foto de celular traz "EXIF": metadados com a LOCALIZAÇÃO
// GPS exata de onde foi tirada, modelo do aparelho, data etc. A foto pública
// não pode ter nada disso (RNF-05).
//
// Como tratamos: NÃO decodificamos a imagem. Lemos a estrutura do arquivo
// (JPEG ou PNG), copiamos só os blocos que formam a imagem e DESCARTAMOS todos
// os blocos de metadados (EXIF, XMP, comentários, miniatura, perfis) e qualquer
// dado colado depois do fim da imagem. Motivos: é rápido (a função tem poucos
// milissegundos de CPU), não depende de biblioteca nativa (o Supabase não roda
// código nativo do Node) e não perde qualidade. Só a "orientação" (1 número que
// diz se a foto está de lado) é mantida, para a foto não aparecer girada.
//
// Por que validar antes de decodificar? Um arquivo malicioso pode se
// disfarçar de foto ou declarar bilhões de pixels e esgotar a memória da
// função. Conferimos tipo (pelos primeiros bytes, não pelo nome), tamanho e
// dimensões (lidas do cabeçalho, sem decodificar).
// =====================================================================
import { ErroNegocio } from "./erros.ts";

export type TipoFoto = "jpeg" | "png";

export const LIMITES = {
  maxBytes: 10 * 1024 * 1024, // 10 MiB (igual ao limite do bucket)
  maxPixels: 40_000_000, // 40 megapixels
};

// Descobre o tipo pelos bytes iniciais ("assinatura" do formato).
export function tipoPorAssinatura(b: Uint8Array): TipoFoto | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  return null;
}

// Lê largura e altura direto do cabeçalho, sem decodificar a imagem.
export function lerDimensoes(b: Uint8Array): { largura: number; altura: number } | null {
  const tipo = tipoPorAssinatura(b);
  if (tipo === "png") {
    if (b.length < 24) return null;
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { largura: v.getUint32(16), altura: v.getUint32(20) };
  }
  if (tipo === "jpeg") {
    // Um JPEG é uma sequência de blocos (marcadores). Pulamos de bloco em bloco
    // até achar o "SOF", que guarda as dimensões.
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; } // preenchimento
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; } // sem corpo
      const tamanho = (b[i + 2] << 8) | b[i + 3];
      const ehSOF = (m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
      if (ehSOF) return { altura: (b[i + 5] << 8) | b[i + 6], largura: (b[i + 7] << 8) | b[i + 8] };
      i += 2 + tamanho;
    }
  }
  return null;
}

// Confere tudo e devolve o tipo, ou lança "foto_invalida".
export function validarFoto(b: Uint8Array, limites: Partial<typeof LIMITES> = {}): TipoFoto {
  const { maxBytes, maxPixels } = { ...LIMITES, ...limites };
  if (b.length === 0 || b.length > maxBytes) throw new ErroNegocio("foto_invalida");
  const tipo = tipoPorAssinatura(b);
  if (!tipo) throw new ErroNegocio("foto_invalida");
  const d = lerDimensoes(b);
  if (!d || d.largura < 1 || d.altura < 1 || d.largura * d.altura > maxPixels) throw new ErroNegocio("foto_invalida");
  return tipo;
}

// ---------------------------------------------------------------------
// Tratamento: remove os metadados sem decodificar a imagem.
// ---------------------------------------------------------------------

function juntar(partes: Uint8Array[]): Uint8Array {
  const total = partes.reduce((s, p) => s + p.length, 0);
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { saida.set(p, pos); pos += p.length; }
  return saida;
}

const invalida = () => new ErroNegocio("foto_invalida");

// Procura a "orientação" (1 a 8) dentro do bloco EXIF. Qualquer problema = sem orientação.
function lerOrientacao(exif: Uint8Array): number | null {
  try {
    // exif = "Exif\0\0" + cabeçalho TIFF ("II" ou "MM", 42, deslocamento do primeiro IFD)
    const tiff = exif.subarray(6);
    const v = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
    const little = tiff[0] === 0x49; // "II" = little endian
    const ifd = v.getUint32(4, little);
    const n = v.getUint16(ifd, little);
    for (let k = 0; k < n && k < 64; k++) {
      const e = ifd + 2 + k * 12;
      if (v.getUint16(e, little) === 0x0112) {
        const o = v.getUint16(e + 8, little);
        return o >= 1 && o <= 8 ? o : null;
      }
    }
  } catch { /* EXIF malformado: ignora */ }
  return null;
}

// Monta um EXIF mínimo que só diz a orientação. Nada de GPS, data ou aparelho.
function exifSoOrientacao(o: number): Uint8Array {
  const corpo = new Uint8Array([
    0x45, 0x78, 0x69, 0x66, 0, 0, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, // TIFF, big endian, IFD0 em 8
    0, 1, // 1 entrada
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, // tag 0x0112, SHORT, 1 valor
    0, 0, 0, 0, // sem próximo IFD
  ]);
  const tam = corpo.length + 2;
  return new Uint8Array([0xff, 0xe1, tam >> 8, tam & 0xff, ...corpo]);
}

function limparJpeg(b: Uint8Array): Uint8Array {
  const partes: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  let orientacao: number | null = null;
  let achouImagem = false;
  let i = 2;
  let terminou = false;
  while (i + 1 < b.length) {
    if (b[i] !== 0xff) throw invalida();
    while (i + 1 < b.length && b[i + 1] === 0xff) i++; // bytes de preenchimento
    const m = b[i + 1];
    if (m === 0xd9) { terminou = true; break; } // EOI: fim. O que vier depois é descartado.
    if (m === 0xd8) throw invalida();
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { partes.push(b.subarray(i, i + 2)); i += 2; continue; }
    if (i + 3 >= b.length) throw invalida();
    const tam = (b[i + 2] << 8) | b[i + 3];
    if (tam < 2 || i + 2 + tam > b.length) throw invalida();
    const seg = b.subarray(i, i + 2 + tam);
    const dados = b.subarray(i + 4, i + 2 + tam);
    const comeca = (txt: string) => txt.split("").every((c, k) => dados[k] === c.charCodeAt(0));

    if (m === 0xe1 && comeca("Exif\0") && orientacao === null) orientacao = lerOrientacao(b.subarray(i + 4, i + 2 + tam));
    // Fica: APP0 "JFIF" e APP14 "Adobe" (ajudam a mostrar as cores certas) e todos os blocos
    // que descrevem a imagem em si. Cai: o resto dos APPn (EXIF, XMP, ICC...) e comentários.
    const metadado = (m >= 0xe0 && m <= 0xef && !(m === 0xe0 && comeca("JFIF\0")) && !(m === 0xee && comeca("Adobe"))) || m === 0xfe;
    if (!metadado) partes.push(seg);

    if (m === 0xda) { // SOS: depois do cabeçalho vem o dado da imagem, até o próximo marcador
      achouImagem = true;
      let j = i + 2 + tam;
      while (j + 1 < b.length) {
        if (b[j] === 0xff) {
          const n = b[j + 1];
          if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) j += 2;
          else if (n === 0xff) j++;
          else break;
        } else j++;
      }
      if (j + 1 >= b.length) j = b.length; // arquivo cortado: guarda o que tem
      partes.push(b.subarray(i + 2 + tam, j));
      i = j;
      continue;
    }
    i += 2 + tam;
  }
  if (!achouImagem) throw invalida();
  void terminou; // sem EOI (arquivo cortado), fechamos o arquivo mesmo assim
  partes.push(new Uint8Array([0xff, 0xd9]));
  if (orientacao !== null && orientacao !== 1) partes.splice(1, 0, exifSoOrientacao(orientacao));
  return juntar(partes);
}

// PNG: guarda só os blocos que formam a imagem (e a transparência). O resto
// (tEXt, iTXt, zTXt, eXIf, tIME, perfis...) cai, e tudo depois do IEND também.
function limparPng(b: Uint8Array): Uint8Array {
  const manter = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);
  const partes: Uint8Array[] = [b.subarray(0, 8)];
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  let achouIdat = false;
  let achouFim = false;
  while (i + 12 <= b.length) {
    const tam = v.getUint32(i);
    const fim = i + 12 + tam;
    if (fim > b.length) throw invalida();
    const tipo = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    if (manter.has(tipo)) partes.push(b.subarray(i, fim));
    if (tipo === "IDAT") achouIdat = true;
    i = fim;
    if (tipo === "IEND") { achouFim = true; break; }
  }
  if (!achouIdat || !achouFim) throw invalida();
  return juntar(partes);
}

// Gera a versão PÚBLICA: a mesma imagem, sem nenhum metadado. O tipo (JPEG ou PNG) continua o mesmo.
export function tratarFoto(original: Uint8Array): { bytes: Uint8Array; tipo: TipoFoto } {
  const tipo = tipoPorAssinatura(original);
  if (tipo === "jpeg") return { bytes: limparJpeg(original), tipo };
  if (tipo === "png") return { bytes: limparPng(original), tipo };
  throw invalida();
}
