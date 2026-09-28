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

    // RFC 1321. O navegador não oferece MD5 em SubtleCrypto.
    function md5(texto) {
        const deslocamentos = [
            7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
            5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
            4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
            6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
        ];
        const constantes = [
            0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
            0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
            0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
            0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
            0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
            0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
            0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
            0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
        ];
        const somar = (a, b) => (a + b) >>> 0;
        const girar = (valor, bits) => (valor << bits) | (valor >>> (32 - bits));
        const bytes = new TextEncoder().encode(String(texto));
        const tamanho = ((bytes.length + 9 + 63) & ~63) >>> 0;
        const bloco = new Uint8Array(tamanho);
        bloco.set(bytes);
        bloco[bytes.length] = 0x80;
        const vista = new DataView(bloco.buffer);
        const bits = bytes.length * 8;
        vista.setUint32(tamanho - 8, bits >>> 0, true);
        vista.setUint32(tamanho - 4, Math.floor(bits / 0x100000000), true);

        let a0 = 0x67452301;
        let b0 = 0xefcdab89;
        let c0 = 0x98badcfe;
        let d0 = 0x10325476;
        for (let inicio = 0; inicio < tamanho; inicio += 64) {
            const palavras = [];
            for (let indice = 0; indice < 16; indice++) palavras.push(vista.getUint32(inicio + indice * 4, true));
            let a = a0;
            let b = b0;
            let c = c0;
            let d = d0;
            for (let etapa = 0; etapa < 64; etapa++) {
                let f;
                let g;
                if (etapa < 16) {
                    f = (b & c) | (~b & d);
                    g = etapa;
                } else if (etapa < 32) {
                    f = (d & b) | (~d & c);
                    g = (5 * etapa + 1) % 16;
                } else if (etapa < 48) {
                    f = b ^ c ^ d;
                    g = (3 * etapa + 5) % 16;
                } else {
                    f = c ^ (b | ~d);
                    g = (7 * etapa) % 16;
                }
                f = somar(somar(somar(f >>> 0, a), constantes[etapa]), palavras[g]);
                a = d;
                d = c;
                c = b;
                b = somar(b, girar(f, deslocamentos[etapa]));
            }
            a0 = somar(a0, a);
            b0 = somar(b0, b);
            c0 = somar(c0, c);
            d0 = somar(d0, d);
        }
        const hex = (valor) => [0, 8, 16, 24].map((bits) => ((valor >>> bits) & 255).toString(16).padStart(2, "0")).join("");
        return hex(a0) + hex(b0) + hex(c0) + hex(d0);
    }

    function versaoDaSenha(senha) {
        const config = window.SITE_CONFIG || {};
        const hash = md5(senha || "");
        if (senha && hash === config.senhaAtual) return "atual";
        if (senha && (hash === config.senhaLegado || hash === "01c860da53e2e7ebd2ae0b30b62eb762")) return "legado";
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
