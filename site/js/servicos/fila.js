// Visitas que não puderam ser enviadas ficam neste aparelho até irem ou serem descartadas (RF-AGE-03).
// IndexedDB, porque o registro em local sem denúncia leva fotos.
import { registrarFocoSemDenuncia, registrarVisita } from "./agente.js";
import { vaiTentarDeNovo } from "../dominio/envio.js";

const BANCO = "aedes-agente";
const LOJA = "pendentes";

function abrir() {
  return new Promise((ok, falha) => {
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA, { keyPath: "id" });
    pedido.onsuccess = () => ok(pedido.result);
    pedido.onerror = () => falha(pedido.error);
  });
}

async function operar(modo, acao) {
  const db = await abrir();
  return new Promise((ok, falha) => {
    const transacao = db.transaction(LOJA, modo);
    const pedido = acao(transacao.objectStore(LOJA));
    transacao.oncomplete = () => { db.close(); ok(pedido.result); };
    transacao.onerror = transacao.onabort = () => { db.close(); falha(transacao.error); };
  });
}

export const guardarPendente = (item) => operar("readwrite", (l) => l.put({ criadoEm: Date.now(), recusa: null, ...item }));
export const descartarPendente = (id) => operar("readwrite", (l) => l.delete(id));

export async function listarPendentes(usuarioId) {
  const todos = await operar("readonly", (l) => l.getAll());
  return todos.filter((i) => i.usuario === usuarioId).sort((a, b) => a.criadoEm - b.criadoEm);
}

export const enviarPendente = (item) => (item.tipo === "foco"
  ? registrarFocoSemDenuncia(item.dados, item.fotos)
  : registrarVisita(item.reportId, item.versao, item.visita));

let reenvio = null;

// Tenta enviar tudo o que está esperando. O servidor reconhece o mesmo identificador e não duplica.
export function reenviarPendentes(usuarioId) {
  reenvio ??= (async () => {
    let enviados = 0;
    for (const item of await listarPendentes(usuarioId)) {
      if (item.recusa) continue;
      try {
        await enviarPendente(item);
        await descartarPendente(item.id);
        enviados++;
      } catch (e) {
        if (vaiTentarDeNovo(e)) break;
        await guardarPendente({ ...item, recusa: e.message });
      }
    }
    return enviados;
  })().finally(() => { reenvio = null; });
  return reenvio;
}
