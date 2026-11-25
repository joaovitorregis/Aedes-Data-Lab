// Correção de campos pelo agente (RF-COR-01): monta só o que mudou, com antes e depois.
import { dentroDoTerritorio, soDigitos, telefoneValido, emailValido } from "./denuncia.js";
import { LARVAS, LOCAIS_DO_FOCO, formatarTelefone, rotuloRecipiente } from "./ocorrencia.js";

export function separarEndereco(texto = "") {
  const corte = texto.lastIndexOf(", ");
  return corte < 0 ? { rua: texto, numero: "" } : { rua: texto.slice(0, corte), numero: texto.slice(corte + 2) };
}
export const juntarEndereco = (rua, numero) => [rua.trim(), numero.trim()].filter(Boolean).join(", ");

// Contato confirmado no envio: só a equipe do projeto troca (D42).
export const campoTravado = (canal) => (canal === "email" ? "email" : canal ? "telefone" : null);

export function valoresIniciais(o) {
  const cidadao = o.origin === "cidadao";
  const endereco = (cidadao ? o.privado?.address : o.place_address) ?? "";
  return {
    ...separarEndereco(endereco),
    referencia: (cidadao ? o.privado?.reference : o.place_reference) ?? "",
    bairroId: String(o.neighborhood_id),
    categoriaId: String(o.category_id),
    descricao: o.description,
    foco: o.focus_location ?? "",
    focoOutro: o.focus_location_other ?? "",
    agua: o.water_present === true ? "sim" : o.water_present === false ? "nao" : "",
    recipientes: [...(o.containers ?? [])],
    larvas: o.larvae ?? "",
    ponto: { lat: o.location_lat, lng: o.location_lng },
    nome: o.privado?.name ?? "",
    telefone: o.privado ? formatarTelefone(o.privado.phone) : "",
    email: o.privado?.email ?? "",
  };
}

const vazio = "Não informado";
const texto = (t) => t || vazio;
const boolDaAgua = (v) => (v === "sim" ? true : v === "nao" ? false : null);
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function alteracoes(o, depois, { bairros = [], categorias = [] } = {}) {
  const antes = valoresIniciais(o);
  const cidadao = o.origin === "cidadao";
  const changes = {};
  const linhas = [];
  const nomeNa = (lista, id, chave) => lista.find((i) => i.id === Number(id))?.[chave] ?? String(id);
  const linha = (campo, a, d) => linhas.push({ campo, antes: texto(a), depois: texto(d) });

  const enderecoAntes = juntarEndereco(antes.rua, antes.numero);
  const endereco = juntarEndereco(depois.rua, depois.numero);
  if (endereco !== enderecoAntes) {
    changes[cidadao ? "address" : "place_address"] = endereco;
    linha("Endereço", enderecoAntes, endereco);
  }
  if (depois.referencia.trim() !== antes.referencia) {
    changes[cidadao ? "reference" : "place_reference"] = depois.referencia.trim();
    linha("Referência", antes.referencia, depois.referencia.trim());
  }
  if (depois.bairroId !== antes.bairroId) {
    changes.neighborhood_id = Number(depois.bairroId);
    linha("Bairro", nomeNa(bairros, antes.bairroId, "name"), nomeNa(bairros, depois.bairroId, "name"));
  }
  if (depois.categoriaId !== antes.categoriaId) {
    changes.category_id = Number(depois.categoriaId);
    linha("Categoria", nomeNa(categorias, antes.categoriaId, "label"), nomeNa(categorias, depois.categoriaId, "label"));
  }
  if (depois.descricao.trim() !== antes.descricao) {
    changes.description = depois.descricao.trim();
    linha("Descrição", antes.descricao, depois.descricao.trim());
  }
  const outroAntes = antes.foco === "outro" ? antes.focoOutro : "";
  const outro = depois.foco === "outro" ? depois.focoOutro.trim() : "";
  if (depois.foco !== antes.foco || outro !== outroAntes) {
    changes.focus_location = depois.foco || null;
    changes.focus_location_other = outro || null;
    linha("Onde está o foco", outroAntes || LOCAIS_DO_FOCO[antes.foco], outro || LOCAIS_DO_FOCO[depois.foco]);
  }
  if (depois.agua !== antes.agua) {
    changes.water_present = boolDaAgua(depois.agua);
    linha("Há água acumulada", LARVAS[antes.agua], LARVAS[depois.agua]);
  }
  const recipientes = depois.agua === "nao" ? [] : depois.recipientes;
  if (!iguais([...recipientes].sort(), [...antes.recipientes].sort())) {
    changes.containers = [...recipientes];
    linha("Recipientes", antes.recipientes.map(rotuloRecipiente).join(" · "), recipientes.map(rotuloRecipiente).join(" · "));
  }
  if (depois.larvas !== antes.larvas) {
    changes.larvae = depois.larvas || null;
    linha("Larvas ou pupas", LARVAS[antes.larvas], LARVAS[depois.larvas]);
  }
  if (!iguais(depois.ponto, antes.ponto)) {
    changes.location_lat = depois.ponto.lat;
    changes.location_lng = depois.ponto.lng;
    const ponto = (p) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    linha("Ponto no mapa", ponto(antes.ponto), ponto(depois.ponto));
  }
  if (o.privado) {
    const travado = campoTravado(o.privado.confirmed_channel);
    if (depois.nome.trim() !== antes.nome) {
      changes.name = depois.nome.trim();
      linha("Nome", antes.nome, depois.nome.trim());
    }
    if (travado !== "telefone" && soDigitos(depois.telefone) !== soDigitos(antes.telefone)) {
      changes.phone = soDigitos(depois.telefone);
      linha("Telefone", antes.telefone, formatarTelefone(depois.telefone));
    }
    if (travado !== "email" && depois.email.trim().toLowerCase() !== antes.email) {
      changes.email = depois.email.trim().toLowerCase();
      linha("E-mail", antes.email, changes.email);
    }
  }
  return { changes, linhas };
}

export function validarCorrecao(o, f, motivo) {
  const e = {};
  const { changes } = alteracoes(o, f);
  if (!Object.keys(changes).length) e.geral = "Nenhum dado foi alterado.";
  if (!motivo.trim()) e.motivo = "Informe o motivo da correção.";
  if (f.rua.trim().length < 3) e.rua = "Informe a rua.";
  if (!f.descricao.trim()) e.descricao = "A descrição não pode ficar vazia.";
  if (f.foco === "outro" && !f.focoOutro.trim()) e.focoOutro = "Diga qual é o outro local.";
  if (!dentroDoTerritorio(f.ponto.lat, f.ponto.lng)) e.ponto = "O ponto está fora de Itambé.";
  if (o.privado) {
    if (f.nome.trim().length < 2) e.nome = "Informe o nome.";
    if ("phone" in changes && !telefoneValido(f.telefone)) e.telefone = "Use o DDD e o número.";
    if ("email" in changes && !emailValido(f.email)) e.email = "E-mail inválido.";
  }
  return e;
}
