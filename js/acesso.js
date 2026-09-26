(function () {
    "use strict";

    const CHAVE = "sefaz-acesso";
    const PAGINAS = ["remuneracao.html", "retroativos.html"];
    const pathname = location.pathname;
    const emLegado = /\/legado\//.test(pathname);
    const pagina = pathname.split("/").pop() || "index.html";
    const ehLanding = !emLegado && (pagina === "" || pagina === "index.html");
    const raiz = emLegado ? "../" : "./";

    function versao() {
        const valor = sessionStorage.getItem(CHAVE);
        return valor === "legado" || valor === "atual" ? valor : "";
    }

    function arquivoSeguro(valor) {
        return /^[a-z0-9.-]+\.html$/i.test(valor || "") ? valor : "";
    }

    function destinoDa(versaoEscolhida, arquivo) {
        const nome = arquivoSeguro(arquivo);
        if (!nome) return "";
        if (versaoEscolhida === "legado" && PAGINAS.includes(nome)) return "./legado/" + nome;
        return "./" + nome;
    }

    function versaoDaSenha(senha) {
        const config = window.SITE_CONFIG || {};
        if (senha && senha === config.senhaAtual) return "atual";
        if (senha && (senha === config.senhaLegado || senha === "tartaruga")) return "legado";
        return "";
    }

    if (!ehLanding) {
        const atual = versao();
        if (!atual) {
            location.replace(raiz + "index.html?next=" + encodeURIComponent(pagina));
            return;
        }
        if (emLegado && atual !== "legado") {
            location.replace("../" + pagina);
            return;
        }
        if (!emLegado && atual === "legado" && PAGINAS.includes(pagina)) {
            location.replace("./legado/" + pagina);
            return;
        }
    }

    function mostrarEntrada() {
        const form = document.getElementById("formAcesso");
        const atalhos = document.getElementById("atalhos");
        if (!form || !atalhos) return;
        form.classList.add("d-none");
        atalhos.classList.remove("d-none");
        const escolhida = versao();
        atalhos.querySelectorAll("[data-versao]").forEach((bloco) => {
            bloco.classList.toggle("d-none", bloco.dataset.versao !== escolhida);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("formAcesso");
        if (!form) return;
        if (versao()) mostrarEntrada();

        form.addEventListener("submit", (evento) => {
            evento.preventDefault();
            const senha = document.getElementById("senha").value;
            const erro = document.getElementById("erroSenha");
            const escolhida = versaoDaSenha(senha);
            if (!escolhida) {
                erro.classList.remove("d-none");
                document.getElementById("senha").focus();
                return;
            }
            sessionStorage.setItem(CHAVE, escolhida);
            erro.classList.add("d-none");
            const destino = destinoDa(escolhida, new URLSearchParams(location.search).get("next"));
            if (destino) {
                location.href = destino;
                return;
            }
            mostrarEntrada();
        });
    });
})();
