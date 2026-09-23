(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.CalcRetroativos = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    function paraCentavos(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
    }

    function deCentavos(valor) {
        return Number(valor || 0) / 100;
    }

    function somarCentavos(itens) {
        return itens.reduce((total, item) => total + Math.trunc(item || 0), 0);
    }

    function chaveCompetencia(ano, mes) {
        return `${ano}-${String(mes).padStart(2, "0")}`;
    }

    function dataLocal(valor) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) return null;
        const [ano, mes, dia] = valor.split("-").map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
        return data;
    }

    function diasComerciaisNoMes(ano, mes, inicio, fim) {
        const key = chaveCompetencia(ano, mes);
        const inicioKey = chaveCompetencia(inicio.getFullYear(), inicio.getMonth() + 1);
        const fimKey = chaveCompetencia(fim.getFullYear(), fim.getMonth() + 1);
        const primeiroDia = key === inicioKey ? Math.min(30, inicio.getDate()) : 1;
        const ultimoDia = key === fimKey ? Math.min(30, fim.getDate()) : 30;
        return Math.max(0, ultimoDia - primeiroDia + 1);
    }

    function gerarCompetencias(dataInicio, dataFim) {
        const inicio = dataLocal(dataInicio);
        const fim = dataLocal(dataFim);
        if (!inicio || !fim || inicio > fim) return [];

        const competencias = [];
        let ano = inicio.getFullYear();
        let mes = inicio.getMonth() + 1;
        const fimKey = chaveCompetencia(fim.getFullYear(), fim.getMonth() + 1);

        while (chaveCompetencia(ano, mes) <= fimKey) {
            const diasTrabalhados = diasComerciaisNoMes(ano, mes, inicio, fim);
            competencias.push({
                competencia: chaveCompetencia(ano, mes),
                diasTrabalhados,
                eParcial: diasTrabalhados < 30,
                adquireAvo: diasTrabalhados >= 15,
                proporcao: diasTrabalhados / 30
            });
            mes += 1;
            if (mes === 13) {
                mes = 1;
                ano += 1;
            }
        }
        return competencias;
    }

    function estaNaVigencia(competencia, inicio, fim) {
        return (!inicio || competencia >= inicio) && (!fim || competencia <= fim);
    }

    function competenciaDaData(valor) {
        const data = dataLocal(valor);
        return data ? chaveCompetencia(data.getFullYear(), data.getMonth() + 1) : null;
    }

    function proximaCompetencia(competencia) {
        if (!/^\d{4}-\d{2}$/.test(competencia || "")) return competencia;
        const [ano, mes] = competencia.split("-").map(Number);
        return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`;
    }

    function atinDevidoNaCompetencia(competencia, dataIngresso) {
        const ingresso = competenciaDaData(dataIngresso);
        return !ingresso || competencia > ingresso;
    }

    function eVerbaAtin(verba) {
        return verba?.tipo === "atin" || verba?.id === "atin" || /(?:^|-)atin$/.test(String(verba?.id || ""));
    }

    function proporcionalizar(valorCentavos, diasTrabalhados) {
        return Math.round(valorCentavos * Math.min(30, Math.max(0, diasTrabalhados)) / 30);
    }

    function normalizarRubrica(rubrica, diasTrabalhados) {
        const valorCheioCentavos = "valorCheioCentavos" in rubrica
            ? Math.trunc(rubrica.valorCheioCentavos)
            : paraCentavos(rubrica.valorCheio);
        const valorCentavos = rubrica.proporcional === false
            ? valorCheioCentavos
            : proporcionalizar(valorCheioCentavos, diasTrabalhados);
        return {
            id: rubrica.id,
            nome: rubrica.nome,
            valorCheioCentavos,
            valorCentavos,
            sujeitaTeto: rubrica.sujeitaTeto !== false,
            tributavel: rubrica.tributavel !== false,
            liquida: rubrica.liquida === true,
            origem: rubrica.origem || "verba"
        };
    }

    function calcularCompetencia(dados) {
        const tetoCentavos = Math.max(0, Math.trunc(dados.tetoCentavos || 0));
        const recebidas = dados.rubricasRecebidas || [];
        const devidas = dados.verbasDevidas || [];
        const reflexos = dados.reflexosJudiciais || [];
        const brutoRecebidoCentavos = somarCentavos(
            recebidas.filter((item) => item.sujeitaTeto !== false).map((item) => item.valorCentavos)
        );
        const foraTetoRecebidoCentavos = somarCentavos(
            recebidas.filter((item) => item.sujeitaTeto === false).map((item) => item.valorCentavos)
        );
        const liquidasRecebidasCentavos = somarCentavos(
            recebidas.filter((item) => item.liquida === true).map((item) => item.valorCentavos)
        );
        const foraTetoBrutoRecebidoCentavos = foraTetoRecebidoCentavos - liquidasRecebidasCentavos;
        const retroativos = [...devidas, ...reflexos];
        const retroSujeitoCentavos = somarCentavos(
            retroativos.filter((item) => item.sujeitaTeto !== false).map((item) => item.valorCentavos)
        );
        const retroForaTetoCentavos = somarCentavos(
            retroativos.filter((item) => item.sujeitaTeto === false).map((item) => item.valorCentavos)
        );
        const retroLiquidoExtraCentavos = somarCentavos(
            retroativos.filter((item) => item.liquida === true).map((item) => item.valorCentavos)
        );
        const retroForaTetoBrutoCentavos = retroForaTetoCentavos - retroLiquidoExtraCentavos;

        const abateOriginalCentavos = Math.max(0, brutoRecebidoCentavos - tetoCentavos);
        const abateRecalculadoCentavos = Math.max(
            0,
            brutoRecebidoCentavos + retroSujeitoCentavos - tetoCentavos
        );
        const abateIncrementalCentavos = Math.max(0, abateRecalculadoCentavos - abateOriginalCentavos);
        const retroativoAjustadoCentavos =
            retroSujeitoCentavos - abateIncrementalCentavos + retroForaTetoCentavos;
        const baseTributavelOriginalCentavos = Math.min(brutoRecebidoCentavos, tetoCentavos);
        const baseTributavelRecalculadaCentavos = Math.min(
            brutoRecebidoCentavos + retroSujeitoCentavos,
            tetoCentavos
        );

        return {
            ...dados,
            brutoRecebidoCentavos,
            foraTetoRecebidoCentavos,
            liquidasRecebidasCentavos,
            foraTetoBrutoRecebidoCentavos,
            retroativoBrutoCentavos: retroSujeitoCentavos + retroForaTetoBrutoCentavos,
            retroSujeitoCentavos,
            retroForaTetoCentavos,
            retroForaTetoBrutoCentavos,
            retroLiquidoExtraCentavos,
            abateOriginalCentavos,
            abateRecalculadoCentavos,
            abateIncrementalCentavos,
            retroativoAjustadoCentavos,
            baseTributavelOriginalCentavos,
            baseTributavelRecalculadaCentavos,
            remuneracaoBrutaOriginalCentavos: brutoRecebidoCentavos + foraTetoBrutoRecebidoCentavos,
            remuneracaoTotalOriginalCentavos:
                brutoRecebidoCentavos + foraTetoBrutoRecebidoCentavos + liquidasRecebidasCentavos,
            remuneracaoBrutaRecalculadaCentavos:
                brutoRecebidoCentavos + foraTetoBrutoRecebidoCentavos + retroSujeitoCentavos + retroForaTetoBrutoCentavos,
            remuneracaoTotalRecalculadaCentavos:
                brutoRecebidoCentavos + foraTetoBrutoRecebidoCentavos + liquidasRecebidasCentavos +
                retroSujeitoCentavos + retroForaTetoBrutoCentavos + retroLiquidoExtraCentavos,
            remuneracaoAposTetoOriginalCentavos:
                baseTributavelOriginalCentavos + foraTetoBrutoRecebidoCentavos + liquidasRecebidasCentavos,
            remuneracaoAposTetoRecalculadaCentavos:
                baseTributavelRecalculadaCentavos + foraTetoBrutoRecebidoCentavos + liquidasRecebidasCentavos +
                retroForaTetoBrutoCentavos + retroLiquidoExtraCentavos
        };
    }

    function calcularRetroativos(configuracao) {
        const linhas = configuracao.competencias.map((base) => {
            const competencia = base.competencia;
            const override = (configuracao.overrides || {})[competencia] || {};
            const diasTrabalhados = override.diasTrabalhados ?? base.diasTrabalhados;
            const tetoCentavos = override.tetoCentavos ?? configuracao.obterTetoCentavos(competencia);
            if (!Number.isInteger(tetoCentavos) || tetoCentavos <= 0) {
                throw new Error(`Informe o teto da competência ${competencia}.`);
            }

            const valoresPerfil = configuracao.obterValoresPerfil(competencia);
            const idsRecebidos = configuracao.rubricasRecebidasPorCompetencia?.[competencia]
                || configuracao.rubricasRecebidas
                || [];
            let recebidas = idsRecebidos
                .filter((id) => valoresPerfil[id])
                .map((id) => normalizarRubrica({
                    id,
                    nome: valoresPerfil[id].nome,
                    valorCheioCentavos: valoresPerfil[id].valorCentavos,
                    sujeitaTeto: valoresPerfil[id].sujeitaTeto,
                    tributavel: valoresPerfil[id].tributavel,
                    liquida: valoresPerfil[id].liquida,
                    proporcional: valoresPerfil[id].proporcional
                }, diasTrabalhados));
            if (Number.isInteger(override.brutoRecebidoCentavos)) {
                const calculado = somarCentavos(
                    recebidas
                        .filter((item) => item.sujeitaTeto !== false)
                        .map((item) => item.valorCentavos)
                );
                const ajuste = override.brutoRecebidoCentavos - calculado;
                if (ajuste !== 0) {
                    recebidas.push({
                        id: "override-bruto",
                        nome: "Ajuste manual da remuneração",
                        valorCheioCentavos: ajuste,
                        valorCentavos: ajuste,
                        sujeitaTeto: true,
                        tributavel: true,
                        liquida: false,
                        origem: "ajuste"
                    });
                }
            }

            const devidas = (configuracao.verbasDevidas || [])
                .filter((verba) => verba.ativa !== false && estaNaVigencia(competencia, verba.inicio, verba.fim))
                .filter((verba) => !eVerbaAtin(verba) || atinDevidoNaCompetencia(competencia, configuracao.dataIngresso))
                .map((verba) => {
                    const origem = verba.tipo === "personalizada"
                        ? {
                            nome: verba.nome || "Outra verba",
                            valorCentavos: paraCentavos(verba.valor),
                            sujeitaTeto: verba.sujeitaTeto !== false,
                            tributavel: verba.tributavel !== false,
                            liquida: verba.liquida === true
                        }
                        : valoresPerfil[verba.tipo];
                    if (!origem) return null;
                    return normalizarRubrica({
                        id: verba.id || verba.tipo,
                        nome: origem.nome,
                        valorCheioCentavos: origem.valorCentavos,
                        sujeitaTeto: verba.sujeitaTeto ?? origem.sujeitaTeto,
                        tributavel: verba.tributavel ?? origem.tributavel,
                        liquida: verba.liquida ?? origem.liquida,
                        proporcional: verba.proporcional ?? origem.proporcional,
                        origem: "retroativo"
                    }, diasTrabalhados);
                })
                .filter(Boolean);

            const contexto = {
                ...base,
                diasTrabalhados,
                eParcial: diasTrabalhados < 30,
                adquireAvo: diasTrabalhados >= 15,
                valoresPerfil,
                recebidas,
                devidas
            };
            const reflexos = configuracao.calcularServicos
                ? configuracao.calcularServicos(contexto, configuracao.servicos || {})
                : [];

            return calcularCompetencia({
                ...contexto,
                tetoCentavos,
                rubricasRecebidas: recebidas,
                verbasDevidas: devidas,
                reflexosJudiciais: reflexos
            });
        });

        const totais = linhas.reduce((acc, linha) => {
            acc.brutoCentavos += linha.retroativoBrutoCentavos;
            acc.abateCentavos += linha.abateIncrementalCentavos;
            acc.ajustadoCentavos += linha.retroativoAjustadoCentavos;
            acc.reflexosCentavos += somarCentavos(linha.reflexosJudiciais.map((item) => item.valorCentavos));
            acc.liquidasExtraCentavos += linha.retroLiquidoExtraCentavos;
            return acc;
        }, {
            brutoCentavos: 0,
            abateCentavos: 0,
            ajustadoCentavos: 0,
            reflexosCentavos: 0,
            liquidasExtraCentavos: 0
        });

        return { linhas, totais };
    }

    return {
        paraCentavos,
        deCentavos,
        somarCentavos,
        gerarCompetencias,
        estaNaVigencia,
        competenciaDaData,
        proximaCompetencia,
        atinDevidoNaCompetencia,
        proporcionalizar,
        normalizarRubrica,
        calcularCompetencia,
        calcularRetroativos
    };
});
