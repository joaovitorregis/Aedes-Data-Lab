import { criarBanco, como, esperaErro, teste, igual, verdade } from './helpers.mjs';

const db = await criarBanco();

await teste('todas as migrations aplicam sem erro', async () => {
  const r = await db.query("select count(*)::int n from public.neighborhoods");
  igual(r.rows[0].n, 16);
});
