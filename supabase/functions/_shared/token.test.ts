import assert from "node:assert/strict";
import { emitirToken, verificarToken } from "./token.ts";

const seg = "segredo-de-teste-com-bastante-entropia";

Deno.test("token válido volta com os dados", async () => {
  const t = await emitirToken(seg, { rid: "r1", ver: 3 }, 600);
  const p = await verificarToken(seg, t);
  assert.equal(p?.rid, "r1");
  assert.equal(p?.ver, 3);
});

Deno.test("token expirado é recusado", async () => {
  const t = await emitirToken(seg, { rid: "r1", ver: 1 }, -10);
  assert.equal(await verificarToken(seg, t), null);
});

Deno.test("assinatura adulterada ou segredo errado é recusado", async () => {
  const t = await emitirToken(seg, { rid: "r1", ver: 1 }, 600);
  assert.equal(await verificarToken("outro-segredo", t), null);
  assert.equal(await verificarToken(seg, t.slice(0, -2) + "xx"), null);
});

Deno.test("dados adulterados (trocar a denúncia) invalidam a assinatura", async () => {
  const t = await emitirToken(seg, { rid: "r1", ver: 1 }, 600);
  const [dados, assinatura] = t.split(".");
  const falso = btoa(JSON.stringify({ rid: "r2", ver: 1, exp: 9999999999 })).replaceAll("=", "");
  assert.equal(await verificarToken(seg, `${falso}.${assinatura}`), null);
  assert.ok(dados.length > 0);
});

Deno.test("lixo e vazio são recusados sem lançar erro", async () => {
  for (const x of ["", "abc", "a.b.c", ".", "....", "%%%.%%%"]) assert.equal(await verificarToken(seg, x), null);
});
