// Gera o PDF e o Word no próprio aparelho (ADR-012). As bibliotecas só carregam quando o agente pede o arquivo.
import { el } from "./comum/ui.js";
import { secoesDoRelatorio } from "../dominio/relatorio.js";

const BIBLIOTECAS = {
  pdf: [
    ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"],
    ["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
      "sha384-fCAW/rDWORTbQXSiB7mOg0QtQ5c+r0f544y6XoKjuVva0nMBlCpNUjiFeG5iMdS3"],
  ],
  docx: [
    ["https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js",
      "sha384-4xaIisuLEy2lo2HkB2C4rEf7v8jbTb2kuogX6TkuEt9feTWKBSFSOzsqNNbV+sKh"],
  ],
};
const VERDE = [47, 79, 58];
const AVISO_DE_PRIVACIDADE = "Aedes Data Lab · sem nome, e-mail ou telefone de moradores";
const carregadas = new Map();

function carregar(src, integridade) {
  if (!carregadas.has(src)) {
    carregadas.set(src, new Promise((ok, falha) => {
      const s = el("script", { src, integrity: integridade, crossorigin: "anonymous" });
      s.addEventListener("load", ok);
      s.addEventListener("error", () => { carregadas.delete(src); s.remove(); falha(new Error("biblioteca indisponível")); });
      document.head.append(s);
    }));
  }
  return carregadas.get(src);
}

// Em ordem: o AutoTable precisa do jsPDF já carregado.
async function carregarBibliotecas(tipo) {
  for (const [src, integridade] of BIBLIOTECAS[tipo]) await carregar(src, integridade);
}

const cabecalhoEmTexto = (meta) => [
  `Período: ${meta.periodo}`, `Bairro: ${meta.bairro}`, `Agente: ${meta.agente}`, `Gerado em ${meta.geradoEm}`,
];

// A fonte padrão do PDF não tem aspas curvas nem travessão.
const paraPdf = (v) => String(v).replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");

async function logo() {
  try {
    const blob = await (await fetch("/assets/imagens/logo-aedes-datalab.jpeg")).blob();
    return await new Promise((ok) => { const l = new FileReader(); l.onload = () => ok(l.result); l.readAsDataURL(blob); });
  } catch {
    return null; // sem a logo o relatório continua válido
  }
}

export async function gerarPdf(relatorio, meta) {
  await carregarBibliotecas("pdf");
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 12;
  const util = largura - margem * 2;
  const conteudo = secoesDoRelatorio(relatorio);
  const escrever = (texto, x, y, { tamanho = 9, negrito = false, cor = [42, 46, 50], alinhar = "left" } = {}) => {
    doc.setFont("helvetica", negrito ? "bold" : "normal").setFontSize(tamanho).setTextColor(...cor);
    doc.text(paraPdf(texto), x, y, { align: alinhar });
  };

  const imagem = await logo();
  if (imagem) doc.addImage(imagem, "JPEG", margem, 10, 12, 12);
  const inicio = imagem ? margem + 15 : margem;
  escrever("Aedes Data Lab · Itambé-PE", inicio, 15, { tamanho: 13, negrito: true, cor: VERDE });
  escrever("Relatório de ocorrências e visitas", inicio, 20, { cor: [95, 107, 98] });
  cabecalhoEmTexto(meta).forEach((t, i) => escrever(t, largura - margem, 12 + i * 4, { tamanho: 8, alinhar: "right" }));
  doc.setDrawColor(217, 203, 176).line(margem, 28, largura - margem, 28);

  escrever("RESUMO", margem, 35, { negrito: true, cor: VERDE });
  const caixa = (util - 6) / 3;
  conteudo.resumo.forEach((grupo, i) => {
    const x = margem + i * (caixa + 3);
    doc.roundedRect(x, 38, caixa, 27, 1.5, 1.5);
    escrever(grupo.titulo, x + 3, 44, { negrito: true });
    grupo.itens.forEach(([rotulo, valor], j) => {
      escrever(rotulo, x + 3, 50 + j * 5, { tamanho: 8 });
      escrever(valor, x + caixa - 3, 50 + j * 5, { tamanho: 9, negrito: true, alinhar: "right" });
    });
  });

  let y = 73;
  for (const tabela of conteudo.tabelas) {
    if (y > altura - 40) { doc.addPage(); y = 18; }
    escrever(tabela.titulo.toUpperCase(), margem, y, { negrito: true, cor: VERDE });
    const total = tabela.pesos.reduce((a, b) => a + b, 0);
    doc.autoTable({
      startY: y + 2,
      margin: { left: margem, right: margem, bottom: 18 },
      head: [tabela.cabecalho],
      body: tabela.linhas.length
        ? tabela.linhas.map((l) => l.map(paraPdf))
        : [[{ content: tabela.vazio, colSpan: tabela.cabecalho.length }]],
      foot: tabela.total && tabela.linhas.length ? [tabela.total.map(String)] : undefined,
      showFoot: "lastPage",
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 1.3, lineColor: [232, 223, 203], textColor: [42, 46, 50], overflow: "linebreak" },
      headStyles: { fillColor: [234, 227, 210], textColor: [32, 53, 43] },
      footStyles: { fillColor: [234, 227, 210], textColor: [32, 53, 43] },
      columnStyles: Object.fromEntries(tabela.pesos.map((p, i) => [i, { cellWidth: (util * p) / total }])),
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (y > altura - 45) { doc.addPage(); y = 18; }
  escrever("ASSINATURAS", margem, y, { negrito: true, cor: VERDE });
  const linha = (util - 12) / 2;
  [`Agente de endemias · ${meta.agente}`, "Supervisor"].forEach((texto, i) => {
    const x = margem + i * (linha + 12);
    doc.setDrawColor(95, 107, 98).line(x, y + 18, x + linha, y + 18);
    escrever(texto, x, y + 23, { tamanho: 8 });
  });

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    escrever(AVISO_DE_PRIVACIDADE, margem, altura - 8, { tamanho: 7, cor: [95, 107, 98] });
    escrever(`Página ${p} de ${paginas}`, largura - margem, altura - 8, { tamanho: 7, cor: [95, 107, 98], alinhar: "right" });
  }
  return doc.output("blob");
}

export async function gerarWord(relatorio, meta) {
  await carregarBibliotecas("docx");
  const {
    AlignmentType, Document, Footer, Packer, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
  } = window.docx;
  const LARGURA = 10466; // A4 com margens de 1,27 cm, em vigésimos de ponto
  const conteudo = secoesDoRelatorio(relatorio);
  const texto = (t, { negrito = false, tamanho = 18, cor = "2A2E32" } = {}) =>
    new TextRun({ text: String(t), bold: negrito, size: tamanho, color: cor, font: "Calibri" });
  const paragrafo = (t, estilo, opcoes = {}) => new Paragraph({ children: [texto(t, estilo)], ...opcoes });
  const titulo = (t) => paragrafo(t.toUpperCase(), { negrito: true, tamanho: 20, cor: "2F4F3A" }, { spacing: { before: 240, after: 100 } });

  // Cada quebra de linha do conteúdo vira um parágrafo dentro da célula.
  const celula = (valor, largura, { negrito = false, fundo, colunas } = {}) => new TableCell({
    width: { size: largura, type: WidthType.DXA },
    columnSpan: colunas,
    shading: fundo && { fill: fundo },
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    children: String(valor).split("\n").map((l) => paragrafo(l, { negrito, tamanho: 15 })),
  });

  const tabela = ({ cabecalho, linhas, pesos, total, vazio }) => {
    const soma = pesos.reduce((a, b) => a + b, 0);
    const larguras = pesos.map((p) => Math.floor((LARGURA * p) / soma));
    const linha = (valores, opcoes, extra = {}) =>
      new TableRow({ ...extra, children: valores.map((v, i) => celula(v, larguras[i], opcoes)) });
    return new Table({
      columnWidths: larguras,
      width: { size: LARGURA, type: WidthType.DXA },
      rows: [
        linha(cabecalho, { negrito: true, fundo: "EAE3D2" }, { tableHeader: true }),
        ...(linhas.length ? linhas.map((l) => linha(l))
          : [new TableRow({ children: [celula(vazio, LARGURA, { colunas: cabecalho.length })] })]),
        ...(total && linhas.length ? [linha(total, { negrito: true, fundo: "EAE3D2" })] : []),
      ],
    });
  };

  const assinatura = (t) => [paragrafo("_______________________________________", {}, { spacing: { before: 600 } }), paragrafo(t, { tamanho: 16 })];

  const documento = new Document({
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [texto(`${AVISO_DE_PRIVACIDADE}   ·   Página `, { tamanho: 14, cor: "5F6B62" }),
            new TextRun({ children: [PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: 14, color: "5F6B62" })],
        })] }),
      },
      children: [
        paragrafo("Aedes Data Lab · Itambé-PE", { negrito: true, tamanho: 28, cor: "2F4F3A" }),
        paragrafo("Relatório de ocorrências e visitas", { cor: "5F6B62" }),
        ...cabecalhoEmTexto(meta).map((t) => paragrafo(t, { tamanho: 16 })),
        titulo("Resumo"),
        tabela({
          pesos: [34, 33, 33], vazio: "",
          cabecalho: conteudo.resumo.map((g) => g.titulo),
          linhas: [0, 1, 2].map((i) => conteudo.resumo.map((g) => `${g.itens[i][0]}: ${g.itens[i][1]}`)),
        }),
        ...conteudo.tabelas.flatMap((t) => [titulo(t.titulo), tabela(t)]),
        titulo("Assinaturas"),
        ...assinatura(`Agente de endemias · ${meta.agente}`),
        ...assinatura("Supervisor"),
      ],
    }],
  });
  return Packer.toBlob(documento);
}
