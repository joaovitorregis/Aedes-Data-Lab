import { test } from "node:test";
import assert from "node:assert/strict";
import { montarDados, tamanhoDaFoto, validarFotos } from "../../site/js/dominio/denuncia.js";

const campos = {
  submissionId: "11111111-2222-4333-8444-555555555555", lat: -7.41, lng: -35.1,
  bairroId: "3", categoriaId: "2", descricao: " Pneu com água ", localFoco: "quintal", localFocoRotulo: "Quintal",
  agua: "sim", recipientes: ["pneus", "pneus"], larvas: "nao_sei", tempo: "Há poucos dias",
  outraEvidencia: " Perto do muro ", nome: " Pessoa de exemplo ", email: "Pessoa@Exemplo.com",
  telefone: "(81) 99999-0000", logradouro: "Rua A", semNumero: false, numero: "45", referencia: "",
};

test("monta a denúncia no formato do servidor", () => {
  const d = montarDados(campos);
  assert.equal(d.neighborhood_id, 3);
  assert.equal(d.category_id, 2);
  assert.equal(d.description, "Pneu com água");
  assert.equal(d.focus_location, "residencia");
  assert.deepEqual(d.containers, ["pneus"]);
  assert.equal(d.other_evidence, "Perto do muro");
  assert.equal(d.phone, "81999990000");
  assert.equal(d.email, "pessoa@exemplo.com");
  assert.equal(d.confirmed_contact, "pessoa@exemplo.com");
  assert.equal(d.address, "Rua A, 45");
  assert.equal(d.reference, null);
  assert.equal("cpf" in d, false);
});

test("outra evidência vazia não é enviada como texto", () => {
  assert.equal(montarDados({ ...campos, outraEvidencia: "   " }).other_evidence, null);
});

test("aceita só de uma a três fotos JPEG ou PNG, como o servidor", () => {
  const foto = (type, size = 1000) => ({ name: "f", type, size });
  assert.equal(validarFotos([foto("image/jpeg"), foto("image/png")]), "");
  assert.notEqual(validarFotos([]), "");
  assert.notEqual(validarFotos([foto("image/webp")]), "");
  assert.notEqual(validarFotos([foto("image/jpeg", 11 * 1024 * 1024)]), "");
  assert.notEqual(validarFotos(Array(4).fill(foto("image/jpeg"))), "");
});

test("foto grande é reduzida mantendo a proporção; pequena fica como está", () => {
  assert.deepEqual(tamanhoDaFoto(4000, 3000), { largura: 1600, altura: 1200 });
  assert.deepEqual(tamanhoDaFoto(3000, 4000), { largura: 1200, altura: 1600 });
  assert.deepEqual(tamanhoDaFoto(800, 600), { largura: 800, altura: 600 });
});
