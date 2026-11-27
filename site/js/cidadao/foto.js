// Prepara a foto no aparelho: reduz o tamanho e grava em JPEG, que o servidor aceita.
import { tamanhoDaFoto } from "../dominio/denuncia.js";

export async function prepararFoto(arquivo) {
  const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const { largura, altura } = tamanhoDaFoto(imagem.width, imagem.height);
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  tela.getContext("2d").drawImage(imagem, 0, 0, largura, altura);
  imagem.close();
  const dados = await new Promise((pronto) => tela.toBlob(pronto, "image/jpeg", 0.85));
  if (!dados) throw new Error("não foi possível converter a foto");
  const nome = `${arquivo.name.replace(/\.\w+$/, "") || "foto"}.jpg`;
  return new File([dados], nome, { type: "image/jpeg" });
}
