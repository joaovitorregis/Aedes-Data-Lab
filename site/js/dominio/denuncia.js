// =====================================================================
// dominio/denuncia.js — regras da denúncia que NÃO dependem da tela nem da rede.
// O navegador usa estas regras para orientar a pessoa; o servidor confere tudo
// de novo (nunca confie só no navegador: ARCHITECTURE, seção 4).
// =====================================================================

// Retângulo PROVISÓRIO que cobre Itambé-PE (igual ao do banco, DEP-01). O contorno
// real do município entra depois, e o servidor continua sendo quem decide.
export const TERRITORIO = { latMin: -7.56, latMax: -7.26, lngMin: -35.25, lngMax: -34.95 };
export const CENTRO_DO_MAPA = { lat: -7.41, lng: -35.1 };

export const LIMITES = { fotos: 3, bytesPorFoto: 10 * 1024 * 1024, descricao: 1000, tempo: 120 };
export const TIPOS_DE_FOTO = ["image/jpeg", "image/png"];

export function dentroDoTerritorio(lat, lng) {
  return lat >= TERRITORIO.latMin && lat <= TERRITORIO.latMax && lng >= TERRITORIO.lngMin && lng <= TERRITORIO.lngMax;
}

export const emailValido = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.trim());

// Telefone brasileiro: DDD + 8 ou 9 dígitos. Guardamos só os números.
export const soDigitos = (t) => t.replace(/\D/g, "");
export function telefoneValido(t) {
  const d = soDigitos(t);
  return d.length === 10 || d.length === 11;
}

// Devolve uma mensagem de erro, ou "" se as fotos estão ok (1 a 3, JPEG/PNG, até 10 MiB cada).
export function validarFotos(arquivos) {
  if (arquivos.length < 1) return "Anexe pelo menos uma foto do foco.";
  if (arquivos.length > LIMITES.fotos) return `Envie no máximo ${LIMITES.fotos} fotos.`;
  for (const f of arquivos) {
    if (!TIPOS_DE_FOTO.includes(f.type)) return `A foto "${f.name}" não é JPEG ou PNG.`;
    if (f.size > LIMITES.bytesPorFoto) return `A foto "${f.name}" passa de 10 MB.`;
  }
  return "";
}

// Fotos de celular são grandes demais: o lado maior fica com até 1600 pixels.
export function tamanhoDaFoto(largura, altura, maximo = 1600) {
  const escala = Math.min(1, maximo / Math.max(largura, altura));
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

// ---------- traduções entre o formulário e o banco ----------
// "Onde está o foco?": o banco só conhece 4 valores; o resto vira "outro" + o texto escolhido.
const LOCAL_DO_FOCO = {
  casa: "residencia", quintal: "residencia", comercio: "comercio", terreno: "terreno_baldio",
};
export function localDoFoco(valor, rotulo) {
  const codigo = LOCAL_DO_FOCO[valor];
  return codigo ? { focus_location: codigo } : { focus_location: "outro", focus_location_other: rotulo.slice(0, 120) };
}

// "Havia água acumulada?": sim/não/não sei -> true/false/null.
export const aguaParaBanco = (v) => (v === "sim" ? true : v === "nao" ? false : null);

// Recipientes marcados -> códigos do banco, sem repetir e sem "não sei".
export const recipientesParaBanco = (valores) => [...new Set(valores.filter((v) => v && v !== "nao_sei"))];

// Monta o objeto `dados` que a Edge Function salvar-denuncia espera.
export function montarDados(c) {
  return {
    submission_id: c.submissionId,
    lat: c.lat,
    lng: c.lng,
    neighborhood_id: Number(c.bairroId),
    category_id: Number(c.categoriaId),
    description: c.descricao.trim(),
    ...localDoFoco(c.localFoco, c.localFocoRotulo),
    water_present: aguaParaBanco(c.agua),
    containers: recipientesParaBanco(c.recipientes),
    larvae: c.larvas || null,
    noticed_since: c.tempo ? c.tempo.slice(0, LIMITES.tempo) : null,
    other_evidence: c.outraEvidencia?.trim().slice(0, 500) || null,
    name: c.nome.trim(),
    email: c.email.trim().toLowerCase(),
    phone: soDigitos(c.telefone),
    address: [c.logradouro.trim(), c.semNumero ? "s/n" : c.numero.trim()].filter(Boolean).join(", ").slice(0, 200),
    reference: c.referencia.trim().slice(0, 200) || null,
    confirmed_channel: "email",
    confirmed_contact: c.email.trim().toLowerCase(),
  };
}
