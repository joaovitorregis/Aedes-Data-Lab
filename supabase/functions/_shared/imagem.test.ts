import assert from "node:assert/strict";
import { Image } from "imagescript";
import { lerDimensoes, tipoPorAssinatura, tratarFoto, validarFoto } from "./imagem.ts";

async function jpeg(w: number, h: number) {
  const i = new Image(w, h);
  i.fill(0x336699ff);
  return await i.encodeJPEG(85);
}
async function png(w: number, h: number) {
  const i = new Image(w, h);
  i.fill(0x993366ff);
  return await i.encode();
}

// Insere um bloco EXIF falso (com um "texto de GPS") logo depois do início do JPEG.
function comExif(bytes: Uint8Array, texto: string): Uint8Array {
  const corpo = new TextEncoder().encode("Exif\0\0" + texto);
  const len = corpo.length + 2;
  const seg = new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...corpo]);
  return new Uint8Array([...bytes.slice(0, 2), ...seg, ...bytes.slice(2)]);
}

Deno.test("reconhece JPEG e PNG pelos primeiros bytes (e não confia no nome/tipo enviado)", async () => {
  assert.equal(tipoPorAssinatura(await jpeg(10, 10)), "jpeg");
  assert.equal(tipoPorAssinatura(await png(10, 10)), "png");
  assert.equal(tipoPorAssinatura(new TextEncoder().encode("<html>")), null);
  assert.equal(tipoPorAssinatura(new Uint8Array([])), null);
});

Deno.test("lê as dimensões de JPEG e PNG sem decodificar a imagem", async () => {
  assert.deepEqual(lerDimensoes(await jpeg(123, 45)), { largura: 123, altura: 45 });
  assert.deepEqual(lerDimensoes(await png(77, 99)), { largura: 77, altura: 99 });
  assert.equal(lerDimensoes(new Uint8Array([1, 2, 3])), null);
});

// Cabeçalho PNG sintético: só assinatura + IHDR com as dimensões. Basta para testar o limite
// de pixels, que é lido do cabeçalho SEM decodificar (por isso protege a memória).
function pngFalso(w: number, h: number): Uint8Array {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  new DataView(b.buffer).setUint32(8, 13);
  b.set(new TextEncoder().encode("IHDR"), 12);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  return b;
}

Deno.test("validarFoto recusa tipo inválido, arquivo grande demais e imagem gigante", async () => {
  const pequena = await jpeg(10, 10);
  assert.throws(() => validarFoto(new TextEncoder().encode("não é imagem")), /foto_invalida/);
  assert.throws(() => validarFoto(pequena, { maxBytes: 100 }), /foto_invalida/);
  assert.throws(() => validarFoto(pngFalso(6000, 7000), { maxPixels: 1_000_000 }), /foto_invalida/);
  assert.equal(validarFoto(pequena), "jpeg");
});

const latin1 = (b: Uint8Array) => new TextDecoder("latin1").decode(b);

// EXIF de verdade (mínimo): orientação 6 + um texto de GPS dentro do bloco.
function exifComOrientacao(o: number, texto: string): Uint8Array {
  const tiff = [0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, o, 0, 0, 0, 0, 0, 0, 0];
  const corpo = new Uint8Array([...new TextEncoder().encode("Exif\0\0"), ...tiff, ...new TextEncoder().encode(texto)]);
  const len = corpo.length + 2;
  return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...corpo]);
}
function inserir(jpg: Uint8Array, bloco: Uint8Array): Uint8Array {
  return new Uint8Array([...jpg.slice(0, 2), ...bloco, ...jpg.slice(2)]);
}

Deno.test("tratarFoto REMOVE o EXIF (onde mora o GPS) e a imagem continua igual e válida", async () => {
  const original = comExif(await jpeg(64, 48), "GPS-SENTINELA-LAT-7.41");
  assert.ok(latin1(original).includes("GPS-SENTINELA"), "preparação do teste");
  const { bytes, tipo } = tratarFoto(original);
  assert.equal(tipo, "jpeg");
  assert.ok(!latin1(bytes).includes("GPS-SENTINELA"), "o EXIF não pode sobreviver");
  assert.ok(!latin1(bytes).includes("Exif"));
  const volta = await Image.decode(bytes);
  assert.equal(volta.width, 64);
  assert.equal(volta.height, 48);
  assert.deepEqual(lerDimensoes(bytes), { largura: 64, altura: 48 });
});

Deno.test("tratarFoto mantém só a ORIENTAÇÃO do EXIF (a foto não aparece girada) e descarta o resto", async () => {
  const original = inserir(await jpeg(40, 30), exifComOrientacao(6, "GPS-SENTINELA-LAT-7.41"));
  const { bytes } = tratarFoto(original);
  const txt = latin1(bytes);
  assert.ok(!txt.includes("GPS-SENTINELA"));
  assert.ok(txt.includes("Exif"), "o EXIF mínimo, só com a orientação, é gravado");
  const i = txt.indexOf("Exif");
  assert.equal(bytes[i + 6 + 18], 0, "byte alto da orientação"); // MM, 1 entrada, valor no fim do bloco
  assert.equal(bytes[i + 6 + 19], 6, "orientação 6 preservada");
  assert.ok(bytes.length < original.length + 10);
});

Deno.test("tratarFoto descarta comentário, XMP e dados colados depois do fim da imagem", async () => {
  const base = await jpeg(20, 20);
  const xmp = new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0SEGREDO-XMP");
  const bloco = (m: number, d: Uint8Array) => new Uint8Array([0xff, m, (d.length + 2) >> 8, (d.length + 2) & 0xff, ...d]);
  let f = inserir(base, bloco(0xe1, xmp));
  f = inserir(f, bloco(0xfe, new TextEncoder().encode("COMENTARIO-PRIVADO")));
  f = new Uint8Array([...f, ...new TextEncoder().encode("PAYLOAD-COLADO-NO-FIM")]);
  const { bytes } = tratarFoto(f);
  const txt = latin1(bytes);
  for (const s of ["SEGREDO-XMP", "COMENTARIO-PRIVADO", "PAYLOAD-COLADO"]) assert.ok(!txt.includes(s), s);
  const volta = await Image.decode(bytes);
  assert.equal(volta.width, 20);
});

Deno.test("tratarFoto em PNG descarta texto e EXIF e continua sendo um PNG válido", async () => {
  const base = await png(30, 20);
  // insere um bloco tEXt logo depois do IHDR (8 de assinatura + 25 do IHDR)
  const dados = new TextEncoder().encode("Comment\0LOCAL-PRIVADO");
  const chunk = new Uint8Array(12 + dados.length);
  new DataView(chunk.buffer).setUint32(0, dados.length);
  chunk.set(new TextEncoder().encode("tEXt"), 4);
  chunk.set(dados, 8);
  const comTexto = new Uint8Array([...base.slice(0, 33), ...chunk, ...base.slice(33), ...new TextEncoder().encode("LIXO-FINAL")]);
  assert.ok(latin1(comTexto).includes("LOCAL-PRIVADO"), "preparação do teste");
  const { bytes, tipo } = tratarFoto(comTexto);
  assert.equal(tipo, "png");
  assert.ok(!latin1(bytes).includes("LOCAL-PRIVADO"));
  assert.ok(!latin1(bytes).includes("LIXO-FINAL"));
  const volta = await Image.decode(bytes);
  assert.equal(volta.width, 30);
  assert.equal(volta.height, 20);
});

Deno.test("tratarFoto recusa arquivo que não é imagem inteira", () => {
  assert.throws(() => tratarFoto(new TextEncoder().encode("não é imagem")), /foto_invalida/);
  assert.throws(() => tratarFoto(new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03])), /foto_invalida/);
});
