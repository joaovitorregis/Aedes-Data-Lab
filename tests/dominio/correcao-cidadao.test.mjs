import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alteracoesDoCidadao, comoOcorrencia, validarCorrecaoDoCidadao, valoresIniciais,
} from "../../site/js/dominio/correcao.js";

// Formato devolvido por acesso-correcao, ação "confirmar".
const denuncia = {
  location_lat: -7.41, location_lng: -35.1, neighborhood_id: 7, category_id: 1,
  description: "Pneus com água.", focus_location: "residencia", focus_location_other: null, water_present: true,
  containers: ["pneus"], larvae: "nao_sei", noticed_since: "Hoje", other_evidence: null,
  name: "Pessoa de exemplo", phone: "81900000000", email: "pessoa@exemplo.invalid",
  address: "Rua da Aurora, 123", reference: null, confirmed_channel: "email",
};
const formulario = (mudancas = {}) => ({
  ...valoresIniciais(comoOcorrencia(denuncia)),
  tempo: denuncia.noticed_since, outraEvidencia: "", ...mudancas,
});

test("sem mexer em nada não há alteração e a tela avisa", () => {
  assert.deepEqual(alteracoesDoCidadao(denuncia, formulario()).changes, {});
  assert.equal(validarCorrecaoDoCidadao(denuncia, formulario(), "motivo").geral, "Nenhum dado foi alterado.");
});

test("envia só o que mudou, com antes e depois", () => {
  const { changes, linhas } = alteracoesDoCidadao(denuncia, formulario({ descricao: "Balde com água.", numero: "125" }));
  assert.deepEqual(changes, { address: "Rua da Aurora, 125", description: "Balde com água." });
  assert.equal(linhas.length, 2);
});

test("tempo observado e outra evidência, que só o cidadão informa, também contam", () => {
  const f = formulario({ tempo: "Há uma semana", outraEvidencia: " Perto do muro " });
  assert.deepEqual(alteracoesDoCidadao(denuncia, f).changes,
    { noticed_since: "Há uma semana", other_evidence: "Perto do muro" });
  assert.deepEqual(validarCorrecaoDoCidadao(denuncia, f, "Lembrei melhor"), {});
});

test("o e-mail confirmado nunca é alterado", () => {
  const f = formulario({ email: "outro@exemplo.invalid", telefone: "(81) 98888-7777" });
  assert.deepEqual(alteracoesDoCidadao(denuncia, f).changes, { phone: "81988887777" });
});

test("motivo é obrigatório e o ponto precisa estar em Itambé", () => {
  const erros = validarCorrecaoDoCidadao(denuncia, formulario({ ponto: { lat: -8.05, lng: -34.9 } }), "  ");
  assert.ok(erros.motivo);
  assert.ok(erros.ponto);
});
