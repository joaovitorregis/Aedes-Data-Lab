// Quando um envio falha: dá para tentar de novo sozinho, ou o servidor recusou?
export function vaiTentarDeNovo(erro) {
  const status = erro?.status ?? 0;
  return status === 0 || status === 401 || status === 429 || status >= 500;
}
