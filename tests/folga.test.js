const test = require("node:test");
const assert = require("node:assert/strict");
const Folga = require("../js/folga/engine.js");

const base = {
    year: 2027,
    from: 1,
    to: 12,
    mode: 3,
    minBlock: 0,
    minOneBlock: 0,
    lp: 0,
    abonadas: 6,
    eleitoral: 0,
    escala: 0,
    ufesp: 38.5,
    pr: 12000,
    maxDil: 1,
    city: "saopaulo"
};

function modelo(city) {
    const mapa = Folga.buildHolidayMap(2027, city || "saopaulo", [], {});
    return Folga.buildModel(2027, mapa);
}

test("calendário de 2027 confere Páscoa, Carnaval, Corpus e as pontes", () => {
    assert.deepEqual(Folga.holidaySelfCheck(), []);
});

test("a busca devolve descanso em dias e respeita férias, ATIN e PR", () => {
    const resultado = Folga.optimize(modelo(), base);
    assert.equal(resultado.error, undefined);
    assert.equal(resultado.plans.length, 3);

    const rotulos = resultado.plans.map((plano) => plano.label);
    assert.deepEqual(rotulos, ["Máximo descanso", "Menor perda", "Maior sequência"]);

    resultado.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        assert.equal(plano.atinOk, true);
        assert.equal(plano.prOk, true);
        assert.equal(plano.dilOk, true);
        assert.equal(plano.atinLoss, 0);
        assert.ok(plano.rest >= plano.spent);

        const ferias = plano.blocks.filter((bloco) => bloco.type === "ferias");
        assert.equal(ferias.length, 3);
        ferias.forEach((bloco) => {
            assert.ok(bloco.startDow >= 1 && bloco.startDow <= 5);
            assert.ok(bloco.endDow >= 1 && bloco.endDow <= 5);
            assert.ok(bloco.counts.every((dias) => dias <= 20));
        });
        const abonadasPorMes = {};
        plano.singles.filter((dia) => dia.type === "abonada").forEach((dia) => {
            const mes = dia.iso.slice(0, 7);
            abonadasPorMes[mes] = (abonadasPorMes[mes] || 0) + 1;
        });
        Object.values(abonadasPorMes).forEach((qtd) => assert.ok(qtd <= 1));
    });

    const maximo = resultado.plans[0];
    const menor = resultado.plans[1];
    assert.ok(maximo.rest >= menor.rest);
    assert.equal(menor.prLoss, 0);
    assert.equal(menor.used.abonada, 0);
    assert.equal(menor.used.lp, 0);
});

test("um bloco de 30 dias quebra o mês para não passar de 20 no ATIN", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 1, abonadas: 0 }));
    assert.equal(resultado.plans[0].blocks.length, 1);
    const bloco = resultado.plans[0].blocks[0];
    assert.equal(bloco.len, 30);
    const meses = bloco.counts.filter((dias) => dias > 0);
    assert.equal(meses.length, 2);
    assert.ok(meses.every((dias) => dias <= 20 && dias >= 10));
});

test("trinta dias dentro de um único mês não têm saída sem perder o ATIN", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 1, from: 3, to: 3 }));
    assert.match(resultado.error, /20 dias/);
});

test("exige que ao menos um período tenha no mínimo N dias (ex.: 3 períodos sendo um >= 18)", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 3, minBlock: 2, minOneBlock: 18 }));
    assert.equal(resultado.error, undefined);
    resultado.plans.forEach((plano) => {
        const ferias = plano.blocks.filter((b) => b.type === "ferias");
        assert.equal(ferias.length, 3);
        assert.ok(ferias.every((b) => b.len >= 2));
        assert.ok(ferias.some((b) => b.len >= 18));
    });
});

test("permite fixar um período no calendário e otimizar os dias restantes", () => {
    const fixo = {
        "2027-02-11": "ferias",
        "2027-02-12": "ferias"
    };
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 3, minOneBlock: 15 }), fixo);
    assert.equal(resultado.error, undefined);
    assert.equal(resultado.fixedSummary.feriasDays, 2);
    resultado.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        const ferias = plano.blocks.filter((b) => b.type === "ferias");
        assert.equal(ferias.length, 3);
        const fixado = ferias.find((b) => b.start === "2027-02-11" && b.end === "2027-02-12");
        assert.ok(fixado && fixado.locked);
        assert.ok(ferias.some((b) => b.len >= 15));
    });
});
