# Testes do banco (sem Docker)

Aplicam **todas** as migrations de `../migrations` num Postgres em memória (PGlite)
e conferem as regras, inclusive os casos de **acesso negado**.

```
cd supabase/tests
npm install      # só na primeira vez
npm test
```

`stubs_supabase.sql` simula o que o Supabase já tem (papéis `anon`, `authenticated`,
`service_role`, `auth.users`, `auth.uid()`, o esquema `storage`). **Não é migration**
e nunca vai para o banco real.
