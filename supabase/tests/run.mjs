// =====================================================================
// Executor dos testes. Roda cada arquivo *.test.mjs desta pasta, em ordem.
//
// Como usar (na pasta supabase/tests):
//   npm install        (uma vez; instala o PGlite)
//   npm test
//
// Cada teste: cria um Postgres vazio em memória, aplica TODAS as migrations
// de supabase/migrations e confere o comportamento (inclusive "acesso negado").
// =====================================================================
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { resumo } from './helpers.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
for (const arq of readdirSync(aqui).filter((f) => f.endsWith('.test.mjs')).sort()) {
  console.log(`\n${arq}`);
  await import(pathToFileURL(join(aqui, arq)).href);
}
process.exit(resumo() ? 1 : 0);
