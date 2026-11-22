// O seed (dados fictícios de desenvolvimento) precisa carregar e NÃO pode vazar dado privado.
import { criarBanco, como, esperaErro, teste, igual, verdade } from './helpers.mjs';

const db = await criarBanco({ comSeed: true });

await teste('seed carrega: 7 denúncias, 6 publicadas', async () => {
  igual((await db.query('select count(*)::int n from public.reports')).rows[0].n, 7);
  igual((await db.query('select count(*)::int n from public.public_reports')).rows[0].n, 6);
});

await teste('visitante vê as 6 publicadas, sem nenhum campo privado', async () => {
  const r = await como(db, 'anon', null, 'select * from public.public_reports');
  igual(r.rows.length, 6);
  const texto = JSON.stringify(r.rows);
  for (const proibida of ['morador', 'Ficticia', 'exemplo.invalid', 'AED-', 'original-']) {
    verdade(!texto.includes(proibida), `vazou: ${proibida}`);
  }
});

await teste('seed preserva as regras: só em análise ou encerrada têm 3 tentativas sem acesso', async () => {
  const r = await db.query("select stage from public.reports where failed_attempts >= 3 order by stage");
  igual(r.rows.map((x) => x.stage), ['em_analise', 'encerrada']);
});
