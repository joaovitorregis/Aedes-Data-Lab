// ==========================================
// AEDES DATA LAB - TELA REGISTRAR FOCO
// ==========================================

const form = document.getElementById("denunciaForm");
const steps = document.querySelectorAll("#denunciaForm > .step");
const progressSteps = document.querySelectorAll(".progress .step");

const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");

let currentStep = 0;


// ==========================================
// MOSTRAR ETAPA
// ==========================================

function showStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    // Exibe somente a etapa atual
    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
    });

    // Atualiza a barra de progresso
    progressSteps.forEach((step, i) => {
        step.classList.toggle("active", i <= index);
    });

    // Esconde mensagens de resultado
    successMessage.hidden = true;
    errorMessage.hidden = true;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// VALIDAR ETAPA ATUAL
// ==========================================

function validateCurrentStep() {
    const currentSection = steps[currentStep];

    const fields = currentSection.querySelectorAll(
        "input:not([type='radio']):not([type='checkbox']), select, textarea"
    );

    for (const field of fields) {
        if (!field.checkValidity()) {
            field.reportValidity();
            field.focus();
            return false;
        }
    }

    // Verifica grupos de radio obrigatórios
    const radioGroups = [...currentSection.querySelectorAll(
        'input[type="radio"][required]'
    )];

    const groupNames = [...new Set(
        radioGroups.map(radio => radio.name)
    )];

    for (const name of groupNames) {
        const selected = currentSection.querySelector(
            `input[name="${name}"]:checked`
        );

        if (!selected) {
            radioGroups.find(radio => radio.name === name).focus();
            alert("Selecione uma opção antes de continuar.");
            return false;
        }
    }

    return true;
}

// ==========================================
// AVANÇAR ETAPA
// ==========================================

function nextStep() {
    if (!validateCurrentStep()) return;

    if (currentStep < steps.length - 1) {
        showStep(currentStep + 1);
    }
}


// ==========================================
// VOLTAR ETAPA
// ==========================================

function previousStep() {
    if (currentStep > 0) {
        showStep(currentStep - 1);
    }
}


// ==========================================
// CANCELAR DENÚNCIA
// ==========================================

function cancelForm() {
    const confirmCancel = confirm(
        "Tem certeza de que deseja cancelar o preenchimento da denúncia?"
    );

    if (confirmCancel) {
        form.reset();
        showStep(0);
    }
}


// ==========================================
// PREENCHER RESUMO DA DENÚNCIA
// ==========================================

function updateReview() {
    const fields = form.querySelectorAll("input, select, textarea");

    fields.forEach(field => {
        if (!field.id) return;

        const reviewField = document.getElementById(
            "review" + field.id.charAt(0).toUpperCase() + field.id.slice(1)
        );

        if (!reviewField) return;

        let value = "";

        if (field.type === "checkbox") {
            value = field.checked ? "Sim" : "Não";
        } else if (field.type === "radio") {
            if (!field.checked) return;
            value = field.value;
        } else if (field.type === "file") {
            value = field.files.length
                ? field.files[0].name
                : "Nenhum arquivo selecionado";
        } else {
            value = field.value || "Não informado";
        }

        reviewField.textContent = value;
    });

    // Atualiza a informação de privacidade, se existir
    const privacidade = document.getElementById("reviewPrivacidade");

    if (privacidade) {
        const selectedPrivacy = form.querySelector(
            'input[name="privacidade"]:checked'
        );

        privacidade.textContent = selectedPrivacy
            ? selectedPrivacy.value
            : "Não informado";
    }
}


// ==========================================
// FINALIZAR DENÚNCIA
// ==========================================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    updateReview();

    form.hidden = true;
    successMessage.hidden = false;
    errorMessage.hidden = true;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// ==========================================
// TENTAR NOVAMENTE
// ==========================================

function retrySubmission() {
    errorMessage.hidden = true;
    form.hidden = false;
    showStep(0);
}


// ==========================================
// VISUALIZAR DENÚNCIA NO MAPA
// ==========================================

function viewIncidentOnMap() {
    window.location.href = "mapa.html";
}


// ==========================================
// MENU RETRÁTIL
// ==========================================

const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const sidebar = document.getElementById("sidebar");
const menuOverlay = document.getElementById("menuOverlay");

function openMenu() {
    sidebar.classList.add("open");
    menuOverlay.classList.add("active");

    menuToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    menuOverlay.classList.remove("active");

    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", openMenu);
closeMenu?.addEventListener("click", closeSidebar);
menuOverlay?.addEventListener("click", closeSidebar);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

showStep(0);


// ==========================================
// DISPONIBILIZAR FUNÇÕES PARA O HTML
// ==========================================

window.nextStep = nextStep;
window.previousStep = previousStep;
window.showStep = showStep;
window.cancelForm = cancelForm;
window.retrySubmission = retrySubmission;
window.viewIncidentOnMap = viewIncidentOnMap;
