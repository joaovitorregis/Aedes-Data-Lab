

const openFilters = document.getElementById("openFilters");
const closeFilters = document.getElementById("closeFilters");
const filterOverlay = document.getElementById("filterOverlay");
const applyFilters = document.getElementById("applyFilters");

const showOccurrences = document.getElementById("showOccurrences");
const occurrencesSection = document.getElementById("occurrencesSection");
const occurrencesList = document.getElementById("occurrencesList");


// OPEN FILTERS

openFilters.addEventListener("click", () => {
    filterOverlay.classList.add("active");
});


// CLOSE FILTERS

closeFilters.addEventListener("click", () => {
    filterOverlay.classList.remove("active");
});


// CLOSE WHEN CLICKING OUTSIDE THE MODAL

filterOverlay.addEventListener("click", (event) => {
    if (event.target === filterOverlay) {
        filterOverlay.classList.remove("active");
    }
});


// EXPAND FILTER CATEGORIES

const categoryButtons = document.querySelectorAll(".category-button");

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        const category = button.parentElement;

        category.classList.toggle("expanded");

    });

});


// APPLY FILTERS

applyFilters.addEventListener("click", () => {

    const selectedPeriods = getSelected("period");
    const selectedLocalities = getSelected("locality");
    const selectedStatuses = getSelected("status");

    console.log("Períodos:", selectedPeriods);
    console.log("Localidades:", selectedLocalities);
    console.log("Status:", selectedStatuses);

    // Show occurrences section
    occurrencesSection.classList.add("visible");

    // Apply status filtering
    filterOccurrences(selectedStatuses);

    // Close popup
    filterOverlay.classList.remove("active");

    // Scroll to occurrences
    setTimeout(() => {
        occurrencesSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 200);

});


// GET SELECTED CHECKBOXES

function getSelected(name) {

    return Array.from(
        document.querySelectorAll(`input[name="${name}"]:checked`)
    ).map(input => input.value);

}


// FILTER OCCURRENCES

function filterOccurrences(selectedStatuses) {

    const cards = document.querySelectorAll(".occurrence-card");

    cards.forEach(card => {

        const status = card.dataset.status;

        if (
            selectedStatuses.length === 0 ||
            selectedStatuses.includes(status)
        ) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }

    });

}


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
