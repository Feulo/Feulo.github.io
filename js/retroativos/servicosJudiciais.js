(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.ServicosJudiciais = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    function reflexo(id, nome, valorCentavos) {
        return {
            id,
            nome,
            valorCentavos: Math.max(0, Math.round(valorCentavos)),
            sujeitaTeto: true,
            origem: "judicial"
        };
    }

    const REGISTRO = {
        reflexoPR: {
            id: "reflexoPR",
            nome: "Reflexo da PR em 13º e férias",
            calcular(contexto) {
                if (!contexto.adquireAvo) return [];
                const pr = contexto.valoresPerfil.pr?.valorCentavos || 0;
                return [
                    reflexo("pr-13", "Reflexo da PR no 13º", pr / 12),
                    reflexo("pr-ferias", "Reflexo da PR em férias + 1/3", pr / 9)
                ];
            }
        },
        quinquenio: {
            id: "quinquenio",
            nome: "Incorporação e reflexos do quinquênio",
            calcular(contexto, opcoes) {
                const quinquenio = contexto.valoresPerfil.quinquenio?.valorCentavos || 0;
                const itens = [];
                if (opcoes.incluirPrincipal) {
                    itens.push(reflexo("quinquenio-principal", "Diferença de quinquênio", quinquenio));
                }
                if (contexto.adquireAvo) {
                    itens.push(reflexo("quinquenio-13", "Reflexo do quinquênio no 13º", quinquenio / 12));
                    itens.push(reflexo("quinquenio-ferias", "Reflexo do quinquênio em férias + 1/3", quinquenio / 9));
                }
                return itens;
            }
        }
    };

    function calcularServicos(contexto, configuracao) {
        return Object.entries(configuracao || {}).flatMap(([id, opcoes]) => {
            const servico = REGISTRO[id];
            if (!servico || !opcoes?.ativo) return [];
            return servico.calcular(contexto, opcoes);
        });
    }

    return { REGISTRO, calcularServicos };
});
