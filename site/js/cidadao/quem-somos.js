// Comportamentos: Quem somos. Desenvolver na etapa JavaScript.
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const closeMenu = document.getElementById("closeMenu");
const overlay = document.getElementById("menuOverlay");

function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("active");

    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");

    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
}

menuToggle.addEventListener("click", openMenu);

closeMenu.addEventListener("click", closeSidebar);

overlay.addEventListener("click", closeSidebar);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});
