document.addEventListener("DOMContentLoaded", () => {
    const botoes = document.querySelectorAll(".menu-botao");

    botoes.forEach((botao) => {
        const menu = document.getElementById(
            botao.getAttribute("aria-controls")
        );

        if (!menu) return;

        const fundo = document.querySelector(".menu-fundo");
        const links = menu.querySelectorAll("a");

        function abrirMenu() {
            menu.classList.add("aberto");
            menu.removeAttribute("inert");
            menu.setAttribute("aria-hidden", "false");

            fundo.hidden = false;
            botao.setAttribute("aria-expanded", "true");
            botao.setAttribute("aria-label", "Fechar menu");

            document.body.classList.add("menu-aberto");

            links[0]?.focus();
        }

        function fecharMenu() {
            menu.classList.remove("aberto");
            menu.setAttribute("inert", "");
            menu.setAttribute("aria-hidden", "true");

            fundo.hidden = true;
            botao.setAttribute("aria-expanded", "false");
            botao.setAttribute("aria-label", "Abrir menu");

            document.body.classList.remove("menu-aberto");

            botao.focus();
        }

        botao.addEventListener("click", () => {
            const aberto =
                botao.getAttribute("aria-expanded") === "true";

            if (aberto) {
                fecharMenu();
            } else {
                abrirMenu();
            }
        });

        fundo.addEventListener("click", fecharMenu);

        links.forEach((link) => {
            link.addEventListener("click", fecharMenu);
        });

        document.addEventListener("keydown", (evento) => {
            if (
                evento.key === "Escape" &&
                botao.getAttribute("aria-expanded") === "true"
            ) {
                fecharMenu();
            }
        });
    });
});
// Comportamentos: Entrada do jogo. Desenvolver na etapa JavaScript.
