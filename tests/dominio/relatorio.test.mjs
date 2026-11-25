import { test } from "node:test";
import assert from "node:assert/strict";
import { montarRelatorio, nomeDoArquivo, periodoDoRelatorio, secoesDoRelatorio } from "../../site/js/dominio/relatorio.js";

test("esta semana vai de segunda até hoje", () => {
  // 15/11/2026 é um domingo.
  assert.deepEqual(periodoDoRelatorio("esta_semana", "2026-11-15"), { de: "2026-11-09", ate: "2026-11-15" });
  assert.deepEqual(periodoDoRelatorio("esta_semana", "2026-11-09"), { de: "2026-11-09", ate: "2026-11-09" });
});

test("semana passada, este mês e datas escolhidas", () => {
  assert.deepEqual(periodoDoRelatorio("semana_passada", "2026-11-15"), { de: "2026-11-02", ate: "2026-11-08" });
  assert.deepEqual(periodoDoRelatorio("este_mes", "2026-11-15"), { de: "2026-11-01", ate: "2026-11-15" });
  assert.deepEqual(periodoDoRelatorio("datas", "2026-11-15", "2026-10-01", "2026-10-31"), { de: "2026-10-01", ate: "2026-10-31" });
});

test("datas incompletas ou invertidas não formam período", () => {
  assert.equal(periodoDoRelatorio("datas", "2026-11-15", "2026-11-10", ""), null);
  assert.equal(periodoDoRelatorio("datas", "2026-11-15", "2026-11-12", "2026-11-10"), null);
  assert.equal(periodoDoRelatorio("datas", "2026-11-15", "2026-11-10", "2026-11-20"), null);
});

test("o nome do arquivo indica o período", () => {
  assert.equal(nomeDoArquivo({ de: "2026-11-09", ate: "2026-11-15" }, "pdf"), "relatorio-aedes-2026-11-09-a-2026-11-15.pdf");
});

const dia = (d) => `2026-11-${String(d).padStart(2, "0")}T15:00:00Z`;
const rep = (id, extra) => ({
  id, protocol: `AED-${id}`, origin: "cidadao", stage: "recebida", publication: "publicada", neighborhood_id: 1,
  received_at: dia(10), failed_attempts: 0, archived_at: null, place_address: null, ...extra,
});
const visita = (id, report_id, d, extra) => ({
  id, report_id, visited_on: `2026-11-${String(d).padStart(2, "0")}`, access: "com_acesso", focus_location: "residencia",
  containers: ["pneus"], larvae: "sim", actions: ["orientacao"], notes: null, water_present: true, ...extra,
});

const dados = {
  periodo: { de: "2026-11-09", ate: "2026-11-15" },
  bairros: [{ id: 1, name: "Maracujá" }, { id: 2, name: "Planalto" }],
  ocorrencias: [
    rep("atendida", { stage: "atendida" }),
    rep("agente", { origin: "agente", stage: "atendida", neighborhood_id: 2, place_address: "Rua B, 2" }),
    rep("arquivada", { stage: "atendida", publication: "arquivada", archived_at: dia(14) }),
    rep("semacesso", { stage: "encerrada", failed_attempts: 3, received_at: dia(2) }),
    rep("pendente", { stage: "em_analise", failed_attempts: 1, received_at: dia(2) }),
    rep("antiga", { stage: "atendida", received_at: dia(1) }),
  ],
  visitas: [
    visita("v1", "atendida", 11),
    visita("v2", "agente", 12, { containers: ["lixo_entulho", "pneus"], larvae: "nao" }),
    visita("v3", "arquivada", 13, { larvae: "nao_sei" }),
    visita("v4", "pendente", 14, { access: "fechado", focus_location: null, containers: [], larvae: null, actions: [] }),
    visita("v5", "antiga", 3),
  ],
  eventos: [
    { report_id: "semacesso", event_type: "analise_iniciada", created_at: dia(3) },
    { report_id: "semacesso", event_type: "encerrada_sem_acesso", created_at: dia(12) },
    { report_id: "pendente", event_type: "analise_iniciada", created_at: dia(3) },
    { report_id: "arquivada", event_type: "arquivada", created_at: dia(14), new_value: { stage: "atendida" } },
  ],
  enderecos: { atendida: "Rua A, 1", pendente: "Rua C, 3" },
};

test("resumo separa origens e conta cada conclusão uma vez só", () => {
  assert.deepEqual(montarRelatorio(dados).resumo, {
    cidadaos: 2, agentes: 1, visitas: 4,
    atendidas: 2, encerradasSemAcesso: 1, arquivadas: 1,
    tentativasSemAcesso: 1, pendentes: 1, comLarvas: 1,
  });
});

test("recipientes contam as visitas com acesso do período", () => {
  assert.deepEqual(montarRelatorio(dados).recipientes, [
    { nome: "Pneus", visitas: 3 }, { nome: "Lixo ou entulho", visitas: 1 },
  ]);
});

test("a tabela por bairro traz todos os bairros e o total fecha", () => {
  const r = montarRelatorio(dados);
  assert.deepEqual(r.porBairro, [
    { bairro: "Maracujá", entraram: 2, visitas: 3, atendidas: 1, encerradas: 2, pendentes: 1 },
    { bairro: "Planalto", entraram: 1, visitas: 1, atendidas: 1, encerradas: 0, pendentes: 0 },
  ]);
});

test("pendente é o que estava aberto no último dia do período", () => {
  const r = montarRelatorio({ ...dados, periodo: { de: "2026-11-09", ate: "2026-11-11" } });
  // Em 11/11 a ocorrência encerrada no dia 12 ainda estava aberta.
  // Ocorrência de agente nasce Atendida: nunca é pendente.
  assert.deepEqual(r.pendentes.map((p) => p.protocolo).sort(), ["AED-arquivada", "AED-pendente", "AED-semacesso"]);
  assert.equal(r.pendentes.find((p) => p.protocolo === "AED-pendente").tentativas, 0);
});

test("visitas e pendentes trazem endereço e nunca dados do morador", () => {
  const r = montarRelatorio(dados);
  assert.equal(r.visitas.find((v) => v.protocolo === "AED-agente").endereco, "Rua B, 2");
  assert.equal(r.visitas.find((v) => v.protocolo === "AED-atendida").endereco, "Rua A, 1");
  assert.doesNotMatch(JSON.stringify(r), /name|email|phone/);
});

test("filtro de bairro recorta todos os números", () => {
  const r = montarRelatorio({ ...dados, bairroId: 2 });
  assert.equal(r.resumo.agentes, 1);
  assert.equal(r.resumo.cidadaos, 0);
  assert.deepEqual(r.porBairro.map((b) => b.bairro), ["Planalto"]);
});

test("o arquivo tem as seções na ordem, com a linha de total por bairro", () => {
  const s = secoesDoRelatorio(montarRelatorio(dados));
  assert.deepEqual(s.tabelas.map((t) => t.titulo), [
    "Por bairro", "Visitas do período", "Recipientes com água nas visitas com acesso", "Pendentes no fim do período",
  ]);
  assert.deepEqual(s.tabelas[0].total, ["Total", 3, 4, 2, 2, 1]);
  assert.deepEqual(s.resumo[1], { titulo: "Como terminaram", itens: [["Atendidas", 2], ["Encerradas sem acesso", 1], ["Arquivadas", 1]] });
});

test("no arquivo, cada visita traz endereço e observações", () => {
  const comNota = { ...dados, visitas: [visita("v1", "atendida", 11, { notes: "Portão aberto." })] };
  const linha = secoesDoRelatorio(montarRelatorio(comNota)).tabelas[1].linhas[0];
  assert.equal(linha[0], "11/11");
  assert.match(linha[2], /Maracujá.*Rua A, 1/s);
  assert.match(linha.at(-1), /Orientação ao morador.*Obs\.: Portão aberto\./s);
});

test("período sem visitas gera o arquivo com aviso", () => {
  const s = secoesDoRelatorio(montarRelatorio({ ...dados, periodo: { de: "2026-09-01", ate: "2026-09-07" } }));
  assert.equal(s.tabelas[1].linhas.length, 0);
  assert.equal(s.tabelas[1].vazio, "Nenhuma visita no período.");
});
