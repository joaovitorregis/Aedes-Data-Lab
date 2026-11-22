import assert from "node:assert/strict";
import { traduzir } from "./erros.ts";

Deno.test("código de negócio vira status e mensagem em português", () => {
  assert.deepEqual(
    (({ status, codigo }) => ({ status, codigo }))(traduzir({ message: "etapa_invalida" })),
    { status: 409, codigo: "etapa_invalida" },
  );
  assert.equal(traduzir({ message: "fora_do_territorio" }).status, 422);
  assert.equal(traduzir({ message: "nao_autorizado" }).status, 403);
  assert.equal(traduzir({ message: "versao_desatualizada" }).status, 409);
  assert.equal(traduzir({ message: "denuncia_nao_encontrada" }).status, 404);
});

Deno.test("código com detalhe depois dos dois pontos continua reconhecido", () => {
  const e = traduzir({ message: "campo_desconhecido: stage" });
  assert.equal(e.codigo, "campo_desconhecido");
  assert.equal(e.status, 422);
});

Deno.test("violação de regra do banco vira dados_invalidos SEM vazar o nome da constraint", () => {
  const e = traduzir({ code: "23514", message: 'new row violates check constraint "report_private_phone_check"' });
  assert.equal(e.status, 422);
  assert.equal(e.codigo, "dados_invalidos");
  assert.ok(!e.mensagem.includes("report_private"));
});

Deno.test("erro desconhecido vira 500 genérico, sem detalhes internos", () => {
  const e = traduzir({ message: "connection refused to 10.0.0.5:5432" });
  assert.equal(e.status, 500);
  assert.equal(e.codigo, "erro_interno");
  assert.ok(!e.mensagem.includes("10.0.0.5"));
});
