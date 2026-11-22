// Ponto de entrada da função "acesso-correcao". Toda a lógica está em handler.ts
// (separada para poder ser testada sem subir o servidor).
import { criarServico } from "../_shared/servico.ts";
import { criarHandler } from "./handler.ts";

Deno.serve(criarHandler(criarServico()));
