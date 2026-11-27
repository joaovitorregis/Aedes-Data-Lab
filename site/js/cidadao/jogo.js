// Sem internet o jogo não abre: avisa em vez de levar a uma página de erro.
const aviso = document.getElementById("avisoJogo");

document.querySelector(".botao-jogar").addEventListener("click", (evento) => {
  aviso.textContent = "";
  if (navigator.onLine) return;
  evento.preventDefault();
  aviso.textContent = "Você está sem internet. Conecte-se para abrir o jogo.";
});

window.addEventListener("online", () => { aviso.textContent = ""; });
