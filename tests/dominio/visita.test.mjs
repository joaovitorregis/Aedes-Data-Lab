import { test } from "node:test";
import assert from "node:assert/strict";
import {
  efeitoDaVisita, montarFoco, montarVisita, resumoDaVisita, validarFoco, validarVisita,
} from "../../site/js/dominio/visita.js";

const regras = { recebidaEm: "2026-11-08", hoje: "2026-11-15" };
const completa = (extra) => ({
  data: "2026-11-15", acesso: "com_acesso", foco: "residencia", focoOutro: "", agua: "sim",
  recipientes: ["pneus"], larvas: "sim", acoes: ["orientacao"], observacoes: "  Morador ajudou.  ", ...extra,
});

test("visita completa não tem erro", () => {
  assert.deepEqual(validarVisita(completa(), regras), {});
});

test("com acesso exige foco, água, larvas e pelo menos uma ação", () => {
  const e = validarVisita(completa({ foco: "", agua: "", larvas: "", acoes: [] }), regras);
  assert.deepEqual(Object.keys(e).sort(), ["acoes", "agua", "foco", "larvas"]);
});

test("com água exige um recipiente; outro local exige o nome", () => {
  assert.ok(validarVisita(completa({ recipientes: [] }), regras).recipientes);
  assert.ok(validarVisita(completa({ foco: "outro" }), regras).focoOutro);
});

test("data futura ou anterior ao recebimento é recusada", () => {
  assert.ok(validarVisita(completa({ data: "2026-11-16" }), regras).data);
  assert.ok(validarVisita(completa({ data: "2026-11-07" }), regras).data);
});

test("sem acesso pede só data e motivo", () => {
  assert.deepEqual(validarVisita({ data: "2026-11-15", acesso: "fechado" }, regras), {});
  assert.ok(validarVisita({ data: "2026-11-15", acesso: "" }, regras).acesso);
});

test("sem acesso não envia respostas que ficaram preenchidas", () => {
  const v = montarVisita(completa({ acesso: "recusado" }), "id-1");
  assert.deepEqual(v, { id: "id-1", visited_on: "2026-11-15", access: "recusado", notes: "Morador ajudou." });
});

test("sem água não envia recipientes", () => {
  const v = montarVisita(completa({ agua: "nao" }), "id-1");
  assert.equal(v.water_present, false);
  assert.deepEqual(v.containers, []);
});

test("o resumo usa as mesmas palavras do formulário", () => {
  const linhas = resumoDaVisita(montarVisita(completa(), "id-1"));
  assert.deepEqual(linhas.slice(0, 4), [
    ["Data", "15/11/2026"], ["Acesso", "Com acesso"], ["Onde está o foco", "Residência"], ["Há água acumulada", "Sim"],
  ]);
});

test("o aviso diz o efeito antes de confirmar", () => {
  assert.equal(efeitoDaVisita("com_acesso", 0), "A ocorrência ficará Atendida e não poderá ser reaberta.");
  assert.equal(efeitoDaVisita("fechado", 2), "A ocorrência continua Em análise. Esta é a 3ª tentativa sem acesso.");
});

const foco = (extra) => ({
  ...completa(), bairroId: "1", rua: "Rua das Flores", numero: "15", referencia: "", categoriaId: "6",
  descricao: "Entulho com água.", ponto: { lat: -7.41, lng: -35.1 }, fotos: [{}], ...extra,
});

test("local sem denúncia exige endereço, categoria, descrição, ponto e foto", () => {
  const e = validarFoco(foco({ bairroId: "", rua: "", categoriaId: "", descricao: " ", ponto: null, fotos: [] }), { hoje: "2026-11-15" });
  assert.deepEqual(Object.keys(e).sort(), ["bairroId", "categoriaId", "descricao", "fotos", "ponto", "rua"]);
});

test("local sem denúncia recusa ponto fora de Itambé", () => {
  assert.ok(validarFoco(foco({ ponto: { lat: -8.05, lng: -34.9 } }), { hoje: "2026-11-15" }).ponto);
});

test("local sem denúncia monta o pedido no formato do servidor", () => {
  const d = montarFoco(foco(), { submissionId: "s1", visitaId: "v1" });
  assert.equal(d.place_address, "Rua das Flores, 15");
  assert.equal(d.neighborhood_id, 1);
  assert.equal(d.category_id, 6);
  assert.equal(d.submission_id, "s1");
  assert.equal(d.visit.id, "v1");
  assert.equal(d.visit.access, "com_acesso");
});
