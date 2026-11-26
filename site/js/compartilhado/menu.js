const urlScript = document.currentScript?.src;

document.addEventListener("DOMContentLoaded", () => {
    const botao = document.querySelector(".menu-botao");

    if (!botao) {
        return;
    }

    if (!urlScript) {
        throw new Error("Não foi possível localizar o arquivo compartilhado do menu.");
    }

    const raiz = new URL("../../", urlScript);
    const itens = [
        { href: "inicio.html", icone: "⌂", texto: "Início" },
        { href: "paginas/registrar-foco.html", icone: "⚑", texto: "Registrar foco" },
        { href: "paginas/mapa.html", icone: "♧", texto: "Mapa" },
        { href: "paginas/guia-aedes.html", icone: "▤", texto: "Guia Aedes" },
        { href: "paginas/questionario.html", icone: "☷", texto: "Questionário" },
        { href: "paginas/quem-somos.html", icone: "▣", texto: "Quem somos" }
    ];

    const fundo = document.createElement("div");
    fundo.className = "menu-fundo";
    fundo.hidden = true;

    const menu = document.createElement("aside");
    menu.className = "menu-lateral";
    menu.id = "menu-lateral";
    menu.setAttribute("aria-label", "Menu de navegação");
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("inert", "");

    const topo = document.createElement("div");
    topo.className = "menu-topo";

    const titulo = document.createElement("h1");
    titulo.textContent = "Menu";
    topo.append(titulo);

    const navegacao = document.createElement("nav");

    itens.forEach((item) => {
        const url = new URL(item.href, raiz);
        const link = document.createElement("a");
        const icone = document.createElement("span");

        link.className = "menu-link";
        link.href = url.href;
        link.append(icone, document.createTextNode(` ${item.texto}`));

        icone.textContent = item.icone;

        if (url.pathname === window.location.pathname) {
            link.setAttribute("aria-current", "page");
        }

        navegacao.append(link);
    });

    menu.append(topo, navegacao);

    const cabecalho = botao.closest("header");

    if (!cabecalho) {
        throw new Error("O botão do menu precisa estar dentro do cabeçalho.");
    }

    cabecalho.insertAdjacentElement("afterend", fundo);
    fundo.insertAdjacentElement("afterend", menu);

    botao.setAttribute("aria-controls", menu.id);
    botao.setAttribute("aria-expanded", "false");

    const links = menu.querySelectorAll("a");

    function abrirMenu() {
        menu.classList.add("aberto");
        menu.removeAttribute("inert");
        menu.setAttribute("aria-hidden", "false");

        fundo.hidden = false;
        botao.setAttribute("aria-expanded", "true");
        botao.setAttribute("aria-label", "Fechar menu");
        document.body.classList.add("menu-aberto");

        links[0].focus();
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
        if (botao.getAttribute("aria-expanded") === "true") {
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
