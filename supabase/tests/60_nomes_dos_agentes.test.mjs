// Nomes dos agentes para o histórico da ocorrência (RF-AGE-01).
import { criarBanco, criarAgente, como, esperaErro, teste, igual, verdade, randomUUID } from './helpers.mjs';

const db = await criarBanco();
const marina = await criarAgente(db, { nome: 'Marina Souza' });
const antigo = await criarAgente(db, { nome: 'Agente Antigo', ativo: false });
const curioso = randomUUID();
await db.query('insert into auth.users (id, email) values ($1, $2)', [curioso, 'curioso@teste.invalid']);
const CHAMADA = 'select public.agent_profile_names() as r';

await teste('agente ativo recebe o nome de todos os agentes, inclusive desativados', async () => {
  const r = (await como(db, 'authenticated', marina, CHAMADA)).rows[0].r;
  igual(r[marina], 'Marina Souza');
  igual(r[antigo], 'Agente Antigo');
  igual(Object.keys(r).length, 2);
});

await teste('a função devolve só identificador e nome', async () => {
  const r = (await como(db, 'authenticated', marina, CHAMADA)).rows[0].r;
  verdade(Object.values(r).every((v) => typeof v === 'string'), 'veio mais que o nome');
});

await teste('conta sem papel de agente é recusada', async () => {
  const msg = await esperaErro(db, 'authenticated', curioso, CHAMADA);
  verdade(msg.includes('nao_autorizado'), msg);
});

await teste('agente desativado é recusado', async () => {
  const msg = await esperaErro(db, 'authenticated', antigo, CHAMADA);
  verdade(msg.includes('nao_autorizado'), msg);
});

await teste('visitante não pode chamar', async () => {
  const msg = await esperaErro(db, 'anon', null, CHAMADA);
  verdade(msg.includes('permission denied'), msg);
});

await teste('o agente continua lendo só o próprio perfil direto na tabela', async () => {
  const r = await como(db, 'authenticated', marina, 'select id from public.profiles');
  igual(r.rows.length, 1);
});
