
document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTOS PRINCIPAIS

    const showOccurrences = document.getElementById("showOccurrences");
    const occurrencesSection = document.getElementById("occurrencesSection");

    // INICIALIZAÇÃO DO MAPA

    const mapa = L.map("mapa").setView([-7.414, -35.104], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(mapa);

    // OCORRÊNCIAS DE EXEMPLO

    const ocorrencias = [
        {
            nome: "Relato 1",
            latitude: -7.414,
            longitude: -35.104,
            status: "Em análise"
        },
        {
            nome: "Relato 2",
            latitude: -7.416,
            longitude: -35.108,
            status: "Finalizada"
        },
        {
            nome: "Relato 3",
            latitude: -7.410,
            longitude: -35.100,
            status: "Em processamento"
        },
        {
            nome: "Relato 4",
            latitude: -7.418,
            longitude: -35.102,
            status: "Não visualizada"
        }
    ];

    // ADICIONAR MARCADORES

    ocorrencias.forEach(ocorrencia => {
        L.marker([ocorrencia.latitude, ocorrencia.longitude])
            .addTo(mapa)
            .bindPopup(`
                <strong>${ocorrencia.nome}</strong><br>
                Status: ${ocorrencia.status}
            `);
    });

    // CENTRALIZAR MAPA

    const centerButton = document.getElementById("centerMap");

    centerButton.addEventListener("click", () => {

        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                mapa.setView([latitude, longitude], 17);

                L.marker([latitude, longitude])
                    .addTo(mapa)
                    .bindPopup("Você está aqui!")
                    .openPopup();
            },
            () => {
                alert("Não foi possível obter sua localização.");
            }
        );
    });

    // FILTROS

    const filtros = document.getElementById("filtros");
    const formFiltros = filtros.querySelector("form");
    const filterCount = document.getElementById("filterCount");

    // ABRIR FILTROS

    document.getElementById("openFilters").addEventListener("click", () => {
        filtros.showModal();
    });

    // FECHAR AO CLICAR FORA

    filtros.addEventListener("click", event => {
        if (event.target === filtros) {
            filtros.close();
        }
    });

    // FILTRAR OCORRÊNCIAS

    function filtrar() {

        const dados = new FormData(formFiltros);
        const status = dados.getAll("status");

        document.querySelectorAll(".occurrence-card").forEach(card => {

            card.hidden =
                status.length > 0 &&
                !status.includes(card.dataset.status);

        });

        // CONTADOR DE FILTROS ATIVOS

        const total = [
            dados.get("period"),
            dados.get("locality"),
            status.length > 0 ? status.length : null
        ].filter(Boolean).length;

        filterCount.textContent = total;
        filterCount.hidden = total === 0;
    }

    // ATUALIZAR AO ALTERAR FILTROS

    formFiltros.addEventListener("change", filtrar);

    // ATUALIZAR AO LIMPAR

    formFiltros.addEventListener("reset", () => {
        setTimeout(filtrar, 0);
    });

    filtrar();

    // CONCLUIR FILTROS

    document.getElementById("applyFilters").addEventListener("click", () => {

        filtrar();

        occurrencesSection.classList.add("visible");

        filtros.close();

        setTimeout(() => {
            occurrencesSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 200);

    });

    // MOSTRAR OCORRÊNCIAS

    showOccurrences.addEventListener("click", () => {

        occurrencesSection.classList.add("visible");

        occurrencesSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });

    // BOTÕES DE RESUMO

    document.querySelectorAll(".summary-button").forEach(button => {

        button.addEventListener("click", () => {
            console.log("Resumo selecionado:", button.innerText);
        });

    });

});

// SHOW OCCURRENCES BUTTON

showOccurrences.addEventListener("click", () => {

    occurrencesSection.classList.add("visible");

    occurrencesSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


// CENTRALIZE MAP BUTTON

document.getElementById("centerMap").addEventListener("click", () => {

    if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            alert("Sua localização foi identificada!");

        },

        () => {
            alert("Não foi possível acessar sua localização.");
        }

    );

});


// SUMMARY BUTTONS

document.querySelectorAll(".summary-button").forEach(button => {

    button.addEventListener("click", () => {

        // The summary page will be implemented later.

        console.log("Resumo selecionado:", button.innerText);

    });

});
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
