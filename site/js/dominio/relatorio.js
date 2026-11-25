// Contagens do relatório do agente (RF-AGE-08).
import {
  ACESSOS, ACOES_NO_LOCAL, ETAPAS, LARVAS, LOCAIS_DO_FOCO, ORIGENS,
  dataLocal, diasEntre, formatarDiaMes, hojeLocal, rotuloRecipiente, somarDias,
} from "./ocorrencia.js";

export function periodoDoRelatorio(tipo, hoje = hojeLocal(), de = "", ate = "") {
  const diaDaSemana = new Date(`${hoje}T00:00:00Z`).getUTCDay(); // 0 = domingo
  const segunda = somarDias(hoje, -((diaDaSemana + 6) % 7));
  if (tipo === "esta_semana") return { de: segunda, ate: hoje };
  if (tipo === "semana_passada") return { de: somarDias(segunda, -7), ate: somarDias(segunda, -1) };
  if (tipo === "este_mes") return { de: `${hoje.slice(0, 7)}-01`, ate: hoje };
  return de && ate && de <= ate && ate <= hoje ? { de, ate } : null;
}

export const nomeDoArquivo = ({ de, ate }, extensao) => `relatorio-aedes-${de}-a-${ate}.${extensao}`;

// Recebe as linhas do serviço (sem nome, e-mail ou telefone) e devolve o conteúdo do relatório.
export function montarRelatorio({ ocorrencias, visitas, eventos, enderecos, bairros, periodo, bairroId = null }) {
  const noPeriodo = (dia) => dia >= periodo.de && dia <= periodo.ate;
  const lista = ocorrencias.filter((o) => !bairroId || o.neighborhood_id === Number(bairroId));
  const porId = new Map(lista.map((o) => [o.id, o]));
  const nomeDoBairro = new Map(bairros.map((b) => [b.id, b.name]));
  const endereco = (o) => o.place_address ?? enderecos[o.id] ?? "";
  const doReport = (id, tipo) => eventos.filter((e) => e.report_id === id && e.event_type === tipo);
  const diaDoEvento = (id, tipo) => {
    const e = doReport(id, tipo).map((x) => dataLocal(x.created_at)).sort();
    return e.length ? e[e.length - 1] : null;
  };
  const visitasDe = (id) => visitas.filter((v) => v.report_id === id);
  const diaAtendida = (id) => visitasDe(id).find((v) => v.access === "com_acesso")?.visited_on ?? null;

  // Cada ocorrência concluída entra em um só final; arquivada vence atendida (confirmado em 16/11/2026).
  const final = (o) => {
    if (o.publication === "arquivada") return { tipo: "arquivada", dia: dataLocal(o.archived_at) };
    if (diaAtendida(o.id)) return { tipo: "atendida", dia: diaAtendida(o.id) };
    const semAcesso = diaDoEvento(o.id, "encerrada_sem_acesso");
    if (semAcesso) return { tipo: "semAcesso", dia: semAcesso };
    const arquivou = diaDoEvento(o.id, "arquivada");
    return o.stage === "encerrada" && arquivou ? { tipo: "arquivada", dia: arquivou } : null;
  };

  // Dia em que a etapa deixou de ser Recebida/Em análise.
  const diaDaConclusao = (o) => {
    const encerrouAoArquivar = doReport(o.id, "arquivada")
      .filter((e) => !["atendida"].includes(e.old_value?.stage) && e.new_value?.stage === "encerrada")
      .map((e) => dataLocal(e.created_at));
    const dias = [diaAtendida(o.id), diaDoEvento(o.id, "encerrada_sem_acesso"), ...encerrouAoArquivar].filter(Boolean);
    if (dias.length) return dias.sort()[0];
    return o.stage === "encerrada" && o.archived_at ? dataLocal(o.archived_at) : null;
  };

  const entradas = lista.filter((o) => noPeriodo(dataLocal(o.received_at)));
  const feitas = visitas.filter((v) => porId.has(v.report_id) && noPeriodo(v.visited_on));
  const finais = lista.map((o) => ({ o, f: final(o) })).filter(({ f }) => f && noPeriodo(f.dia));
  const comAcesso = feitas.filter((v) => v.access === "com_acesso");

  const pendentes = lista.filter((o) => {
    if (o.origin === "agente" || dataLocal(o.received_at) > periodo.ate) return false;
    const fim = diaDaConclusao(o);
    return !fim || fim > periodo.ate;
  }).map((o) => {
    const analise = diaDoEvento(o.id, "analise_iniciada");
    return {
      protocolo: o.protocol,
      bairro: nomeDoBairro.get(o.neighborhood_id) ?? "",
      etapa: ETAPAS[analise && analise <= periodo.ate ? "em_analise" : "recebida"],
      origem: ORIGENS[o.origin],
      diasAberta: diasEntre(dataLocal(o.received_at), periodo.ate),
      tentativas: visitasDe(o.id).filter((v) => v.access !== "com_acesso" && v.visited_on <= periodo.ate).length,
    };
  }).sort((a, b) => b.diasAberta - a.diasAberta || a.protocolo.localeCompare(b.protocolo));

  const contar = (tipo, filtro = () => true) => finais.filter(({ o, f }) => f.tipo === tipo && filtro(o)).length;
  const recipientes = new Map();
  for (const v of comAcesso) {
    for (const c of v.containers) recipientes.set(rotuloRecipiente(c), (recipientes.get(rotuloRecipiente(c)) ?? 0) + 1);
  }

  const bairrosDoRecorte = bairros.filter((b) => !bairroId || b.id === Number(bairroId));
  const porBairro = bairrosDoRecorte.map((b) => {
    const daqui = (o) => o.neighborhood_id === b.id;
    return {
      bairro: b.name,
      entraram: entradas.filter(daqui).length,
      visitas: feitas.filter((v) => daqui(porId.get(v.report_id))).length,
      atendidas: contar("atendida", daqui),
      encerradas: contar("semAcesso", daqui) + contar("arquivada", daqui),
      pendentes: pendentes.filter((p) => p.bairro === b.name).length,
    };
  });

  return {
    periodo,
    resumo: {
      cidadaos: entradas.filter((o) => o.origin === "cidadao").length,
      agentes: entradas.filter((o) => o.origin === "agente").length,
      visitas: feitas.length,
      atendidas: contar("atendida"),
      encerradasSemAcesso: contar("semAcesso"),
      arquivadas: contar("arquivada"),
      tentativasSemAcesso: feitas.length - comAcesso.length,
      pendentes: pendentes.length,
      comLarvas: comAcesso.filter((v) => v.larvae === "sim").length,
    },
    porBairro,
    recipientes: [...recipientes].map(([nome, n]) => ({ nome, visitas: n }))
      .sort((a, b) => b.visitas - a.visitas || a.nome.localeCompare(b.nome)),
    visitas: [...feitas].sort((a, b) => a.visited_on.localeCompare(b.visited_on)).map((v) => {
      const o = porId.get(v.report_id);
      return {
        data: v.visited_on,
        protocolo: o.protocol,
        bairro: nomeDoBairro.get(o.neighborhood_id) ?? "",
        endereco: endereco(o),
        foco: v.focus_location === "outro" ? v.focus_location_other : LOCAIS_DO_FOCO[v.focus_location] ?? "",
        acesso: ACESSOS[v.access],
        larvas: LARVAS[v.larvae] ?? "",
        recipientes: (v.containers ?? []).map(rotuloRecipiente).join("; "),
        feito: (v.actions ?? []).map((a) => ACOES_NO_LOCAL[a]).join("; "),
        observacoes: v.notes ?? "",
        atendida: v.access === "com_acesso",
        porAgente: o.origin === "agente",
      };
    }),
    pendentes,
  };
}

// O mesmo conteúdo alimenta o PDF e o Word.
export function secoesDoRelatorio(r) {
  const n = r.resumo;
  const soma = (chave) => r.porBairro.reduce((t, b) => t + b[chave], 0);
  const colunas = ["entraram", "visitas", "atendidas", "encerradas", "pendentes"];
  return {
    resumo: [
      { titulo: "Entraram no período", itens: [["De cidadãos", n.cidadaos], ["De agentes", n.agentes], ["Visitas feitas", n.visitas]] },
      { titulo: "Como terminaram", itens: [["Atendidas", n.atendidas], ["Encerradas sem acesso", n.encerradasSemAcesso], ["Arquivadas", n.arquivadas]] },
      { titulo: "Em aberto e achados", itens: [["Tentativas sem acesso", n.tentativasSemAcesso], ["Pendentes", n.pendentes], ["Visitas com larvas", n.comLarvas]] },
    ],
    tabelas: [
      {
        titulo: "Por bairro", pesos: [30, 14, 14, 14, 14, 14], vazio: "Nenhum bairro no recorte.",
        cabecalho: ["Bairro", "Entraram", "Visitas", "Atendidas", "Enc. ou arq.", "Pendentes"],
        linhas: r.porBairro.map((b) => [b.bairro, ...colunas.map((c) => b[c])]),
        total: ["Total", ...colunas.map(soma)],
      },
      {
        titulo: "Visitas do período", pesos: [8, 15, 20, 11, 11, 8, 13, 20], vazio: "Nenhuma visita no período.",
        cabecalho: ["Data", "Protocolo", "Bairro e endereço", "Onde", "Acesso", "Larvas", "Recipientes", "O que foi feito"],
        linhas: r.visitas.map((v) => [
          formatarDiaMes(v.data), v.protocolo, [v.bairro, v.endereco].filter(Boolean).join("\n"), v.foco || "-", v.acesso,
          v.larvas || "-", v.recipientes || "-",
          [v.feito, v.observacoes && `Obs.: ${v.observacoes}`].filter(Boolean).join("\n") || "-",
        ]),
      },
      {
        titulo: "Recipientes com água nas visitas com acesso", pesos: [80, 20], vazio: "Nenhum recipiente registrado.",
        cabecalho: ["Recipiente", "Visitas"], linhas: r.recipientes.map((x) => [x.nome, x.visitas]),
      },
      {
        titulo: "Pendentes no fim do período", pesos: [22, 24, 16, 13, 13, 12], vazio: "Nenhuma pendência.",
        cabecalho: ["Protocolo", "Bairro", "Etapa", "Feita por", "Dias em aberto", "Tentativas"],
        linhas: r.pendentes.map((p) => [p.protocolo, p.bairro, p.etapa, p.origem, p.diasAberta, p.tentativas]),
      },
    ],
  };
}
