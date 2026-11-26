// Servidor local do site, com os mesmos endereços da Vercel (lê site/vercel.json).
// Uso: npm run servir   (abre em http://localhost:5500)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORTA = Number(process.env.PORT ?? 5500);
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
};
const vercel = JSON.parse(await readFile(join(RAIZ, "vercel.json"), "utf8"));

createServer(async (pedido, resposta) => {
  try {
    const caminho = decodeURIComponent(new URL(pedido.url, "http://local").pathname).replace(/(.)\/$/, "$1");
    const desvio = vercel.redirects?.find((r) => r.source === caminho);
    if (desvio) {
      resposta.writeHead(307, { Location: desvio.destination });
      resposta.end();
      return;
    }
    const destino = vercel.rewrites?.find((r) => r.source === caminho)?.destination ?? caminho;
    const arquivo = normalize(join(RAIZ, destino));
    if (!arquivo.startsWith(RAIZ + sep) || !(await stat(arquivo)).isFile()) throw new Error("fora do site");
    const extras = Object.fromEntries((vercel.headers ?? [])
      .filter((h) => new RegExp(`^${h.source}$`).test(caminho))
      .flatMap((h) => h.headers.map((c) => [c.key, c.value])));
    resposta.writeHead(200, {
      "Content-Type": TIPOS[extname(arquivo).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store", ...extras,
    });
    resposta.end(await readFile(arquivo));
  } catch {
    resposta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    resposta.end("Não encontrado");
  }
}).listen(PORTA, "127.0.0.1", () => console.log(`Site em http://localhost:${PORTA}`));
