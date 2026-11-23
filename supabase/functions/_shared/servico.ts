// =====================================================================
// Serviço: a ÚNICA ponte entre as Edge Functions e o mundo de fora
// (banco, arquivos, e-mail, login).
//
// Por que existe uma "interface" aqui? As funções (salvar-denuncia, agente...)
// só falam com o Servico, nunca direto com o Supabase. Em produção o Servico
// usa o Supabase de verdade (criarServico, abaixo). Nos testes, entra um
// Servico falso ligado a um Postgres em memória (functions/tests). Assim as
// MESMAS regras são testadas sem precisar de internet nem de Docker.
//
// IMPORTANTE (SECURITY.md): a chave de serviço (SUPABASE_SERVICE_ROLE_KEY)
// dá acesso TOTAL ao banco, passando por cima do RLS. Ela existe só aqui, no
// servidor. Jamais vai para o navegador, para o GitHub ou para um log.
// =====================================================================
// "npm:" direto, e não pelo deno.json: o deploy pela API do Supabase (sem Docker) não envia o deno.json.
import { createClient } from "npm:@supabase/supabase-js@2";

export const BUCKET_ORIGINAIS = "fotos-originais"; // privado
export const BUCKET_PUBLICO = "fotos-publicas"; // público (fotos já tratadas)

export interface Configuracao {
  pimenta: string; // segredo do hash do código de confirmação (CODE_PEPPER)
  segredoToken: string; // segredo do token de correção (CORRECTION_TOKEN_SECRET)
  segredoRotina: string; // senha da rotina diária (CRON_SECRET)
  origensPermitidas: string; // origens do site que podem chamar (CORS), separadas por vírgula
}

export interface Servico {
  config: Configuracao;
  // Chama uma função do banco (as api_*). Os nomes dos argumentos são os do banco.
  rpc<T = unknown>(funcao: string, argumentos: Record<string, unknown>): Promise<T>;
  armazenamento: {
    subir(bucket: string, caminho: string, bytes: Uint8Array, tipoMime: string): Promise<void>;
    baixar(bucket: string, caminho: string): Promise<Uint8Array>;
    remover(bucket: string, caminhos: string[]): Promise<void>;
  };
  // Confere o login (JWT) enviado pelo navegador do agente. Devolve o id do usuário ou null.
  usuarioDoToken(jwt: string): Promise<string | null>;
  enviarEmail(para: string, assunto: string, texto: string, html?: string): Promise<void>;
}

function exigir(nome: string): string {
  const v = Deno.env.get(nome);
  if (!v) throw new Error(`variável de ambiente ausente: ${nome}`);
  return v;
}

// Serviço de produção, ligado ao Supabase. As variáveis SUPABASE_URL e
// SUPABASE_SERVICE_ROLE_KEY já existem automaticamente dentro das Edge Functions.
export function criarServico(): Servico {
  const sb = createClient(exigir("SUPABASE_URL"), exigir("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    config: {
      pimenta: exigir("CODE_PEPPER"),
      segredoToken: exigir("CORRECTION_TOKEN_SECRET"),
      segredoRotina: Deno.env.get("CRON_SECRET") ?? "",
      origensPermitidas: Deno.env.get("ALLOWED_ORIGINS") ?? "",
    },

    async rpc<T>(funcao: string, argumentos: Record<string, unknown>): Promise<T> {
      const { data, error } = await sb.rpc(funcao, argumentos);
      if (error) throw error; // o código de negócio vem em error.message (ver erros.ts)
      return data as T;
    },

    armazenamento: {
      async subir(bucket, caminho, bytes, tipoMime) {
        // upsert: reenviar a mesma foto (mesmo caminho) não dá erro nem duplica.
        const { error } = await sb.storage.from(bucket).upload(caminho, bytes, { contentType: tipoMime, upsert: true });
        if (error) throw error;
      },
      async baixar(bucket, caminho) {
        const { data, error } = await sb.storage.from(bucket).download(caminho);
        if (error) throw error;
        return new Uint8Array(await data.arrayBuffer());
      },
      async remover(bucket, caminhos) {
        if (caminhos.length === 0) return;
        const { error } = await sb.storage.from(bucket).remove(caminhos);
        if (error) throw error;
      },
    },

    async usuarioDoToken(jwt) {
      const { data, error } = await sb.auth.getUser(jwt);
      return error || !data.user ? null : data.user.id;
    },

    // E-mail. O provedor é escolhido por EMAIL_PROVIDER (DEP-03):
    //   "log"       imprime no log em vez de enviar (SÓ desenvolvimento; também vale EMAIL_MODE=log, o nome antigo);
    //   "appscript" Google Apps Script (gratuito, sem domínio próprio; limite de 100 destinatários por dia em conta Gmail comum);
    //   "resend"    Resend (exige domínio verificado para enviar a qualquer pessoa).
    // Para trocar de provedor basta mudar a variável, sem alterar as funções.
    async enviarEmail(para, assunto, texto, html) {
      const provedor = Deno.env.get("EMAIL_PROVIDER") ?? (Deno.env.get("EMAIL_MODE") === "log" ? "log" : "resend");
      if (provedor === "log") {
        console.log(`[EMAIL de desenvolvimento] para=${para} assunto=${assunto}\n${texto}`);
        return;
      }
      if (provedor === "appscript") {
        // O Apps Script responde com um redirecionamento (302); o fetch o segue sozinho e o envio já aconteceu no POST.
        const resp = await fetch(exigir("APPS_SCRIPT_URL"), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ segredo: exigir("APPS_SCRIPT_SECRET"), para, assunto, texto, html }),
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
        let corpo: { ok?: boolean } = {};
        try {
          corpo = await resp.json();
        } catch { /* resposta que não é JSON conta como falha, abaixo */ }
        if (!resp.ok || corpo.ok !== true) throw new Error(`falha ao enviar e-mail (Apps Script): HTTP ${resp.status}`);
        return;
      }
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${exigir("RESEND_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: exigir("EMAIL_FROM"), to: [para], subject: assunto, text: texto, ...(html ? { html } : {}) }),
      });
      if (!resp.ok) throw new Error(`falha ao enviar e-mail: HTTP ${resp.status}`);
    },
  };
}
