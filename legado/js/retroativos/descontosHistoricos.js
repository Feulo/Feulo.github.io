(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.DescontosHistoricos = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const FONTE_INSS = "https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal/tabela-de-contribuicao-historico";
    const FONTE_IR = "https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas";
    const FONTE_RPPS = "https://portal.fazenda.sp.gov.br/servicos/folha/Paginas/Contribuicao_Previdenciaria_Servidores_Ativos.aspx";

    const PREVIDENCIA = [
        { inicio: "2021-01", fim: "2021-12", minimo: 1100, limiteRpps2: 3160.45, faixas: [1100, 2203.48, 3305.22, 6433.57] },
        { inicio: "2022-01", fim: "2022-12", minimo: 1212, limiteRpps2: 3473.38, faixas: [1212, 2427.35, 3641.03, 7087.22] },
        { inicio: "2023-01", fim: "2023-04", minimo: 1302, limiteRpps2: 3722.56, faixas: [1302, 2571.29, 3856.94, 7507.49] },
        { inicio: "2023-05", fim: "2023-12", minimo: 1320, limiteRpps2: 3722.56, faixas: [1302, 2571.29, 3856.94, 7507.49] },
        { inicio: "2024-01", fim: "2024-12", minimo: 1412, limiteRpps2: 3842.09, faixas: [1412, 2666.68, 4000.03, 7786.02] },
        { inicio: "2025-01", fim: "2025-12", minimo: 1518, limiteRpps2: 4022.46, faixas: [1518, 2793.88, 4190.83, 8157.41] },
        { inicio: "2026-01", fim: "2099-12", minimo: 1621, limiteRpps2: 4174.58, faixas: [1621, 2902.84, 4354.27, 8475.55] }
    ];

    const IRRF = [
        { inicio: "2021-01", fim: "2023-04", isento: 1903.98, deducoes: [142.80, 354.80, 636.13, 869.36] },
        { inicio: "2023-05", fim: "2024-01", isento: 2112, deducoes: [158.40, 370.40, 651.73, 884.96] },
        { inicio: "2024-02", fim: "2025-04", isento: 2259.20, deducoes: [169.44, 381.44, 662.77, 896] },
        { inicio: "2025-05", fim: "2099-12", isento: 2428.80, deducoes: [182.16, 394.16, 675.49, 908.73] }
    ];

    const LIMITES_IR = [2826.65, 3751.05, 4664.68, Infinity];
    const ALIQUOTAS_IR = [0.075, 0.15, 0.225, 0.275];
    const DEDUCAO_DEPENDENTE = 189.59;

    function paraCentavos(valor) {
        return Math.round((Number(valor) || 0) * 100);
    }

    function tabelaNaCompetencia(tabelas, competencia) {
        return tabelas.find((item) => competencia >= item.inicio && competencia <= item.fim) || null;
    }

    function calcularProgressivo(baseCentavos, limitesReais, aliquotas) {
        const base = Math.max(0, baseCentavos);
        let total = 0;
        let anterior = 0;
        limitesReais.forEach((limite, indice) => {
            const limiteCentavos = Number.isFinite(limite) ? paraCentavos(limite) : Infinity;
            const parcela = Math.max(0, Math.min(base, limiteCentavos) - anterior);
            total += parcela * aliquotas[indice];
            anterior = limiteCentavos;
        });
        return Math.round(total);
    }

    function calcularPrevidencia(competencia, baseCentavos, regime) {
        const tabela = tabelaNaCompetencia(PREVIDENCIA, competencia);
        if (!tabela) throw new Error(`Não há tabela previdenciária para ${competencia}.`);
        if (regime === "RPPS") {
            return calcularProgressivo(
                baseCentavos,
                [tabela.minimo, tabela.limiteRpps2, tabela.faixas[3], Infinity],
                [0.11, 0.12, 0.14, 0.16]
            );
        }
        return calcularProgressivo(baseCentavos, tabela.faixas, [0.075, 0.09, 0.12, 0.14]);
    }

    function calcularComplementar(competencia, baseCentavos, percentual) {
        const tabela = tabelaNaCompetencia(PREVIDENCIA, competencia);
        const excedente = Math.max(0, baseCentavos - paraCentavos(tabela.faixas[3]));
        return Math.round(excedente * Math.max(0, Number(percentual) || 0) / 100);
    }

    function calcularIrrf(competencia, rendimentoCentavos, baseCentavos) {
        const tabela = tabelaNaCompetencia(IRRF, competencia);
        if (!tabela) throw new Error(`Não há tabela de IRRF para ${competencia}.`);
        const base = Math.max(0, baseCentavos) / 100;
        if (base <= tabela.isento) return 0;
        const indice = LIMITES_IR.findIndex((limite) => base <= limite);
        const impostoTabela = Math.max(0, base * ALIQUOTAS_IR[indice] - tabela.deducoes[indice]);
        let reducao = 0;
        if (competencia >= "2026-01") {
            const rendimento = Math.max(0, rendimentoCentavos) / 100;
            if (rendimento <= 5000) reducao = impostoTabela;
            else if (rendimento <= 7350) reducao = Math.max(0, 978.62 - 0.133145 * rendimento);
        }
        return paraCentavos(Math.max(0, impostoTabela - Math.min(impostoTabela, reducao)));
    }

    function calcularDescontos(competencia, baseCentavos, opcoes) {
        const tabelaPrevidencia = tabelaNaCompetencia(PREVIDENCIA, competencia);
        const tetoRgpsCentavos = paraCentavos(tabelaPrevidencia.faixas[3]);
        const limitadoAoTetoRgps = opcoes.regime !== "RPPS" || opcoes.complementarAtiva;
        const basePrevidenciaCentavos = limitadoAoTetoRgps
            ? Math.min(baseCentavos, tetoRgpsCentavos)
            : baseCentavos;
        const previdenciaCentavos = calcularPrevidencia(
            competencia,
            basePrevidenciaCentavos,
            opcoes.regime === "RPPS" ? "RPPS" : "RGPS"
        );
        const complementarCentavos = opcoes.complementarAtiva
            ? calcularComplementar(competencia, baseCentavos, opcoes.percentualComplementar)
            : 0;
        const deducaoDependentes = paraCentavos(DEDUCAO_DEPENDENTE * Math.max(0, opcoes.dependentesIR || 0));
        const baseIrrfCentavos = Math.max(
            0,
            baseCentavos - previdenciaCentavos - complementarCentavos - deducaoDependentes
        );
        const irrfCentavos = calcularIrrf(competencia, baseCentavos, baseIrrfCentavos);
        const iamspeCentavos = opcoes.iamspeAtivo
            ? Math.round(baseCentavos * Math.max(0, Number(opcoes.percentualIamspe) || 0) / 100)
            : 0;
        const totalCentavos = previdenciaCentavos + complementarCentavos + irrfCentavos + iamspeCentavos;
        return {
            baseCentavos,
            basePrevidenciaCentavos,
            previdenciaCentavos,
            complementarCentavos,
            baseIrrfCentavos,
            irrfCentavos,
            iamspeCentavos,
            totalCentavos,
            liquidoCentavos: baseCentavos - totalCentavos
        };
    }

    function diferencaDescontos(competencia, baseOriginalCentavos, baseRecalculadaCentavos, opcoes) {
        const original = calcularDescontos(competencia, baseOriginalCentavos, opcoes);
        const recalculado = calcularDescontos(competencia, baseRecalculadaCentavos, opcoes);
        const diferenca = {};
        ["previdenciaCentavos", "complementarCentavos", "irrfCentavos", "iamspeCentavos", "totalCentavos"]
            .forEach((campo) => {
                diferenca[campo] = Math.max(0, recalculado[campo] - original[campo]);
            });
        return { original, recalculado, diferenca };
    }

    return {
        PREVIDENCIA,
        IRRF,
        FONTE_INSS,
        FONTE_IR,
        FONTE_RPPS,
        calcularPrevidencia,
        calcularIrrf,
        calcularDescontos,
        diferencaDescontos
    };
});
