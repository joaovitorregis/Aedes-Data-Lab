import { test } from "node:test";
import assert from "node:assert/strict";
import { vaiTentarDeNovo } from "../../site/js/dominio/envio.js";

test("falha de rede, de sessão, de limite ou do servidor guarda para reenviar", () => {
  for (const erro of [{ codigo: "sem_conexao", status: 0 }, { status: 401 }, { status: 429 }, { status: 500 }, { status: 502 }]) {
    assert.equal(vaiTentarDeNovo(erro), true, JSON.stringify(erro));
  }
});

test("recusa do servidor não é reenviada sozinha", () => {
  for (const erro of [{ codigo: "versao_desatualizada", status: 409 }, { codigo: "data_invalida", status: 422 }, { status: 403 }]) {
    assert.equal(vaiTentarDeNovo(erro), false, JSON.stringify(erro));
  }
});

test("erro que não veio do servidor também é guardado", () => {
  assert.equal(vaiTentarDeNovo(new TypeError("falhou")), true);
});
