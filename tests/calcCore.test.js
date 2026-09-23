const test = require("node:test");
const assert = require("node:assert/strict");

const Core = require("../js/retroativos/calcCore.js");
const Data = require("../js/domain/remuneracaoData.js");
const Judiciais = require("../js/retroativos/servicosJudiciais.js");
const Descontos = require("../js/retroativos/descontosHistoricos.js");

const rubrica = (nome, valor, sujeitaTeto = true) => ({
    nome,
    valorCentavos: Core.paraCentavos(valor),
    sujeitaTeto
});

test("gera mês parcial com divisor comercial de 30 dias", () => {
    const [agosto] = Core.gerarCompetencias("2023-08-14", "2023-08-31");
    assert.equal(agosto.competencia, "2023-08");
    assert.equal(agosto.diasTrabalhados, 17);
    assert.equal(agosto.eParcial, true);
    assert.equal(Core.proporcionalizar(100000, agosto.diasTrabalhados), 56667);
});

test("regra de 15 dias controla aquisição de avos", () => {
    assert.equal(Core.gerarCompetencias("2023-08-17", "2023-08-30")[0].adquireAvo, false);
    assert.equal(Core.gerarCompetencias("2023-08-16", "2023-08-30")[0].adquireAvo, true);
});

test("aplica apenas o abate incremental atribuível ao retroativo", () => {
    const resultado = Core.calcularCompetencia({
        tetoCentavos: Core.paraCentavos(10000),
        rubricasRecebidas: [rubrica("Recebido", 9000)],
        verbasDevidas: [rubrica("Retroativo", 3000)],
        reflexosJudiciais: []
    });
    assert.equal(resultado.abateOriginalCentavos, 0);
    assert.equal(resultado.abateIncrementalCentavos, Core.paraCentavos(2000));
    assert.equal(resultado.retroativoAjustadoCentavos, Core.paraCentavos(1000));
});

test("não cobra novamente abate que já existia na folha", () => {
    const resultado = Core.calcularCompetencia({
        tetoCentavos: Core.paraCentavos(10000),
        rubricasRecebidas: [rubrica("Recebido", 11000)],
        verbasDevidas: [rubrica("Retroativo", 3000)],
        reflexosJudiciais: []
    });
    assert.equal(resultado.abateOriginalCentavos, Core.paraCentavos(1000));
    assert.equal(resultado.abateRecalculadoCentavos, Core.paraCentavos(4000));
    assert.equal(resultado.abateIncrementalCentavos, Core.paraCentavos(3000));
});

test("verba fora do teto é integralmente preservada", () => {
    const resultado = Core.calcularCompetencia({
        tetoCentavos: Core.paraCentavos(10000),
        rubricasRecebidas: [rubrica("Recebido", 10000)],
        verbasDevidas: [rubrica("Indenização", 750, false)],
        reflexosJudiciais: []
    });
    assert.equal(resultado.abateIncrementalCentavos, 0);
    assert.equal(resultado.retroativoAjustadoCentavos, Core.paraCentavos(750));
});

test("respeita vigências distintas e mudança de teto por competência", () => {
    const competencias = Core.gerarCompetencias("2025-06-01", "2025-07-30");
    const resultado = Core.calcularRetroativos({
        competencias,
        rubricasRecebidas: ["base"],
        verbasDevidas: [{ tipo: "extra", inicio: "2025-07", fim: "2025-07", ativa: true }],
        obterTetoCentavos: (key) => Core.paraCentavos(Data.tetoNaCompetencia(key).valor),
        obterValoresPerfil: () => ({
            base: { nome: "Base", valorCentavos: Core.paraCentavos(34000), sujeitaTeto: true },
            extra: { nome: "Extra", valorCentavos: Core.paraCentavos(3000), sujeitaTeto: true }
        })
    });
    assert.equal(resultado.linhas[0].retroativoBrutoCentavos, 0);
    assert.equal(resultado.linhas[1].tetoCentavos, Core.paraCentavos(36301.53));
    assert.equal(resultado.linhas[1].retroativoAjustadoCentavos, Core.paraCentavos(2301.53));
});

test("serviços judiciais geram reflexos somente com pelo menos 15 dias", () => {
    const contexto = {
        adquireAvo: true,
        valoresPerfil: {
            pr: { valorCentavos: 120000 },
            quinquenio: { valorCentavos: 90000 }
        }
    };
    const itens = Judiciais.calcularServicos(contexto, {
        reflexoPR: { ativo: true },
        quinquenio: { ativo: true, incluirPrincipal: true }
    });
    assert.deepEqual(itens.map((item) => item.valorCentavos), [10000, 13333, 90000, 7500, 10000]);
    assert.deepEqual(Judiciais.calcularServicos({ ...contexto, adquireAvo: false }, {
        reflexoPR: { ativo: true }
    }), []);
});

test("deriva a cota do teto da competência", () => {
    assert.equal(Data.tetoNaCompetencia("2025-06").valor, 34572.89);
    assert.equal(Data.tetoNaCompetencia("2025-07").valor, 36301.53);
    assert.equal(Data.valorCota("2026-04"), 36301.53 / 12000);
});

test("calcula ATIN em 300 UFESPs pela competência", () => {
    assert.equal(Data.calcularRubricasPerfil({ cargo: 1, funcaoId: 39, icm: 0 }, "2025-06").atin, 11106);
    assert.equal(Data.calcularRubricasPerfil({ cargo: 1, funcaoId: 39, icm: 0 }, "2026-06").atin, 11526);
});

function perfilTurma(funcaoId, competencia) {
    const valores = Data.calcularRubricasPerfil({ cargo: 1, funcaoId, tempoServico: 0, icm: 0 }, competencia);
    return {
        vb: { nome: "Vencimento básico", valorCentavos: Core.paraCentavos(valores.vb), sujeitaTeto: true },
        pp: { nome: "Prêmio de produtividade", valorCentavos: Core.paraCentavos(valores.pp), sujeitaTeto: true },
        pl: { nome: "Pró-labore", valorCentavos: Core.paraCentavos(valores.pl), sujeitaTeto: true },
        atin: {
            nome: "ATIN",
            valorCentavos: Core.paraCentavos(valores.atin),
            sujeitaTeto: false,
            tributavel: false,
            liquida: true,
            proporcional: false
        }
    };
}

test("ATIN fica fora do teto e é pago integralmente", () => {
    const resultado = Core.calcularCompetencia({
        tetoCentavos: Core.paraCentavos(10000),
        rubricasRecebidas: [rubrica("Salário", 10000)],
        verbasDevidas: [{ ...rubrica("ATIN", 11526, false), liquida: true }],
        reflexosJudiciais: []
    });
    assert.equal(resultado.abateIncrementalCentavos, 0);
    assert.equal(resultado.retroativoBrutoCentavos, 0);
    assert.equal(resultado.retroLiquidoExtraCentavos, Core.paraCentavos(11526));
    assert.equal(resultado.retroativoAjustadoCentavos, Core.paraCentavos(11526));
    assert.equal(resultado.baseTributavelRecalculadaCentavos, Core.paraCentavos(10000));
});

test("override de bruto ajusta só o sujeito a teto e preserva ATIN líquido", () => {
    const competencias = Core.gerarCompetencias("2026-09-01", "2026-09-30");
    const vb = Core.paraCentavos(13008.05);
    const atin = Core.paraCentavos(11526);
    const resultado = Core.calcularRetroativos({
        competencias,
        overrides: { "2026-09": { brutoRecebidoCentavos: vb } },
        rubricasRecebidas: ["vb", "atin"],
        verbasDevidas: [],
        obterTetoCentavos: () => Core.paraCentavos(36301.53),
        obterValoresPerfil: () => ({
            vb: { nome: "VB", valorCentavos: vb, sujeitaTeto: true },
            atin: {
                nome: "ATIN",
                valorCentavos: atin,
                sujeitaTeto: false,
                liquida: true,
                proporcional: false
            }
        })
    });
    const [setembro] = resultado.linhas;
    assert.equal(setembro.brutoRecebidoCentavos, vb);
    assert.equal(setembro.liquidasRecebidasCentavos, atin);
    assert.equal(setembro.abateIncrementalCentavos, 0);
    assert.equal(setembro.baseTributavelOriginalCentavos, vb);
});

test("turma 2026 TI: agosto só VB; setembro VB+ATIN; PP e PL devidos", () => {
    const competencias = Core.gerarCompetencias("2026-08-14", "2026-09-30");
    const resultado = Core.calcularRetroativos({
        competencias,
        rubricasRecebidasPorCompetencia: {
            "2026-08": ["vb"],
            "2026-09": ["vb", "atin"]
        },
        dataIngresso: "2026-08-14",
        verbasDevidas: [
            { tipo: "pp", inicio: "2026-08", fim: "2026-09", ativa: true },
            { tipo: "pl", inicio: "2026-08", fim: "2026-09", ativa: true }
        ],
        obterTetoCentavos: (key) => Core.paraCentavos(Data.tetoNaCompetencia(key).valor),
        obterValoresPerfil: (key) => perfilTurma(57, key)
    });
    const [agosto, setembro] = resultado.linhas;
    const ago = perfilTurma(57, "2026-08");
    const set = perfilTurma(57, "2026-09");
    const ppAgo = Core.proporcionalizar(ago.pp.valorCentavos, 17);
    const plAgo = Core.proporcionalizar(ago.pl.valorCentavos, 17);

    assert.equal(agosto.diasTrabalhados, 17);
    assert.equal(agosto.brutoRecebidoCentavos, Core.proporcionalizar(ago.vb.valorCentavos, 17));
    assert.equal(agosto.liquidasRecebidasCentavos, 0);
    assert.equal(agosto.retroLiquidoExtraCentavos, 0);
    assert.equal(agosto.retroativoBrutoCentavos, ppAgo + plAgo);
    assert.equal(agosto.abateIncrementalCentavos, 0);

    assert.equal(setembro.brutoRecebidoCentavos, set.vb.valorCentavos);
    assert.equal(setembro.liquidasRecebidasCentavos, set.atin.valorCentavos);
    assert.equal(setembro.retroLiquidoExtraCentavos, 0);
    assert.equal(setembro.retroativoBrutoCentavos, set.pp.valorCentavos + set.pl.valorCentavos);
    assert.equal(setembro.abateIncrementalCentavos, 0);
});

test("turma 2026 GT: agosto só VB; setembro já correto", () => {
    const competencias = Core.gerarCompetencias("2026-08-14", "2026-09-30");
    const resultado = Core.calcularRetroativos({
        competencias,
        rubricasRecebidasPorCompetencia: {
            "2026-08": ["vb"],
            "2026-09": ["vb", "pp", "pl", "atin"]
        },
        dataIngresso: "2026-08-14",
        verbasDevidas: [
            { tipo: "pp", inicio: "2026-08", fim: "2026-08", ativa: true }
        ],
        obterTetoCentavos: (key) => Core.paraCentavos(Data.tetoNaCompetencia(key).valor),
        obterValoresPerfil: (key) => perfilTurma(39, key)
    });
    const [agosto, setembro] = resultado.linhas;
    const ago = perfilTurma(39, "2026-08");
    const set = perfilTurma(39, "2026-09");

    assert.equal(agosto.diasTrabalhados, 17);
    assert.equal(agosto.brutoRecebidoCentavos, Core.proporcionalizar(ago.vb.valorCentavos, 17));
    assert.equal(agosto.retroLiquidoExtraCentavos, 0);
    assert.equal(agosto.retroativoBrutoCentavos, Core.proporcionalizar(ago.pp.valorCentavos, 17));
    assert.equal(setembro.brutoRecebidoCentavos, set.vb.valorCentavos + set.pp.valorCentavos + set.pl.valorCentavos);
    assert.equal(setembro.liquidasRecebidasCentavos, set.atin.valorCentavos);
    assert.equal(setembro.retroativoBrutoCentavos, 0);
    assert.equal(setembro.retroLiquidoExtraCentavos, 0);
});

test("ATIN só é devido no mês seguinte ao ingresso", () => {
    assert.equal(Core.atinDevidoNaCompetencia("2026-08", "2026-08-14"), false);
    assert.equal(Core.atinDevidoNaCompetencia("2026-09", "2026-08-14"), true);
    const resultado = Core.calcularRetroativos({
        competencias: Core.gerarCompetencias("2026-08-14", "2026-09-30"),
        dataIngresso: "2026-08-14",
        rubricasRecebidasPorCompetencia: {
            "2026-08": ["vb"],
            "2026-09": ["vb"]
        },
        verbasDevidas: [{ tipo: "atin", inicio: "2026-08", fim: "2026-09", ativa: true }],
        obterTetoCentavos: (key) => Core.paraCentavos(Data.tetoNaCompetencia(key).valor),
        obterValoresPerfil: (key) => perfilTurma(39, key)
    });
    assert.equal(resultado.linhas[0].retroLiquidoExtraCentavos, 0);
    assert.equal(resultado.linhas[1].retroLiquidoExtraCentavos, perfilTurma(39, "2026-09").atin.valorCentavos);
});

test("usa a tabela histórica de IRRF da competência", () => {
    assert.equal(
        Descontos.calcularIrrf("2025-06", Core.paraCentavos(5000), Core.paraCentavos(5000)),
        Core.paraCentavos(466.27)
    );
    assert.equal(
        Descontos.calcularIrrf("2026-06", Core.paraCentavos(5000), Core.paraCentavos(5000)),
        0
    );
});

test("a partir de 2019 a contribuição oficial para no teto do RGPS", () => {
    const teto = Descontos.PREVIDENCIA.find((item) => item.inicio === "2026-01").faixas[3];
    const opcoes = { regime: "teto-rgps", dependentesIR: 0, complementarAtiva: false };
    const acima = Descontos.calcularDescontos("2026-06", Core.paraCentavos(20000), opcoes);
    const noTeto = Descontos.calcularDescontos("2026-06", Core.paraCentavos(teto), opcoes);
    const rpps = Descontos.calcularDescontos("2026-06", Core.paraCentavos(20000), {
        ...opcoes,
        regime: "RPPS"
    });

    assert.equal(acima.basePrevidenciaCentavos, Core.paraCentavos(teto));
    assert.equal(acima.previdenciaCentavos, noTeto.previdenciaCentavos);
    assert.equal(acima.complementarCentavos, 0);
    assert.ok(rpps.previdenciaCentavos > acima.previdenciaCentavos);

    const comComplementar = Descontos.calcularDescontos("2026-06", Core.paraCentavos(20000), {
        ...opcoes,
        complementarAtiva: true,
        percentualComplementar: 7.5
    });
    assert.equal(comComplementar.previdenciaCentavos, acima.previdenciaCentavos);
    assert.equal(
        comComplementar.complementarCentavos,
        Math.round((Core.paraCentavos(20000) - Core.paraCentavos(teto)) * 7.5 / 100)
    );
});

test("calcula somente a diferença dos descontos após o retroativo", () => {
    const resultado = Descontos.diferencaDescontos(
        "2025-06",
        Core.paraCentavos(7000),
        Core.paraCentavos(8000),
        {
            regime: "RGPS",
            dependentesIR: 0,
            complementarAtiva: true,
            percentualComplementar: 7.5,
            iamspeAtivo: true,
            percentualIamspe: 2
        }
    );
    assert.ok(resultado.diferenca.previdenciaCentavos > 0);
    assert.ok(resultado.diferenca.irrfCentavos > 0);
    assert.equal(resultado.diferenca.iamspeCentavos, Core.paraCentavos(20));
    assert.ok(resultado.diferenca.totalCentavos < Core.paraCentavos(1000));
});
