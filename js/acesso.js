(function () {
    "use strict";

    const CHAVE = "sefaz-acesso";
    const pagina = location.pathname.split("/").pop() || "index.html";
    const ehLanding = pagina === "" || pagina === "index.html";

    function liberado() {
        return sessionStorage.getItem(CHAVE) === "1";
    }

    if (!ehLanding && !liberado()) {
        location.replace("./index.html?next=" + encodeURIComponent(pagina));
        return;
    }

    function destinoSeguro(valor) {
        return /^[a-z0-9.-]+\.html$/i.test(valor || "") ? valor : "";
    }

    function mostrarEntrada() {
        const form = document.getElementById("formAcesso");
        const atalhos = document.getElementById("atalhos");
        if (!form || !atalhos) return;
        form.classList.add("d-none");
        atalhos.classList.remove("d-none");
    }

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("formAcesso");
        if (!form) return;
        if (liberado()) mostrarEntrada();

        form.addEventListener("submit", (evento) => {
            evento.preventDefault();
            const senha = document.getElementById("senha").value;
            const erro = document.getElementById("erroSenha");
            if (senha !== (window.SITE_CONFIG && window.SITE_CONFIG.senha)) {
                erro.classList.remove("d-none");
                document.getElementById("senha").focus();
                return;
            }
            sessionStorage.setItem(CHAVE, "1");
            erro.classList.add("d-none");
            const next = destinoSeguro(new URLSearchParams(location.search).get("next"));
            if (next) {
                location.href = "./" + next;
                return;
            }
            mostrarEntrada();
        });
    });
})();
