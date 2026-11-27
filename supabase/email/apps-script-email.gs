const SEGREDO = PropertiesService.getScriptProperties().getProperty("APPS_SCRIPT_SECRET");

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    if (!SEGREDO || dados.segredo !== SEGREDO) return resposta({ ok: false, erro: "nao_autorizado" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.para || "")) return resposta({ ok: false, erro: "email_invalido" });
    if (!dados.assunto || !dados.texto) return resposta({ ok: false, erro: "dados_incompletos" });
    if (MailApp.getRemainingDailyQuota() < 1) return resposta({ ok: false, erro: "cota_diaria_esgotada" });
    MailApp.sendEmail({
      to: dados.para,
      subject: String(dados.assunto).slice(0, 200),
      body: String(dados.texto).slice(0, 2000),
      htmlBody: dados.html ? String(dados.html).slice(0, 5000) : undefined,
      name: "Aedes Data Lab",
    });
    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: "falha_interna" });
  }
}

function resposta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
