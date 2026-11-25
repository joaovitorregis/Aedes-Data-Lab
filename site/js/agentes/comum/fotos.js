// Fotos do registro em local sem denúncia: viram JPEG menores no próprio aparelho
// (o servidor aceita JPEG e PNG, e a foto de celular costuma passar do necessário).
const LADO_MAXIMO = 2048;

export async function prepararFoto(arquivo) {
  const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(imagem.width * escala);
  tela.height = Math.round(imagem.height * escala);
  tela.getContext("2d").drawImage(imagem, 0, 0, tela.width, tela.height);
  imagem.close();
  return new Promise((ok, falha) => {
    tela.toBlob((blob) => (blob ? ok(blob) : falha(new Error("foto ilegível"))), "image/jpeg", 0.85);
  });
}
