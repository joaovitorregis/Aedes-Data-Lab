// Ponto de entrada da função "confirmar-codigo". Toda a lógica está em handler.ts
// (separada para poder ser testada sem subir o servidor).
import { criarServico } from "../_shared/servico.ts";
import { criarHandler } from "./handler.ts";

Deno.serve(criarHandler(criarServico()));
