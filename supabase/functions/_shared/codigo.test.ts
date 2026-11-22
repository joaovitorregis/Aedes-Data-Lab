import assert from "node:assert/strict";
import { gerarCodigo, hashCodigo } from "./codigo.ts";

Deno.test("código tem sempre 6 dígitos", () => {
  for (let i = 0; i < 2000; i++) assert.match(gerarCodigo(), /^\d{6}$/);
});

Deno.test("códigos variam (não é constante)", () => {
  const s = new Set(Array.from({ length: 200 }, gerarCodigo));
  assert.ok(s.size > 150);
});

Deno.test("hash é estável e tem 64 caracteres hexadecimais", async () => {
  const a = await hashCodigo("pimenta", "sub-1", "a@x.com", "123456");
  const b = await hashCodigo("pimenta", "sub-1", "a@x.com", "123456");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

Deno.test("hash muda se qualquer parte muda (segredo, tentativa, contato, código)", async () => {
  const base = await hashCodigo("pimenta", "sub-1", "a@x.com", "123456");
  assert.notEqual(base, await hashCodigo("outra", "sub-1", "a@x.com", "123456"));
  assert.notEqual(base, await hashCodigo("pimenta", "sub-2", "a@x.com", "123456"));
  assert.notEqual(base, await hashCodigo("pimenta", "sub-1", "b@x.com", "123456"));
  assert.notEqual(base, await hashCodigo("pimenta", "sub-1", "a@x.com", "654321"));
});

Deno.test("hash ignora maiúsculas do contato (igual ao banco, que guarda em minúsculas)", async () => {
  assert.equal(
    await hashCodigo("p", "s", "Joao@Exemplo.com", "111111"),
    await hashCodigo("p", "s", "joao@exemplo.com", "111111"),
  );
});
