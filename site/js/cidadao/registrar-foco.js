// ==========================================
// AEDES DATA LAB - REGISTRAR FOCO
// ==========================================

const form = document.getElementById("denunciaForm");

const steps = document.querySelectorAll(
    "#denunciaForm > .step"
);

const progressSteps = document.querySelectorAll(
    ".progress .step"
);

const successMessage = document.getElementById("successMessage");

const errorMessage = document.getElementById("errorMessage");

let currentStep = 0;
let emailConfirmed = false;


// ==========================================
// MOSTRAR ETAPAS
// ==========================================

function showStep(index) {

    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
    });

    progressSteps.forEach((step, i) => {
        step.classList.toggle("active", i <= index);
    });

    successMessage.hidden = true;
    errorMessage.hidden = true;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// VALIDAR CAMPOS
// ==========================================

function validateSection(section) {

    const fields = section.querySelectorAll(
        "input:not([type='checkbox']):not([type='file']), select, textarea"
    );

    for (const field of fields) {

        if (!field.checkValidity()) {

            field.reportValidity();
            field.focus();

            return false;
        }
    }

    return true;
}


function validateCurrentStep() {

    return validateSection(steps[currentStep]);
}


// ==========================================
// AVANÇAR E VOLTAR
// ==========================================

function nextStep() {

    if (!validateCurrentStep()) return;

    if (currentStep < 2) {

        showStep(currentStep + 1);

    } else if (currentStep === 2 && emailConfirmed) {

        showStep(3);
        updateReview();

    }
}


function previousStep() {

    if (currentStep > 0) {

        showStep(currentStep - 1);

    }
}


// ==========================================
// PASSO 3 - DADOS PESSOAIS
// ==========================================

function goToEmailVerification() {

    const dados = document.getElementById("dadosPessoais");

    if (!validateSection(dados)) return;

    const email = document.getElementById("email").value;

    document.getElementById("emailExibido").textContent = email;

    document.getElementById("dadosPessoais").hidden = true;

    document.getElementById("confirmacaoEmail").hidden = false;

    document.getElementById("codigoEmail").value = "";

    document.getElementById("mensagemCodigo").textContent = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function backToPersonalData() {

    document.getElementById("confirmacaoEmail").hidden = true;

    document.getElementById("dadosPessoais").hidden = false;

}


// ==========================================
// CONFIRMAÇÃO DO E-MAIL
// ==========================================

// CÓDIGO DEMONSTRATIVO PARA TESTES.
// Não utilizar esta lógica em produção.

const codigoDemonstracao = "123456";


function confirmEmailCode() {

    const codigo = document.getElementById("codigoEmail").value;

    const mensagem = document.getElementById("mensagemCodigo");

    if (!/^\d{6}$/.test(codigo)) {

        mensagem.textContent = "Digite um código de seis dígitos.";

        return;
    }

    if (codigo !== codigoDemonstracao) {

        mensagem.textContent = "Código incorreto. Tente novamente.";

        return;
    }

    emailConfirmed = true;

    mensagem.textContent = "E-mail confirmado com sucesso!";

    setTimeout(() => {

        showStep(3);

        updateReview();

    }, 700);

}


function resendCode() {

    alert(
        "Esta é uma demonstração. O envio real do código depende da integração com um serviço de e-mail."
    );

}


// ==========================================
// PASSO 4 - RESUMO DAS INFORMAÇÕES
// ==========================================

function updateReview() {

    const review = document.getElementById("reviewContent");

    review.innerHTML = "";

    function addSection(title) {

        const heading = document.createElement("h3");

        heading.textContent = title;

        review.appendChild(heading);
    }


    function addItem(label, value) {

        const paragraph = document.createElement("p");

        const strong = document.createElement("strong");

        strong.textContent = label + ": ";

        const span = document.createElement("span");

        span.textContent = value || "Não informado";

        paragraph.appendChild(strong);

        paragraph.appendChild(span);

        review.appendChild(paragraph);
    }


    function getValue(section, selector) {

        const field = section.querySelector(selector);

        return field ? field.value : "";
    }


    // LOCALIZAÇÃO

    const step1 = document.getElementById("step1");

    addSection("Localização do foco");

    const selects1 = step1.querySelectorAll("select");

    const inputs1 = step1.querySelectorAll("input[type='text'], input[type='number']");

    addItem("Bairro ou comunidade", selects1[0]?.selectedOptions[0]?.text);

    addItem("Rua ou logradouro", inputs1[0]?.value);

    const semNumero = step1.querySelector(
        ".number-field input[type='checkbox']"
    );

    addItem(
        "Número do imóvel",
        semNumero?.checked ? "Sem número" : inputs1[1]?.value
    );

    addItem("Ponto de referência", inputs1[2]?.value);

    addItem("Onde está o foco", selects1[1]?.selectedOptions[0]?.text);

    // Centro inicial: Itambé - PE
const map = L.map('map').setView([-7.414, -35.104], 14);

// Carregar mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Localização do usuário
map.locate({
    setView: true,
    maxZoom: 16
});

// Criar pin
map.on('locationfound', function(e) {
    L.marker(e.latlng)
        .addTo(map)
        .bindPopup('Você está aqui!')
        .openPopup();
});

// Erro de localização
map.on('locationerror', function() {
    console.log('Não foi possível acessar sua localização.');
});
    addItem(
        "Localização no mapa",
        "Consulte a marcação realizada no mapa."
    );


    // IDENTIFICAÇÃO DO FOCO

    const step2 = document.getElementById("step2");

    addSection("Identificação do foco");

    const selects2 = step2.querySelectorAll("select");

    addItem("Tipo de ocorrência", selects2[0]?.selectedOptions[0]?.text);

    addItem("Tempo da ocorrência", selects2[1]?.selectedOptions[0]?.text);

    addItem("Água acumulada", selects2[2]?.selectedOptions[0]?.text);

    const recipientes = [
        ...step2.querySelectorAll(
            'input[name="recipiente"]:checked'
        )
    ].map(input => input.value);

    addItem(
        "Recipientes ou estruturas",
        recipientes.length ? recipientes.join(", ") : "Não informado"
    );

    addItem("Presença de larvas ou pupas", selects2[3]?.selectedOptions[0]?.text);

    const fotos = step2.querySelector('input[type="file"]');

    addItem(
        "Fotografias",
        fotos?.files.length
            ? [...fotos.files].map(file => file.name).join(", ")
            : "Nenhuma fotografia anexada"
    );

    const observacoes = step2.querySelector("textarea");

    addItem("Observações adicionais", observacoes?.value);


    // DADOS PESSOAIS

    addSection("Dados de identificação");

    addItem(
        "Nome completo",
        document.getElementById("nomeCompleto").value
    );

    addItem(
        "CPF",
        document.getElementById("cpf").value
    );

    addItem(
        "E-mail",
        document.getElementById("email").value
    );

    addItem(
        "Telefone",
        document.getElementById("telefone").value
    );

    addItem(
        "Confirmação do e-mail",
        emailConfirmed ? "Confirmado" : "Não confirmado"
    );

}


// ==========================================
// FINALIZAR DENÚNCIA
// ==========================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    if (currentStep !== 3) return;

    if (!validateCurrentStep()) return;

    if (!emailConfirmed) {

        alert("Confirme seu e-mail antes de enviar a denúncia.");

        return;
    }

    updateReview();

    const confirmacao = document.getElementById(
        "confirmarInformacoes"
    );

    if (!confirmacao.checked) {

        confirmacao.reportValidity();

        return;
    }

    generateProtocol();

    form.hidden = true;

    successMessage.hidden = false;

    errorMessage.hidden = true;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ==========================================
// GERAR PROTOCOLO
// ==========================================

function generateProtocol() {

    const year = new Date().getFullYear();

    const randomNumber = Math.floor(
        100000 + Math.random() * 900000
    );

    const protocol = `ADL-${year}-${randomNumber}`;

    document.getElementById("protocolNumber").textContent = protocol;

    document.getElementById("status").textContent = "Status: Em análise";

}


// ==========================================
// CANCELAR
// ==========================================

function cancelForm() {

    const confirmation = confirm(
        "Tem certeza de que deseja cancelar a denúncia?"
    );

    if (confirmation) {

        form.reset();

        emailConfirmed = false;

        document.getElementById("dadosPessoais").hidden = false;

        document.getElementById("confirmacaoEmail").hidden = true;

        showStep(0);

    }

}


// ==========================================
// TELA DE ERRO
// ==========================================

function retrySubmission() {

    errorMessage.hidden = true;

    form.hidden = false;

    showStep(3);

}


// ==========================================
// NAVEGAÇÃO
// ==========================================

function viewIncidentOnMap() {

    window.location.href = "mapa.html";

}


function goToHome() {

    window.location.href = "../inicio.html";

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


// FUNÇÕES ACESSÍVEIS PELO HTML

window.nextStep = nextStep;
window.previousStep = previousStep;
window.showStep = showStep;
window.cancelForm = cancelForm;
window.retrySubmission = retrySubmission;
window.viewIncidentOnMap = viewIncidentOnMap;
window.goToHome = goToHome;
window.goToEmailVerification = goToEmailVerification;
window.backToPersonalData = backToPersonalData;
window.confirmEmailCode = confirmEmailCode;
window.resendCode = resendCode;